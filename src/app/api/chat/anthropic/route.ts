import { createOllama } from 'ollama-ai-provider'
import { CoreMessage, StreamingTextResponse, streamText } from 'ai'
import { Conversation } from '~/types/chat'
import { OllamaProvider } from '~/utils/modelProviders/LLMProvider'
import { OllamaModel } from '~/utils/modelProviders/ollama'

// export const runtime = 'edge' // Does NOT work
export const dynamic = 'force-dynamic' // known bug with Vercel: https://sdk.vercel.ai/docs/troubleshooting/common-issues/streaming-not-working-on-vercel
export const maxDuration = 60

// export async function POST(req: Request) {
//   /*
//   Run Ollama chat, given a text string. Return a streaming response promise.
//   */
//   const {
//     conversation,
//     ollamaProvider,
//   }: {
//     conversation: Conversation
//     ollamaProvider: OllamaProvider
//   } = await req.json()

//   const ollama = createOllama({
//     baseURL: `${process.env.OLLAMA_SERVER_URL}/api`,
//     // baseURL: `${ollamaProvider.baseUrl}/api`, // TODO use user-defiend base URL...
//   })

//   if (conversation.messages.length === 0) {
//     throw new Error('Conversation messages array is empty')
//   }

//   const result = await streamText({
//     model: ollama('llama3.1:70b'),
//     messages: convertConversatonToVercelAISDKv3(conversation),
//     temperature: conversation.temperature,
//     maxTokens: 4096, // output tokens
//   })
//   return result.toTextStreamResponse()
// }

function convertConversatonToVercelAISDKv3(
  conversation: Conversation,
): CoreMessage[] {
  const coreMessages: CoreMessage[] = []

  // Add system message as the first message
  const systemMessage = conversation.messages.findLast(
    (msg) => msg.latestSystemMessage !== undefined,
  )
  if (systemMessage) {
    console.log(
      'Found system message, latestSystemMessage: ',
      systemMessage.latestSystemMessage,
    )
    coreMessages.push({
      role: 'system',
      content: systemMessage.latestSystemMessage || '',
    })
  }

  // Convert other messages
  conversation.messages.forEach((message, index) => {
    if (message.role === 'system') return // Skip system message as it's already added

    let content: string
    if (index === conversation.messages.length - 1 && message.role === 'user') {
      // Use finalPromtEngineeredMessage for the most recent user message
      content = message.finalPromtEngineeredMessage || ''

      // just for Llama 3.1 70b, remind it to use proper citation format.
      content +=
        '\n\nIf you use the <Potentially Relevant Documents> in your response, please remember cite your sources using the required formatting, e.g. "The grass is green. [29, page: 11]'
    } else if (Array.isArray(message.content)) {
      // Combine text content from array
      content = message.content
        .filter((c) => c.type === 'text')
        .map((c) => c.text)
        .join('\n')
    } else {
      content = message.content as string
    }

    coreMessages.push({
      role: message.role as 'user' | 'assistant',
      content: content,
    })
  })

  return coreMessages
}

import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import {
  AnthropicModels,
  AnthropicModel,
} from '~/utils/modelProviders/types/anthropic'
import { ProviderNames } from '~/utils/modelProviders/LLMProvider'

export async function GET(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Anthropic API key not set.' },
      { status: 500 },
    )
  }

  const models = Object.values(AnthropicModels) as AnthropicModel[]

  return NextResponse.json({
    provider: ProviderNames.Anthropic,
    models: models,
  })
}
