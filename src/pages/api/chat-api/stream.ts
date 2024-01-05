// src/pages/api/chat-api/stream.ts

import { fetchContexts } from '../getContexts';
import { OpenAIModelID, OpenAIModels } from '~/types/openai';
import { ChatBody, Content, Message } from '~/types/chat';
import { fetchCourseMetadata } from '~/utils/apiUtils';
import { validateApiKeyAndRetrieveData } from './keys/validate';
import { get_user_permission } from '~/components/UIUC-Components/runAuthCheck';
import posthog from 'posthog-js';
import { User } from '@clerk/nextjs/dist/types/server';
import { NextRequest, NextResponse } from 'next/server';
import { CourseMetadata } from '~/types/courseMetadata';
import {
    attachContextsToLastMessage,
    constructChatBody,
    constructSearchQuery,
    determineAndValidateOpenAIKey,
    getBaseUrl,
    handleImageContent,
    handleNonStreamingResponse,
    handleStreamingResponse,
    validateRequestBody,
} from '~/utils/streamProcessing';

// Configuration for the runtime environment
export const config = {
    runtime: 'edge',
};

/**
 * The stream API endpoint for handling chat requests and streaming responses.
 * This function orchestrates the validation of the request, user permissions,
 * fetching of necessary data, and the construction and handling of the chat response.
 *
 * @param {NextRequest} req - The incoming Next.js API request object.
 * @returns {Promise<NextResponse>} A promise that resolves to the Next.js API response object.
 */
export default async function stream(req: NextRequest): Promise<NextResponse> {
    // Validate the HTTP method
    if (req.method !== 'POST') {
        console.error('Invalid request method:', req.method);
        posthog.capture('stream_api_invalid_method', {
            distinct_id: req.headers.get('x-forwarded-for') || req.ip,
            method: req.method,
        });
        return new NextResponse(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    }

    // Parse and validate the request body
    const body = await req.json();
    if (!validateRequestBody(body)) {
        console.error('Invalid request body:', body);
        posthog.capture('Invalid Request Body', {
            distinct_id: req.headers.get('x-forwarded-for') || req.ip,
            body: body,
        });
        return new NextResponse(JSON.stringify({ error: 'Invalid request body' }), { status: 400 });
    }

    // Destructure the necessary properties from the request body
    const { model, conversation, openai_key, prompt, temperature, course_name, stream, api_key } = body;

    // Validate the API key and retrieve user data
    const { isValidApiKey, userObject }: { isValidApiKey: boolean; userObject: User | null } = await validateApiKeyAndRetrieveData(api_key, course_name);

    if (!isValidApiKey) {
        posthog.capture('stream_api_invalid_api_key', {
            distinct_id: req.headers.get('x-forwarded-for') || req.ip,
            api_key: api_key,
            user_id: userObject?.id,
        });
        return new NextResponse(JSON.stringify({ error: 'Invalid API key' }), { status: 403 });
    }

    // Retrieve course metadata
    const courseMetadata: CourseMetadata = await fetchCourseMetadata(course_name);
    if (!courseMetadata) {
        return NextResponse.json({ error: 'Course metadata not found' }, { status: 404 });
    }

    // Determine and validate the OpenAI key to use
    let key: string;
    try {
        key = await determineAndValidateOpenAIKey(openai_key, courseMetadata, model);
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 400 });
    }

    // Check user permissions
    const permission = get_user_permission(courseMetadata, {
        isLoaded: true,
        isSignedIn: true,
        user: userObject,
    }, req);

    if (permission !== 'edit') {
        posthog.capture('stream_api_permission_denied', {
            distinct_id: req.headers.get('x-forwarded-for') || req.ip,
            permission: permission,
            user_id: userObject?.id,
        });
        return NextResponse.json({ error: 'You do not have permission to perform this action' }, { status: 403 });
    }

    // Ensure there are messages in the conversation
    if (conversation.messages.length === 0) {
        console.error('No messages in conversation');
        return NextResponse.json({ error: 'No messages in conversation' }, { status: 400 });
    }

    // Attach the model, prompt, and temperature to the conversation
    conversation.model = model;
    conversation.prompt = prompt;
    conversation.temperature = temperature;

    // Get the last message in the conversation
    const lastMessage = conversation.messages[conversation.messages.length - 1] as Message;

    // Construct the search query
    let searchQuery = constructSearchQuery(conversation);

    // Handle image content if it exists
    const imageContent = (lastMessage.content as Content[]).filter(content => content.type === 'image_url');
    if (imageContent.length > 0) {
        searchQuery = await handleImageContent(lastMessage, course_name, conversation, searchQuery, courseMetadata, openai_key, new AbortController())
    }

    // Fetch Contexts
    const contexts = await fetchContexts(course_name, searchQuery, OpenAIModels[model as OpenAIModelID].tokenLimit);

    // Check if contexts were found
    if (contexts.length === 0) {
        console.error('No contexts found');
        posthog.capture('stream_api_no_contexts_found', {
            distinct_id: req.headers.get('x-forwarded-for') || req.ip,
            user_id: userObject?.id,
        });
        return NextResponse.json({ error: 'No contexts found' }, { status: 500 });
    }

    // Attach contexts to the last message
    attachContextsToLastMessage(lastMessage, contexts);

    // Construct the chat body for the API request
    const chatBody: ChatBody = constructChatBody(model, conversation, key, prompt, temperature, course_name, stream);

    // Make the API request to the chat handler
    const baseUrl = getBaseUrl()
    // console.log('baseUrl:', baseUrl);
    const apiResponse: NextResponse = await fetch(baseUrl + '/api/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(chatBody),
    }) as NextResponse;

    // Handle errors from the chat handler API
    if (!apiResponse.ok) {
        console.error('API error:', apiResponse.statusText);
        posthog.capture('stream_api_error', {
            distinct_id: req.headers.get('x-forwarded-for') || req.ip,
            error: apiResponse.statusText,
            status: apiResponse.status,
            user_id: userObject?.id,
        });
        return new NextResponse(JSON.stringify({ error: `API error: ${apiResponse.statusText}` }), { status: apiResponse.status });
    }

    // Stream the response or return it as a single message
    if (stream) {
        posthog.capture('stream_api_streaming_started', {
            distinct_id: req.headers.get('x-forwarded-for') || req.ip,
            user_id: userObject?.id,
        });
        return await handleStreamingResponse(apiResponse, conversation, req, userObject as User);
    } else {
        posthog.capture('stream_api_response_sent', {
            distinct_id: req.headers.get('x-forwarded-for') || req.ip,
            user_id: userObject?.id,
        });
        return await handleNonStreamingResponse(apiResponse, conversation, req, userObject as User);
    }
}