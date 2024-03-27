import { OpenAIStream, StreamingTextResponse } from 'ai'
import OpenAI from 'openai'
import type { ChatCompletionCreateParams } from 'openai/resources/chat'

// Create an OpenAI API client (that's edge friendly!)
console.log('process.env.OPENAI_API_KEY: ', process.env.OPENAI_API_KEY)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

// Set the runtime to edge
export const runtime = 'edge'

// Function definition:
const functions: ChatCompletionCreateParams.Function[] = [
  {
    name: 'get_current_weather',
    description: 'Get the current weather',
    parameters: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: 'The city and state, e.g. San Francisco, CA',
        },
        format: {
          type: 'string',
          enum: ['celsius', 'fahrenheit'],
          description:
            'The temperature unit to use. Infer this from the users location.',
        },
      },
      required: ['location', 'format'],
    },
  },
]

// And use it like this:
export async function POST(req: Request) {
  console.log('In chat POST route')
  const { messages } = await req.json()

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo-0613',
    stream: true,
    messages,
    functions,
  })

  const stream = OpenAIStream(response)
  return new StreamingTextResponse(stream)
}
