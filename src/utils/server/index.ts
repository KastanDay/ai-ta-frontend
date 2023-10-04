import { Message, type OpenAIChatMessage } from '@/types/chat'
import { type OpenAIModel } from '@/types/openai'

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
import { decrypt } from '../crypto'

export class OpenAIError extends Error {
  type: string
  param: string
  code: string

  constructor(message: string, type: string, param: string, code: string) {
    super(JSON.stringify({message}))
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
  key: string,
  messages: OpenAIChatMessage[],
) => {
  let apiKey = key
  if (key && !key.startsWith('sk-')) {
    const decryptedText = await decrypt(
      key,
      process.env.NEXT_PUBLIC_SIGNING_KEY as string,
    )
    apiKey = decryptedText as string
    console.log('Decrypted api key for openai chat: ', apiKey)
  } else {
    console.log('Using client key for openai chat: ', apiKey)
  }

  let url = `${OPENAI_API_HOST}/v1/chat/completions`
  if (OPENAI_API_TYPE === 'azure') {
    url = `${OPENAI_API_HOST}/openai/deployments/${AZURE_DEPLOYMENT_ID}/chat/completions?api-version=${OPENAI_API_VERSION}`
  }
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(OPENAI_API_TYPE === 'openai' && {
        Authorization: `Bearer ${apiKey}`,
      }),
      ...(OPENAI_API_TYPE === 'azure' && {
        'api-key': `${apiKey}`,
      }),
      ...(OPENAI_API_TYPE === 'openai' &&
        OPENAI_ORGANIZATION && {
          'OpenAI-Organization': OPENAI_ORGANIZATION,
        }),
    },
    method: 'POST',
    body: JSON.stringify({
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
      stream: true,
    }),
  })

  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  if (res.status !== 200) {
    const result = await res.json()
    console.log("Result: ", result)
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

  const stream = new ReadableStream({
    async start(controller) {
      const onParse = (event: ParsedEvent | ReconnectInterval) => {
        if (event.type === 'event') {
          const data = event.data

          try {
            const json = JSON.parse(data)
            if (json.choices[0].finish_reason != null) {
              controller.close()
              return
            }
            const text = json.choices[0].delta.content
            const queue = encoder.encode(text)
            controller.enqueue(queue)
          } catch (e) {
            controller.error(e)
          }
        }
      }

      const parser = createParser(onParse)

      for await (const chunk of res.body as any) {
        parser.feed(decoder.decode(chunk))
      }
    },
  })

  return stream
}
