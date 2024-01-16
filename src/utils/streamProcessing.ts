import { ChatApiBody, ChatBody, Content, ContextWithMetadata, Conversation, Message } from '~/types/chat';
import { fetchPresignedUrl } from './apiUtils';
import { CourseMetadata } from '~/types/courseMetadata';
import { decrypt } from './crypto';
import { OpenAIError } from './server';
import { OpenAIModel, OpenAIModelID, OpenAIModels } from '~/types/openai';
import { NextRequest, NextResponse } from 'next/server';
import { User } from '@clerk/nextjs/dist/types/server';
import logConversationToSupabase from '~/pages/api/UIUC-api/logConversationToSupabase';
import posthog from 'posthog-js';
import { replaceCitationLinks } from './citations';
import { fetchImageDescription } from '~/pages/api/UIUC-api/fetchImageDescription';
import { DEFAULT_SYSTEM_PROMPT } from './app/const';
import { getBaseUrl } from './api';

export const config = {
  runtime: 'edge',
}

/**
 * Enum representing the possible states of the state machine used in processing text chunks.
 */
export enum State {
  Normal,
  PossibleCitationOrFilename,
  InCitation,
  InFilename,
  InFilenameLink
}

/**
 * Processes a text chunk using a state machine to identify and replace citations or filenames with links.
 * @param {string} chunk - The text chunk to process.
 * @param {Message} lastMessage - The last message in the conversation, used for context.
 * @param {object} stateMachineContext - The current state and buffer of the state machine.
 * @param {Map<number, string>} citationLinkCache - Cache for storing and reusing citation links.
 * @returns {Promise<string>} The processed text chunk with citations and filenames replaced with links.
 */
export async function processChunkWithStateMachine(
  chunk: string,
  lastMessage: Message,
  stateMachineContext: { state: State, buffer: string },
  citationLinkCache: Map<number, string>
): Promise<string> {
  let { state, buffer } = stateMachineContext;
  let processedChunk = '';

  for (let i = 0; i < chunk.length; i++) {
    const char = chunk[i]!;
    switch (state) {
      case State.Normal:
        if (char === '[') {
          state = State.PossibleCitationOrFilename;
          buffer += char;
        } else if (char.match(/\d/)) {
          let j = i + 1;
          while (j < chunk.length && /\d/.test(chunk[j] as string)) {
            j++;
          }
          if (j < chunk.length && chunk[j] === '.') {
            state = State.InFilename;
            buffer += chunk.substring(i, j + 1);
            i = j;
          } else {
            processedChunk += char;
          }
        } else {
          processedChunk += char;
        }
        break;

      case State.PossibleCitationOrFilename:
        if (char.match(/\d/)) {
          state = State.InCitation;
          buffer += char;
        } else if (char === '.') {
          state = State.InFilename;
          buffer += char;
        } else {
          state = State.Normal;
          processedChunk += buffer + char;
          buffer = '';
        }
        break;

      case State.InCitation:
        if (char === ']') {
          state = State.Normal;
          processedChunk += await replaceCitationLinks(buffer + char, lastMessage, citationLinkCache);
          buffer = '';
        } else {
          buffer += char;
        }
        break;

      case State.InFilename:
        if (char === '[') {
          buffer += char;
          state = State.InFilenameLink;
        } else if (char.match(/\s/)) {
          buffer += char;
        } else if (char.match(/\d/) && chunk[i + 1] === '.') {
          processedChunk += await replaceCitationLinks(buffer, lastMessage, citationLinkCache);
          buffer = char;
        } else {
          buffer += char;
        }
        break;

      case State.InFilenameLink:
        if (char === ')') {
          state = State.Normal;
          processedChunk += await replaceCitationLinks(buffer + char, lastMessage, citationLinkCache);
          buffer = '';
        } else {
          buffer += char;
        }
        break;
    }
  }

  stateMachineContext.state = state;
  stateMachineContext.buffer = buffer;

  if (state !== State.Normal && buffer.length > 0) {
    return processedChunk;
  }

  if (buffer.length > 0) {
    processedChunk += await replaceCitationLinks(buffer, lastMessage, citationLinkCache);
    buffer = '';
  }

  return processedChunk;
}

/**
 * Determines the OpenAI key to use and validates it by checking available models.
 * @param {string | undefined} openai_key - The OpenAI key provided in the request.
 * @param {CourseMetadata} courseMetadata - The course metadata containing the fallback OpenAI key.
 * @param {string} modelId - The model identifier to validate against the available models.
 * @returns {Promise<string>} The validated OpenAI key.
 */
export async function determineAndValidateOpenAIKey(openai_key: string | undefined, courseMetadata: CourseMetadata, modelId: string): Promise<string> {
  const keyToUse = openai_key || await decrypt(courseMetadata.openai_api_key as string, process.env.NEXT_PUBLIC_SIGNING_KEY as string) as string;

  if (keyToUse) {
    const isModelAvailable = await validateModelWithKey(keyToUse, modelId);
    if (!isModelAvailable) {
      throw new Error('Model not available on the key supplied');
    }
    return keyToUse;
  }

  throw new Error('No OpenAI key found. OpenAI key is required');
}

/**
 * Calls the models API to validate if the provided model is available for the given key.
 * @param {string} apiKey - The API key to validate.
 * @param {string} modelId - The model identifier to check.
 * @returns {Promise<boolean>} A promise that resolves to a boolean indicating if the model is available.
 */
export async function validateModelWithKey(apiKey: string, modelId: string): Promise<boolean> {
  try {
    const baseUrl = getBaseUrl();
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

/**
 * Validates the structure of the request body against the ChatApiBody type.
 * Throws an error with a specific message when validation fails.
 * @param {ChatApiBody} body - The request body to validate.
 */
export function validateRequestBody(body: ChatApiBody): void {
  // Check for required fields
  const requiredFields = ['model', 'messages', 'course_name', 'api_key'];
  for (const field of requiredFields) {
    if (!body.hasOwnProperty(field)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  if (typeof body.model !== 'string' || !(body.model in OpenAIModels)) {
    throw new Error('Invalid model provided');
  }

  if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0 || !body.messages.some(message => message.role === 'user')) {
    throw new Error('Invalid or empty messages provided');
  }

  if (body.temperature && (typeof body.temperature !== 'number' || body.temperature < 0 || body.temperature > 1)) {
    throw new Error('Invalid temperature provided');
  }

  if (typeof body.course_name !== 'string') {
    throw new Error('Invalid course_name provided');
  }

  if (body.stream && typeof body.stream !== 'boolean') {
    throw new Error('Invalid stream provided');
  }

  const hasImageContent = body.messages.some(message => 
    Array.isArray(message.content) && 
    message.content.some(content => content.type === 'image_url')
  );
  if (hasImageContent && body.model !== OpenAIModelID.GPT_4_VISION) {
    throw new Error('Invalid model provided for image content');
  }

  // Additional validation for other fields can be added here if needed
}

/**
 * Constructs the search query from the user messages in the conversation.
 * @param {Conversation} conversation - The conversation object containing messages.
 * @returns {string} A string representing the search query.
 */
export function constructSearchQuery(messages: Message[] ): string {
  return messages
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
 * @param {Message} lastMessage - The last message object in the conversation.
 * @param {ContextWithMetadata[]} contexts - The contexts to attach.
 */
export function attachContextsToLastMessage(lastMessage: Message, contexts: ContextWithMetadata[]): void {
  if (!lastMessage.contexts) {
    lastMessage.contexts = [];
  }
  lastMessage.contexts = contexts;
  console.log('lastMessage: ', lastMessage);
}

/**
 * Constructs the ChatBody object for the chat handler.
 * @param {string} model - The model identifier.
 * @param {Conversation} conversation - The conversation object.
 * @param {string} key - The API key.
 * @param {string} prompt - The prompt for the chat.
 * @param {number} temperature - The temperature setting for the chat.
 * @param {string} course_name - The course name associated with the chat.
 * @param {boolean} stream - A boolean indicating if the response should be streamed.
 * @returns {ChatBody} The constructed ChatBody object.
 */
export function constructChatBody(
  conversation: Conversation,
  key: string,
  course_name: string,
  stream: boolean
): ChatBody {
  return {
    model: conversation.model,
    messages: conversation.messages,
    key: key,
    prompt: conversation.prompt,
    temperature: conversation.temperature,
    course_name: course_name,
    stream: stream,
    isImage: false,
  };
}

/**
 * Handles the streaming of the chat response.
 * @param {NextResponse} apiResponse - The response from the chat handler.
 * @param {Conversation} conversation - The conversation object for logging purposes.
 * @param {NextRequest} req - The incoming Next.js API request object.
 * @param {User} userObject - The user object for logging purposes.
 * @returns {Promise<NextResponse>} A NextResponse object representing the streaming response.
 */
export async function handleStreamingResponse(
  apiResponse: NextResponse,
  conversation: Conversation,
  req: NextRequest,
  userObject: User
): Promise<NextResponse> {
  if (!apiResponse.body) {
    console.error('API response body is null');
    return new NextResponse(JSON.stringify({ error: 'API response body is null' }), { status: 500 });
  }

  const lastMessage = conversation.messages[conversation.messages.length - 1] as Message;
  const stateMachineContext = { state: State.Normal, buffer: '' };
  const citationLinkCache = new Map<number, string>();

  const transformer = new TransformStream({
    async transform(chunk, controller) {
      const textDecoder = new TextDecoder();
      let decodedChunk = textDecoder.decode(chunk, { stream: true });

      try {
        decodedChunk = await processChunkWithStateMachine(decodedChunk, lastMessage, stateMachineContext, citationLinkCache);
      } catch (error) {
        console.error('Error processing chunk with state machine:', error);
        controller.error(error);
        return;
      }

      const textEncoder = new TextEncoder();
      const encodedChunk = textEncoder.encode(decodedChunk);
      controller.enqueue(encodedChunk);

      if (chunk.done) {
        controller.terminate();
        await updateConversationInDatabase(conversation, decodedChunk, req, userObject);
      }
    },
    flush(controller) {
      const textEncoder = new TextEncoder();
      if (stateMachineContext.buffer.length > 0) {
        processChunkWithStateMachine('', lastMessage, stateMachineContext, citationLinkCache)
          .then(finalChunk => {
            controller.enqueue(textEncoder.encode(finalChunk));
            controller.terminate();
          })
          .catch(error => {
            console.error('Error processing final chunk with state machine:', error);
            controller.error(error);
          });
      } else {
        controller.terminate();
      }
    }
  });

  const transformedStream = apiResponse.body.pipeThrough(transformer);
  return new NextResponse(transformedStream);
}

/**
 * Processes the API response data.
 * @param {string} data - The response data as a string.
 * @param {Conversation} conversation - The conversation object for logging purposes.
 * @param {NextRequest} req - The incoming Next.js API request object.
 * @param {User} userObject - The user object for logging purposes.
 * @returns {Promise<string>} The processed data.
 */
async function processResponseData(
  data: string,
  conversation: Conversation,
  req: NextRequest,
  userObject: User
): Promise<string> {
  const lastMessage = conversation.messages[conversation.messages.length - 1] as Message;
  const stateMachineContext = { state: State.Normal, buffer: '' };
  const citationLinkCache = new Map<number, string>();

  try {
    const processedData = await processChunkWithStateMachine(data, lastMessage, stateMachineContext, citationLinkCache);
    await updateConversationInDatabase(conversation, processedData, req, userObject);
    return processedData;
  } catch (error) {
    console.error('Error processing response data:', error);
    throw error;
  }
}

/**
 * Handles the non-streaming response from the chat handler.
 * @param {NextResponse} apiResponse - The response from the chat handler.
 * @param {Conversation} conversation - The conversation object for logging purposes.
 * @param {NextRequest} req - The incoming Next.js API request object.
 * @param {User} userObject - The user object for logging purposes.
 * @returns {Promise<NextResponse>} A NextResponse object representing the JSON response.
 */
export async function handleNonStreamingResponse(
  apiResponse: NextResponse,
  conversation: Conversation,
  req: NextRequest,
  userObject: User
): Promise<NextResponse> {
  if (!apiResponse.body) {
    console.error('API response body is null');
    return new NextResponse(JSON.stringify({ error: 'API response body is null' }), { status: 500 });
  }

  try {
    const json = await apiResponse.json();
    const response = json.choices[0].message.content || '';
    const processedResponse = await processResponseData(response, conversation, req, userObject);
    return new NextResponse(JSON.stringify({ message: processedResponse }), { status: 200 });
  } catch (error) {
    console.error('Error handling non-streaming response:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to process response' }), { status: 500 });
  }
}

/**
 * Updates the conversation in the database with the full text response.
 * @param {Conversation} conversation - The conversation object.
 * @param {string} fullText - The full text response from the assistant.
 * @param {NextRequest} req - The incoming Next.js API request object.
 * @param {User} userObject - The user object for logging purposes.
 */
export async function updateConversationInDatabase(
  conversation: Conversation,
  fullText: string,
  req: NextRequest,
  userObject: User
) {
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

  posthog.capture('stream_api_conversation_updated', {
    distinct_id: req.headers.get('x-forwarded-for') || req.ip,
    conversation_id: conversation.id,
    user_id: userObject?.id,
  });
}

/**
 * Processes an image content message by fetching a description from OpenAI API.
 * It appends or updates the image description in the search query and message content.
 *
 * @param {Message} message - The message object containing image content.
 * @param {string} course_name - The name of the course associated with the conversation.
 * @param {Conversation} updatedConversation - The updated conversation object.
 * @param {string} searchQuery - The current search query string.
 * @param {CourseMetadata} courseMetadata - Metadata associated with the course.
 * @param {string} apiKey - The API key for the AI service.
 * @param {AbortController} controller - The controller to handle aborted requests.
 * @returns {Promise<string>} The updated search query with the image description.
 */
export async function handleImageContent(message: Message, course_name: string, updatedConversation: Conversation, searchQuery: string, courseMetadata: CourseMetadata, apiKey: string, controller: AbortController) {

  const key = courseMetadata?.openai_api_key && courseMetadata?.openai_api_key != '' ? courseMetadata.openai_api_key : apiKey;
  const endpoint = getBaseUrl() + '/api/chat'
  console.log('fetching image description for message: ', message);

  try {
    const imgDesc = await fetchImageDescription(message, course_name, endpoint, updatedConversation, key, controller);

    searchQuery += ` Image description: ${imgDesc}`;

    const imgDescIndex = (message.content as Content[]).findIndex(content => content.type === 'text' && (content.text as string).startsWith('Image description: '));

    if (imgDescIndex !== -1) {
      (message.content as Content[])[imgDescIndex] = { type: 'text', text: `Image description: ${imgDesc}` };
    } else {
      (message.content as Content[]).push({ type: 'text', text: `Image description: ${imgDesc}` });
    }
  } catch (error) {
    console.error('Error in chat.tsx running handleImageContent():', error);
    controller.abort();
  }
  console.log("Returning search query with image description: ", searchQuery);
  return searchQuery;
}