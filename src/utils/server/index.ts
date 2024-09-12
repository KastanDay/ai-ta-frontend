import { Message, type OpenAIChatMessage } from '@/types/chat'
import { OpenAIModels, type OpenAIModel } from '~/utils/modelProviders/openai'

import {
  AZURE_DEPLOYMENT_ID,
  OPENAI_API_HOST,
  OPENAI_API_TYPE,
  OPENAI_API_VERSION,
  OPENAI_ORGANIZATION,
} from '../app/const'

import {
  type ParsedEvent,
  type ReconnectInterval,
  createParser,
} from 'eventsource-parser'
import { decrypt, isEncrypted } from '../crypto'
import {
  AllLLMProviders,
  AzureProvider,
  OpenAIProvider,
  ProviderNames,
} from '~/types/LLMProvider'
import { AzureModels } from '../modelProviders/azure'

export class OpenAIError extends Error {
  type: string
  param: string
  code: string

  constructor(message: string, type: string, param: string, code: string) {
    super(message)
    this.name = 'OpenAIError'
    this.type = type
    this.param = param
    this.code = code
  }
}

// missing course_name...
// got search_query... from messages

export const OpenAIStream = async (
  model: OpenAIModel,
  systemPrompt: string,
  temperature: number,
  llmProviders: AllLLMProviders,
  messages: OpenAIChatMessage[],
  stream: boolean,
) => {
  console.debug('In OpenAIStream, model: ', model)
  // messages.forEach((message, index) => {
  //   console.log(`Message ${index}:`, message.role, message.content)
  // })

  let provider
  if (llmProviders) {
    if (
      Object.values(OpenAIModels).some((oaiModel) => oaiModel.id === model.id)
    ) {
      provider = llmProviders[ProviderNames.OpenAI] as OpenAIProvider
    } else if (
      Object.values(AzureModels).some((oaiModel) => oaiModel.id === model.id)
    ) {
      provider = llmProviders[ProviderNames.Azure] as AzureProvider
    } else {
      throw new Error('Unsupported model provider')
    }
  }

  // default to OpenAI not Azure
  let apiType = ProviderNames.OpenAI
  let endpoint = OPENAI_API_HOST
  let url = `${endpoint}/v1/chat/completions`

  // if (key && isEncrypted(key)) {
  //   const decryptedText = await decrypt(
  //     key,
  //     process.env.NEXT_PUBLIC_SIGNING_KEY as string,
  //   )
  //   apiKey = decryptedText as string
  //   // console.log('Decrypted api key for openai chat: ', apiKey)
  //   // console.log('Decrypted api key for openai chat')
  // }

  function isAzureProvider(provider: any): provider is AzureProvider {
    return provider && provider.apiKey && !provider.apiKey.startsWith('sk-')
  }

  if (
    isAzureProvider(provider) &&
    provider!.apiKey &&
    !provider!.apiKey.startsWith('sk-')
  ) {
    apiType = ProviderNames.Azure
    endpoint = provider!.AzureEndpoint as string
    url = `${endpoint}/openai/deployments/${provider.AzureDeployment}/chat/completions?api-version=${OPENAI_API_VERSION}`
  }

  // ! DEBUGGING to view the full message as sent to OpenAI.
  // const final_request_to_openai = JSON.stringify({
  //   ...(OPENAI_API_TYPE === 'openai' && { model: model.id }),
  //   messages: [
  //     {
  //       role: 'system',
  //       content: systemPrompt,
  //     },
  //     ...messages,
  //   ],
  //   max_tokens: 1000,
  //   temperature: temperature,
  //   stream: true,
  // })
  // console.debug("Final request sent to OpenAI ", JSON.stringify(JSON.parse(final_request_to_openai), null, 2))

  const body = JSON.stringify({
    ...(OPENAI_API_TYPE === 'openai' && { model: model.id }),
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      ...messages,
    ],
    max_tokens: 1000,
    temperature: temperature,
    stream: stream,
  })
  // This could be logged and tracked better
  // console.log("openai api body: ", body)

  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(apiType === ProviderNames.OpenAI && {
        Authorization: `Bearer ${provider!.apiKey}`,
      }),
      ...(apiType === ProviderNames.Azure && {
        'api-key': `${provider!.apiKey}`,
      }),
      ...(apiType === ProviderNames.OpenAI &&
        OPENAI_ORGANIZATION && {
          'OpenAI-Organization': OPENAI_ORGANIZATION,
        }),
    },
    method: 'POST',
    body: body,
  })

  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  if (res.status !== 200) {
    const result = await res.json()
    if (result.error) {
      throw new OpenAIError(
        result.error.message,
        result.error.type,
        result.error.param,
        result.error.code,
      )
    } else {
      throw new Error(
        `OpenAI API returned an error: ${
          decoder.decode(result?.value) || result.statusText
        }`,
      )
    }
  }

  if (stream) {
    let isStreamClosed = false // Flag to track the state of the stream
    const apiStream = new ReadableStream({
      async start(controller) {
        const onParse = (event: ParsedEvent | ReconnectInterval) => {
          if (event.type === 'event') {
            const data = event.data

            try {
              // console.log('data: ', data) // ! DEBUGGING
              if (data.trim() !== '[DONE]') {
                const json = JSON.parse(data)
                if (json.choices[0].finish_reason != null) {
                  if (!isStreamClosed) {
                    controller.close()
                    isStreamClosed = true // Update the flag after closing the stream
                  }
                  return
                }
                const text = json.choices[0].delta.content
                const queue = encoder.encode(text)
                controller.enqueue(queue)
              } else {
                if (!isStreamClosed) {
                  controller.close()
                  isStreamClosed = true // Update the flag after closing the stream
                }
                return
              }
            } catch (e) {
              if (!isStreamClosed) {
                controller.error(e)
                isStreamClosed = true // Update the flag if an error occurs
              }
            }
          }
        }

        const parser = createParser(onParse)

        try {
          for await (const chunk of res.body as any) {
            if (!isStreamClosed) {
              // Only feed the parser if the stream is not closed
              parser.feed(decoder.decode(chunk))
            }
          }
        } catch (e) {
          if (!isStreamClosed) {
            controller.error(e)
            isStreamClosed = true
          }
        }
      },
    })

    return apiStream
  } else {
    console.log('Non Streaming response ')
    const json = await res.json()
    console.log('Final OpenAI response: ', json)
    return json
  }
}
