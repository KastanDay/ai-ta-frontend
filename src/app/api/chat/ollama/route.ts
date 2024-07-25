import { createOllama } from 'ollama-ai-provider'
import { CoreMessage, StreamingTextResponse, streamText } from 'ai'
import { Conversation } from '~/types/chat'
import { OllamaProvider } from '~/types/LLMProvider'

export const runtime = 'edge'

export async function POST(req: Request) {
  console.log('In ollama chat streaming endpoint')
  const {
    conversation,
    ollamaProvider,
  }: {
    conversation: Conversation
    ollamaProvider: OllamaProvider
  } = await req.json()
  /*
  Run Ollama chat, given a text string. Return a streaming response promise.
  */
  const ollama = createOllama({
    baseURL: `${process.env.OLLAMA_SERVER_URL}/api`,
    // baseURL: `${ollamaProvider.baseUrl}/api`,
  })

  console.log(`Ollama url: ${`${process.env.OLLAMA_SERVER_URL}/api`}`)

  const result = await streamText({
    model: ollama('llama3.1:70b'),
    messages: convertConversatonToVercelAISDKv2(conversation), // TODO NEEDS WORK - clean messages from UIUC.chat to Ollama
    temperature: conversation.temperature,
    maxTokens: 4096, // output tokens
  })

  console.log('Stream result:', result)

  // Check if the result.textStream is a valid ReadableStream
  if (!(result.textStream instanceof ReadableStream)) {
    throw new Error('Invalid ReadableStream returned from streamText')
  }

  console.log('Right before return in ollama chat streaming')
  return new StreamingTextResponse(result.textStream, {})
}

function convertConversatonToVercelAISDK(conversation: Conversation) {
  return conversation.messages.map((message, messageIndex) => {
    const strippedMessage = { ...message }
    // When content is an array
    if (Array.isArray(strippedMessage.content)) {
      strippedMessage.content.map((content, contentIndex) => {
        // Convert tool_image_url to image_url for OpenAI
        if (content.type === 'tool_image_url') {
          content.type = 'image_url'
        }
        // Add final prompt to last message
        if (messageIndex === conversation.messages.length - 1) {
          content.text = strippedMessage.finalPromtEngineeredMessage
        }
        return content
      })
    } else {
      // When content is a string
      // Add final prompt to last message
      if (messageIndex === conversation.messages.length - 1) {
        if (strippedMessage.role === 'user') {
          strippedMessage.content = [
            {
              type: 'text',
              text: strippedMessage.finalPromtEngineeredMessage,
            },
          ]
          // Add system prompt to message with role system
        } else if (strippedMessage.role === 'system') {
          strippedMessage.content = [
            {
              type: 'text',
              text: strippedMessage.latestSystemMessage,
            },
          ]
        }
      }
    }
    delete strippedMessage.finalPromtEngineeredMessage
    delete strippedMessage.latestSystemMessage
    delete strippedMessage.contexts
    delete strippedMessage.tools
    return strippedMessage
  })
}

function convertConversatonToVercelAISDKv2(
  conversation: Conversation,
): CoreMessage[] {
  // NOT GOING TO BE PREFECT, PROBABLY DOESN'T HANDLE TOOLS PROPERLY.
  return conversation.messages.map(
    (message): CoreMessage => ({
      role: message.role as 'user' | 'assistant' | 'system',
      content:
        typeof message.content === 'string'
          ? message.content
          : message.content[0]?.text ?? '',
    }),
  )
}

export async function GET() {
  /*
  req: Request
  Get all available models from Ollama 
  For ollama, use the endpoint GET /api/ps to see which models are "hot", save just the name and the parameter_size.
  */
  console.log('In ollama GET endpoint')
  const response = await fetch('https://ollama.ncsa.ai/api/ps')
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  // TODO: put these in the form of ollama models

  const data = await response.json()
  return data
}
