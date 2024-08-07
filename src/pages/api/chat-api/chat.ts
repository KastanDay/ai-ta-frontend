// src/pages/api/chat-api/stream.ts

import { fetchContexts } from '../getContexts'
import { OpenAIModelID, OpenAIModels } from '~/types/openai'
import { ChatBody, Content, Conversation, Message } from '~/types/chat'
import { fetchCourseMetadata } from '~/utils/apiUtils'
import { validateApiKeyAndRetrieveData } from './keys/validate'
import { get_user_permission } from '~/components/UIUC-Components/runAuthCheck'
import posthog from 'posthog-js'
import { User } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { CourseMetadata } from '~/types/courseMetadata'
import {
  attachContextsToLastMessage,
  constructChatBody,
  constructSearchQuery,
  determineAndValidateOpenAIKey,
  handleImageContent,
  handleNonStreamingResponse,
  handleStreamingResponse,
  validateRequestBody,
} from '~/utils/streamProcessing'
import { DEFAULT_SYSTEM_PROMPT, DEFAULT_TEMPERATURE } from '~/utils/app/const'
import { v4 as uuidv4 } from 'uuid'
import { getBaseUrl } from '~/utils/apiUtils'
import { extractEmailsFromClerk } from '~/components/UIUC-Components/clerkHelpers'
import { buildPrompt } from '../chat'

// Configuration for the runtime environment
export const config = {
  runtime: 'edge',
}

/**
 * The chat API endpoint for handling chat requests and streaming/non streaming responses.
 * This function orchestrates the validation of the request, user permissions,
 * fetching of necessary data, and the construction and handling of the chat response.
 *
 * @param {NextRequest} req - The incoming Next.js API request object.
 * @returns {Promise<NextResponse>} A promise that resolves to the Next.js API response object.
 */
export default async function chat(req: NextRequest): Promise<NextResponse> {
  // Validate the HTTP method
  if (req.method !== 'POST') {
    console.error('Invalid request method:', req.method)
    posthog.capture('stream_api_invalid_method', {
      distinct_id: req.headers.get('x-forwarded-for') || req.ip,
      method: req.method,
    })
    return new NextResponse(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
    })
  }

  // Parse and validate the request body
  const body = await req.json()
  try {
    // Validate the request body
    validateRequestBody(body)
  } catch (error: any) {
    // Log the error and capture it with PostHog
    console.error('Invalid request body:', body, 'Error:', error.message)
    posthog.capture('Invalid Request Body', {
      distinct_id: req.headers.get('x-forwarded-for') || req.ip,
      body: body,
      error: error.message,
    })

    // Return a response with the error message
    return new NextResponse(
      JSON.stringify({ error: `Invalid request body: ${error.message}` }),
      { status: 400 },
    )
  }

  // Destructure the necessary properties from the request body
  const {
    model,
    messages,
    openai_key,
    temperature,
    course_name,
    stream,
    api_key,
  }: {
    model: string
    messages: Message[]
    openai_key: string
    temperature: number
    course_name: string
    stream: boolean
    api_key: string
  } = body

  // Validate the API key and retrieve user data
  const {
    isValidApiKey,
    userObject,
  }: { isValidApiKey: boolean; userObject: User | null } =
    await validateApiKeyAndRetrieveData(api_key, course_name)

  const email = extractEmailsFromClerk(userObject as User)[0]

  console.log('Received /chat request for: ', email)

  if (!isValidApiKey) {
    posthog.capture('stream_api_invalid_api_key', {
      distinct_id: req.headers.get('x-forwarded-for') || req.ip,
      api_key: api_key,
      user_id: email,
    })
    return new NextResponse(JSON.stringify({ error: 'Invalid API key' }), {
      status: 403,
    })
  }

  // Retrieve course metadata
  const courseMetadata: CourseMetadata = await fetchCourseMetadata(course_name)
  if (!courseMetadata) {
    return NextResponse.json(
      { error: 'Course metadata not found' },
      { status: 404 },
    )
  }

  // Determine and validate the OpenAI key to use
  let key: string
  try {
    key = await determineAndValidateOpenAIKey(
      openai_key,
      courseMetadata,
      model,
      course_name,
    )
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    )
  }

  // Check user permissions
  const permission = get_user_permission(
    courseMetadata,
    {
      isLoaded: true,
      isSignedIn: true,
      user: userObject,
    },
    req,
  )

  if (permission !== 'edit') {
    posthog.capture('stream_api_permission_denied', {
      distinct_id: req.headers.get('x-forwarded-for') || req.ip,
      permission: permission,
      user_id: email,
    })
    return NextResponse.json(
      { error: 'You do not have permission to perform this action' },
      { status: 403 },
    )
  }

  // Ensure there are messages in the conversation
  if (messages.length === 0) {
    console.error('No messages in conversation')
    return NextResponse.json(
      { error: 'No messages in conversation' },
      { status: 400 },
    )
  }

  // Get the last message in the conversation
  const lastMessage = messages[messages.length - 1] as Message

  // Construct the search query
  let searchQuery = constructSearchQuery(messages)

  // Construct the conversation object
  const conversation: Conversation = {
    id: uuidv4(),
    name: 'New Conversation',
    messages: messages,
    model: OpenAIModels[model as OpenAIModelID],
    prompt:
      messages.filter((message) => message.role === 'system').length > 0
        ? (messages.filter((message) => message.role === 'system')[0]
            ?.content as string) ??
          (messages.filter((message) => message.role === 'system')[0]
            ?.content as string)
        : DEFAULT_SYSTEM_PROMPT,
    temperature: temperature || DEFAULT_TEMPERATURE,
    folderId: null,
    user_email: email,
  }

  // Handle image content if it exists
  // Check if the content is an array and filter out image content
  const imageContent = Array.isArray(lastMessage.content)
    ? (lastMessage.content as Content[]).filter(
        (content) => content.type === 'image_url',
      )
    : []
  if (imageContent.length > 0) {
    searchQuery = await handleImageContent(
      lastMessage,
      course_name,
      conversation,
      searchQuery,
      courseMetadata,
      openai_key,
      new AbortController(),
    )
  }

  // Fetch Contexts
  const contexts = await fetchContexts(
    course_name,
    searchQuery,
    OpenAIModels[model as OpenAIModelID].tokenLimit,
  )

  // Check if contexts were found
  if (contexts.length === 0) {
    console.error('No contexts found')
    posthog.capture('stream_api_no_contexts_found', {
      distinct_id: req.headers.get('x-forwarded-for') || req.ip,
      user_id: email,
    })
    return NextResponse.json({ error: 'No contexts found' }, { status: 500 })
  }

  // Attach contexts to the last message
  attachContextsToLastMessage(lastMessage, contexts)

  //Todo: Add handleTools here, skipping for now because edge functions will start timing out waiting for tool run to finish
  // const toolResult = await handleTools(
  //   message,
  //   tools,
  //   imageUrls,
  //   imgDesc,
  //   updatedConversation,
  //   currentMessageIndex,
  //   getOpenAIKey(courseMetadata),
  //   getCurrentPageName(),
  //   homeDispatch,
  // )

  // Construct the chat body for the API request
  const chatBody: ChatBody = constructChatBody(
    conversation,
    key,
    course_name,
    stream,
    courseMetadata,
  )

  // Build the prompt
  const buildPromptResponse = await buildPrompt({
    conversation: chatBody.conversation!,
    projectName: chatBody.course_name,
    courseMetadata: chatBody.courseMetadata,
  })

  chatBody.conversation = buildPromptResponse

  // Make the API request to the chat handler
  const baseUrl = getBaseUrl()
  // console.log('baseUrl:', baseUrl);
  const apiResponse: NextResponse = (await fetch(baseUrl + '/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(chatBody),
  })) as NextResponse

  // Handle errors from the chat handler API
  if (!apiResponse.ok) {
    console.error('API error:', apiResponse.statusText)
    posthog.capture('stream_api_error', {
      distinct_id: req.headers.get('x-forwarded-for') || req.ip,
      error: apiResponse.statusText,
      status: apiResponse.status,
      user_id: email,
    })
    return new NextResponse(
      JSON.stringify({ error: `API error: ${apiResponse.statusText}` }),
      { status: apiResponse.status },
    )
  }

  // Stream the response or return it as a single message
  if (stream) {
    posthog.capture('stream_api_streaming_started', {
      distinct_id: req.headers.get('x-forwarded-for') || req.ip,
      user_id: email,
    })
    return await handleStreamingResponse(
      apiResponse,
      conversation,
      req,
      course_name,
    )
  } else {
    posthog.capture('stream_api_response_sent', {
      distinct_id: req.headers.get('x-forwarded-for') || req.ip,
      user_id: email,
    })
    return await handleNonStreamingResponse(
      apiResponse,
      conversation,
      req,
      course_name,
    )
  }
}
