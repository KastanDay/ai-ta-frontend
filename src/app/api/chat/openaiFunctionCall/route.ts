import { OpenAIStream, StreamingTextResponse } from 'ai'
import OpenAI from 'openai'
import type {
  ChatCompletionCreateParams,
  ChatCompletionMessageParam,
} from 'openai/resources/chat'

import { Conversation, Message } from '~/types/chat'

// Create an OpenAI API client (that's edge friendly!)
// TODO: Use course API key...
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

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
  {
    name: 'run_pest_detection',
    description:
      'Run pest detection on an image if the user is concerned about their crop.',
    // parameters: {
    //   type: 'object',
    //   properties: {
    //     location: {
    //       type: 'string',
    //       description: 'T',
    //     },
    //     format: {
    //       type: 'string',
    //       enum: ['celsius', 'fahrenheit'],
    //       description:
    //         'The temperature unit to use. Infer this from the users location.',
    //     },
    //   },
    //   required: ['location', 'format'],
    // },
  },
]

const conversationToMessages = (
  inputData: Conversation,
): ChatCompletionMessageParam[] => {
  const transformedData: ChatCompletionMessageParam[] = []

  inputData.messages.forEach((message) => {
    const simpleMessage: ChatCompletionMessageParam = {
      role: message.role,
      content: Array.isArray(message.content)
        ? message.content[0]?.text ?? ''
        : message.content,
    }
    transformedData.push(simpleMessage)
  })

  console.log('Transformed messages array: ', transformedData)

  return transformedData
}

export async function POST(req: Request) {
  console.log('In chat POST route...')
  const {
    conversation,
    tools,
  }: {
    messages: Message
    tools: ChatCompletionCreateParams.Function[]
    conversation: Conversation
  } = await req.json()

  // format into OpenAI message format
  const message_to_send: ChatCompletionMessageParam[] =
    conversationToMessages(conversation)

  // Add system message
  message_to_send.unshift({
    role: 'system',
    content: conversation.prompt,
  })

  console.log('Message to send: ', message_to_send)

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo-0613', // hard code function calling model.
    stream: true,
    messages: message_to_send,
    // functions: tools, // TODO
    functions,
  })

  const stream = OpenAIStream(response)
  return new StreamingTextResponse(stream)
}
