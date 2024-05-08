import OpenAI from 'openai'
import { OpenAIStream, StreamingTextResponse } from 'ai'
import { NextResponse } from 'next/server'



export const runtime = 'edge'

export async function POST(req: Request) {


  try {
    const { messages, apiKey } = await req.json()
    const openai = new OpenAI({
      apiKey: apiKey,
    })
    console.log('apikey', apiKey)
    console.log('Messages to send to OpenAI: ', JSON.stringify(messages))
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      stream: true,
      messages,

    })

    const stream = OpenAIStream(response)

    return new StreamingTextResponse(stream)
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      const { name, status, headers, message } = error
      return NextResponse.json({ name, status, headers, message }, { status })
    } else {
      throw error
    }
  }
} 