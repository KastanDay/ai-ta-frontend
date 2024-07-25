import { createOllama } from 'ollama-ai-provider'
import { CoreMessage, StreamingTextResponse, streamText } from 'ai'
import { Conversation } from '~/types/chat'
import { OllamaProvider } from '~/types/LLMProvider'
import { OllamaModel } from '~/utils/modelProviders/ollama'

// export const runtime = 'edge' // Does NOT work
export const dynamic = 'force-dynamic' // known bug with Vercel: https://sdk.vercel.ai/docs/troubleshooting/common-issues/streaming-not-working-on-vercel

export async function POST(req: Request) {
  /*
  Run Ollama chat, given a text string. Return a streaming response promise.
  */
  const {
    conversation,
    ollamaProvider,
  }: {
    conversation: Conversation
    ollamaProvider: OllamaProvider
  } = await req.json()

  const ollama = createOllama({
    baseURL: `${process.env.OLLAMA_SERVER_URL}/api`,
    // baseURL: `${ollamaProvider.baseUrl}/api`, // TODO use user-defiend base URL...
  })

  const result = await streamText({
    model: ollama('llama3.1:70b'),
    messages: convertConversatonToVercelAISDKv2(conversation), // TODO NEEDS WORK - clean messages from UIUC.chat to Ollama
    temperature: conversation.temperature,
    maxTokens: 4096, // output tokens
  })
  return result.toTextStreamResponse()

  // // Check if the result.textStream is a valid ReadableStream
  // if (!(result.textStream instanceof ReadableStream)) {
  //   throw new Error('Invalid ReadableStream returned from streamText')
  // }
  // return new StreamingTextResponse(result.textStream, {})
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

export async function GET(req: Request) {
  /*
  NOT WORKING YET... need post endpoint
  req: Request
  Get all available models from Ollama 
  For ollama, use the endpoint GET /api/ps to see which models are "hot", save just the name and the parameter_size.
  */
  const url = new URL(req.url)
  const ollamaProvider = JSON.parse(
    url.searchParams.get('ollamaProvider') || '{}',
  ) as OllamaProvider

  const ollamaNames = new Map([['llama3.1:70b', 'Llama 3.1 70b']])

  try {
    if (!ollamaProvider.baseUrl) {
      ollamaProvider.error = `Ollama baseurl not defined: ${ollamaProvider.baseUrl}`
      return ollamaProvider
    }

    const response = await fetch(ollamaProvider.baseUrl + '/api/tags')

    if (!response.ok) {
      ollamaProvider.error = `HTTP error! status: ${response.status}`
      return ollamaProvider
    }
    const data = await response.json()
    const ollamaModels: OllamaModel[] = data.models
      // @ts-ignore - todo fix implicit any type
      .filter((model) => model.name.includes('llama3.1:70b'))
      .map((model: any): OllamaModel => {
        const newName = ollamaNames.get(model.name)
        return {
          id: model.name,
          name: newName ? newName : model.name,
          parameterSize: model.details.parameter_size,
          tokenLimit: 4096,
        }
      })
    ollamaProvider.models = ollamaModels
    if (ollamaProvider.models) {
      return new Response(JSON.stringify(ollamaProvider.models), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    } else {
      return new Response(JSON.stringify({ error: ollamaProvider.error }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }
}
