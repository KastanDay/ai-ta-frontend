// src/pages/api/chat-api/stream.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { fetchContexts } from '../getContexts';
import { OpenAIModel, OpenAIModelID, OpenAIModels } from '~/types/openai';
import { ChatApiBody, ChatBody, ContextWithMetadata, Conversation, Message } from '~/types/chat';
import logConversationToSupabase from '../UIUC-api/logConversationToSupabase';
import { fetchCourseMetadata, fetchPresignedUrl } from '~/utils/apiUtils';
import { validateApiKeyAndRetrieveData } from './keys/validate';
import { get_user_permission } from '~/components/UIUC-Components/runAuthCheck';
import posthog from 'posthog-js';
import { User } from '@clerk/nextjs/dist/types/server';
import { NextRequest, NextResponse } from 'next/server';
import { CourseMetadata } from '~/types/courseMetadata';
import { decrypt } from '~/utils/crypto';
import { OpenAIError } from '~/utils/server';

// Configuration for the runtime environment
export const config = {
    runtime: 'edge',
};

/**
 * Determines the OpenAI key to use and validates it by checking available models.
 * @param openai_key - The OpenAI key provided in the request.
 * @param courseMetadata - The course metadata containing the fallback OpenAI key.
 * @param modelId - The model identifier to validate against the available models.
 * @returns {Promise<string>} The validated OpenAI key.
 */
async function determineAndValidateOpenAIKey(openai_key: string | undefined, courseMetadata: CourseMetadata, modelId: string): Promise<string> {
    const keyToUse = openai_key;

    // If openai_key is provided, validate it by calling the models API
    if (keyToUse) {
        const isModelAvailable = await validateModelWithKey(keyToUse, modelId);
        if (!isModelAvailable) {
            throw new Error('Model not available on the key supplied');
        }
        return keyToUse;
    }

    // If openai_key is not provided, use the courseMetadata.openai_api_key after decryption
    if (courseMetadata.openai_api_key) {
        const decryptedKey = await decrypt(courseMetadata.openai_api_key, process.env.NEXT_PUBLIC_SIGNING_KEY as string) as string;
        const isModelAvailable = await validateModelWithKey(decryptedKey, modelId);
        if (!isModelAvailable) {
            throw new Error('Model not available on the key supplied in course metadata');
        }
        return decryptedKey;
    }

    throw new Error('No OpenAI key found. OpenAI key is required');
}

/**
 * Calls the models API to validate if the provided model is available for the given key.
 * @param apiKey - The API key to validate.
 * @param modelId - The model identifier to check.
 * @returns {Promise<boolean>} A promise that resolves to a boolean indicating if the model is available.
 */
async function validateModelWithKey(apiKey: string, modelId: string): Promise<boolean> {
    try {
        const baseUrl = process.env.VERCEL_URL || 'http://localhost:3000';
        console.log('baseUrl:', baseUrl);
        const response = await fetch(baseUrl + '/api/models', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ key: apiKey }),
        });

        if (!response.ok) {
            throw new OpenAIError(`Failed to fetch models: ${response.statusText}`, 'api_error', 'key', response.status.toString());
        }

        const models: OpenAIModel[] = await response.json();
        return models.some(model => model.id === modelId);
    } catch (error) {
        console.error('Error validating model with key:', error);
        throw error;
    }
}

// Cache for storing citation links to avoid repeated fetches
const citationLinkCache = new Map<number, string>();

/**
 * Escapes special characters in a string for use in a regular expression.
 * @param {string} string - The string to escape.
 * @returns {string} The escaped string.
 */
function escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Generates a citation link based on the context provided.
 * @param {ContextWithMetadata} context - The context containing citation information.
 * @returns {Promise<string>} A promise that resolves to the citation link.
 */
const generateCitationLink = async (context: ContextWithMetadata): Promise<string> => {
    if (context.url) {
        return context.url;
    } else if (context.s3_path) {
        return fetchPresignedUrl(context.s3_path);
    }
    return '';
};

/**
 * Retrieves or generates a citation link, using a cache to store and reuse links.
 * @param {ContextWithMetadata} context - The context containing citation information.
 * @param {Map<number, string>} citationLinkCache - The cache for storing citation links.
 * @param {number} citationIndex - The index of the citation.
 * @returns {Promise<string>} A promise that resolves to the citation link.
 */
const getCitationLink = async (context: ContextWithMetadata, citationLinkCache: Map<number, string>, citationIndex: number): Promise<string> => {
    const cachedLink = citationLinkCache.get(citationIndex);
    if (cachedLink) {
        return cachedLink;
    } else {
        const link = await generateCitationLink(context);
        citationLinkCache.set(citationIndex, link);
        return link;
    }
};

/**
 * Validates the structure of the request body against the ChatApiBody type.
 * @param {ChatApiBody} body - The request body to validate.
 * @returns {boolean} A boolean indicating if the body is a valid ChatApiBody.
 */
function validateRequestBody(body: ChatApiBody): boolean {
    if (typeof body.model !== 'string' || !(body.model in OpenAIModels)) {
        console.error('Invalid model provided:', body.model);
        return false;
    }

    if (!body.conversation || !Array.isArray(body.conversation.messages) || body.conversation.messages.length === 0) {
        console.error('Invalid or empty conversation provided');
        return false;
    }

    // Additional validation for other fields can be added here if needed
    return true;
}

/**
 * The stream API endpoint for handling chat requests and streaming responses.
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
            body: body
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
    console.log('courseMetadata', courseMetadata);
    console.log('openai_key', openai_key, 'courseMetadata.key', courseMetadata.openai_api_key);

    // Determine and validate the OpenAI key to use
    let key: string;
    try {
        key = await determineAndValidateOpenAIKey(openai_key, courseMetadata, model);
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 400 });
    }
    console.log('Using key: ', key);

    // Check user permissions
    const permission = get_user_permission(courseMetadata, {
        isLoaded: true,
        isSignedIn: true,
        user: userObject
    }, req);
    console.log('permission: ', permission);
    if (permission !== 'edit') {
        posthog.capture('stream_api_permission_denied', {
            distinct_id: req.headers.get('x-forwarded-for') || req.ip,
            permission: permission,
            user_id: userObject?.id,
        });
        return NextResponse.json({ error: 'You do not have permission to perform this action' }, { status: 403 });
    }

    // Construct the search query and fetch contexts
    const searchQuery = constructSearchQuery(conversation);
    const contexts = await fetchContexts(course_name, searchQuery, OpenAIModels[model as OpenAIModelID].tokenLimit);

    console.log('contexts: ', contexts);

    // Check if contexts were found
    if (contexts.length === 0) {
        console.error('No contexts found');
        posthog.capture('stream_api_no_contexts_found', {
            distinct_id: req.headers.get('x-forwarded-for') || req.ip,
            user_id: userObject?.id,
        });
        return NextResponse.json({ error: 'No contexts found' }, { status: 500 });
    }

    // Ensure there are messages in the conversation
    if (conversation.messages.length === 0) {
        console.error('No messages in conversation');
        return NextResponse.json({ error: 'No messages in conversation' }, { status: 400 });
    }

    // Attach contexts to the last message
    const lastMessage = conversation.messages[conversation.messages.length - 1] as Message;
    attachContextsToLastMessage(lastMessage, contexts);

    // Construct the chat body and make the API request
    const chatBody: ChatBody = constructChatBody(model, conversation, key, prompt, temperature, course_name, stream);

    // Make the API request to the chat handler
    const apiResponse: NextResponse = await fetch('http://localhost:3000/api/chat', {
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
        const json = await apiResponse.json();
        return NextResponse.json(json, { status: 200 });
    }
}

/**
 * Constructs the search query from the user messages in the conversation.
 * @param conversation - The conversation object containing messages.
 * @returns A string representing the search query.
 */
function constructSearchQuery(conversation: Conversation): string {
    return conversation.messages
        .filter(msg => msg.role === 'user')
        .map(msg => {
            if (typeof msg.content === 'string') {
                return msg.content;
            } else if (Array.isArray(msg.content)) {
                return msg.content
                    .filter(content => content.type === 'text')
                    .map(content => content.text)
                    .join(' ');
            }
            return '';
        })
        .join('\n');
}

/**
 * Attaches contexts to the last message in the conversation.
 * @param lastMessage - The last message object in the conversation.
 * @param contexts - The contexts to attach.
 */
function attachContextsToLastMessage(lastMessage: Message, contexts: ContextWithMetadata[]): void {
    if (!lastMessage.contexts) {
        lastMessage.contexts = [];
    }
    lastMessage.contexts = contexts as ContextWithMetadata[];
    console.log('lastMessage: ', lastMessage);
}

/**
 * Constructs the ChatBody object for the chat handler.
 * @param model - The model identifier.
 * @param conversation - The conversation object.
 * @param key - The API key.
 * @param prompt - The prompt for the chat.
 * @param temperature - The temperature setting for the chat.
 * @param course_name - The course name associated with the chat.
 * @param stream - A boolean indicating if the response should be streamed.
 * @returns The constructed ChatBody object.
 */
function constructChatBody(model: string, conversation: Conversation, key: string, prompt: string, temperature: number, course_name: string, stream: boolean): ChatBody {
    return {
        model: OpenAIModels[model as OpenAIModelID] as OpenAIModel,
        messages: conversation.messages,
        key: key,
        prompt: prompt,
        temperature: temperature,
        course_name: course_name,
        stream: stream
    };
}

/**
 * Handles the streaming of the chat response.
 * @param apiResponse - The response from the chat handler.
 * @param conversation - The conversation object for logging purposes.
 * @param req - The incoming Next.js API request object.
 * @param userObject - The user object for logging purposes.
 */
async function handleStreamingResponse(apiResponse: NextResponse, conversation: Conversation, req: NextRequest, userObject: User) {
    if (!apiResponse.body) {
        console.error('API response body is null');
        return new NextResponse(JSON.stringify({ error: 'API response body is null' }), { status: 500 });
    }

    // Create a TransformStream to handle post-processing
    const transformer = new TransformStream({
        async transform(chunk, controller) {
            // Decode the chunk into a string
            const textDecoder = new TextDecoder();
            const decodedChunk = textDecoder.decode(chunk);

            // Perform your post-processing steps on the chunk
            // For example, replacing citation links or modifying text
            // This is a placeholder for your actual post-processing logic
            let processedChunk = decodedChunk;

            // Postprocess the chunk
            const lastMessage = conversation.messages[conversation.messages.length - 1] as Message;
            if (lastMessage.contexts) {
                for (const context of lastMessage.contexts) {
                    const pageMatch = processedChunk.match(new RegExp(`\\[${escapeRegExp(context.readable_filename)}, page: (\\d+)\\]\\(#\\)`));
                    const pageNumber = pageMatch ? `#page=${pageMatch[1]}` : '';

                    const citationIndex = lastMessage.contexts.indexOf(context) + 1;
                    const link = await getCitationLink(context, citationLinkCache, citationIndex);

                    const citationLinkPattern = new RegExp(`\\[${citationIndex}\\](?!\\([^)]*\\))`, 'g');
                    processedChunk = processedChunk.replace(citationLinkPattern, `[${citationIndex}](${link}${pageNumber})`);

                    const filenameLinkPattern = new RegExp(`(\\b${citationIndex}\\.)\\s*\\[(.*?)\\]\\(\\#\\)`, 'g');
                    processedChunk = processedChunk.replace(filenameLinkPattern, `$1 [${context.readable_filename}](${link}${pageNumber})`);
                }
            }

            // Encode the processed chunk back into a Uint8Array
            const textEncoder = new TextEncoder();
            const encodedChunk = textEncoder.encode(processedChunk);

            // Enqueue the processed chunk to the readable stream
            controller.enqueue(encodedChunk);

            // If this is the last chunk, close the stream
            if (chunk.done) {
                controller.terminate();
                // After streaming is done, update the database
                await updateConversationInDatabase(conversation, processedChunk, req, userObject);

            }
        }
    });

    // Pipe the original response stream through the transformer
    const transformedStream = apiResponse.body.pipeThrough(transformer);

    // Return the transformed stream as a NextResponse
    return new NextResponse(transformedStream);
}

/**
 * Updates the conversation in the database with the full text response.
 * @param conversation - The conversation object.
 * @param fullText - The full text response from the assistant.
 */
async function updateConversationInDatabase(conversation: Conversation, fullText: string, req: NextRequest, userObject: User) {
    const course_name = conversation.messages[conversation.messages.length - 1]?.contexts?.[0]?.course_name || '';

    await logConversationToSupabase({
        body: {
            course_name: course_name,
            conversation: {
                ...conversation,
                messages: conversation.messages.map(message => ({
                    ...message,
                    ...(message.role === 'assistant' && { content: fullText })
                }))
            }
        }
    } as any, {
        status: (statusCode: number) => ({
            json: (data: any) => {
                if (statusCode !== 200) {
                    console.error('Error updating conversation in database:', data);
                } else {
                    console.log('Conversation updated in database:', data);
                }
            }
        })
    } as any);

    // Log the conversation update in the database
    posthog.capture('stream_api_conversation_updated', {
        distinct_id: req.headers.get('x-forwarded-for') || req.ip,
        conversation_id: conversation.id,
        user_id: userObject?.id,
    });
}

// /**
//  * Handles the streaming of the chat response.
//  * @param apiResponse - The response from the chat handler.
//  * @param res - The outgoing Next.js API response object.
//  * @param conversation - The conversation object for logging purposes.
//  */
// async function handleStreaming(apiResponse: Response, res: NextApiRequest, conversation: Conversation, req: NextApiResponse, userObject: User) {
//     if (!apiResponse.body) {
//         console.error('API response body is null');
//         return NextResponse.json({ error: 'API response body is null' }, { status: 500 });
//     }

//     const reader = apiResponse.body.getReader();
//     const decoder = new TextDecoder();
//     let done = false;
//     let text = '';
//     res.writeHead(200, {
//         'Content-Type': 'application/json',
//         'Transfer-Encoding': 'chunked'
//     });

//     try {
//         while (!done) {
//             const { value, done: doneReading } = await reader.read();
//             done = doneReading;
//             let chunkValue = decoder.decode(value, { stream: !done });
//             text += chunkValue;

//             if (value) {

//                 const lastMessage = conversation.messages[conversation.messages.length - 1] as Message;
//                 if (lastMessage.contexts) {
//                     for (const context of lastMessage.contexts) {
//                         const pageMatch = chunkValue.match(new RegExp(`\\[${escapeRegExp(context.readable_filename)}, page: (\\d+)\\]\\(#\\)`));
//                         const pageNumber = pageMatch ? `#page=${pageMatch[1]}` : '';

//                         const citationIndex = lastMessage.contexts.indexOf(context) + 1;
//                         const link = await getCitationLink(context, citationLinkCache, citationIndex);

//                         const citationLinkPattern = new RegExp(`\\[${citationIndex}\\](?!\\([^)]*\\))`, 'g');
//                         chunkValue = chunkValue.replace(citationLinkPattern, `[${citationIndex}](${link}${pageNumber})`);

//                         const filenameLinkPattern = new RegExp(`(\\b${citationIndex}\\.)\\s*\\[(.*?)\\]\\(\\#\\)`, 'g');
//                         chunkValue = chunkValue.replace(filenameLinkPattern, `$1 [${context.readable_filename}](${link}${pageNumber})`);
//                     }
//                 }
//                 res.write(chunkValue);
//             }
//         }
//         res.end();
//     } catch (error) {
//         console.error('Error reading from stream:', error);
//         res.status(500).json({ error: 'Error reading from stream' });
//         return;
//     }

//     // Update the database with the full response
//     await updateConversationInDatabase(conversation, text, req, userObject);
// }