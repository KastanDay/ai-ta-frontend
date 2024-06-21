import { createOllama } from 'ollama-ai-provider'
import { streamText } from 'ai'

// import { OllamaModel } from '~/types/OllamaProvider'

const ollama = createOllama({
  // custom settings
  baseURL: 'https://ollama.ncsa.ai/api/chat',
})

// export const runtime = 'edge'

export async function POST(req: Request) {
  /*
  Run Ollama chat, given a text string. Return a streaming response promise.
  */
  console.log('In ollama POST endpoint')

  const messages = [
    {
      role: 'user',
      content: 'why is the sky blue?',
    },
  ]

  const result = await streamText({
    maxRetries: 5,
    maxTokens: 512,
    model: ollama('llama3:70b-instruct'),
    prompt: 'Invent a new holiday and describe its traditions.',
    temperature: 0.3,
  })

  for await (const textPart of result.textStream) {
    process.stdout.write(textPart)
  }

  console.log()
  console.log('Token usage:', await result.usage)
  console.log('Finish reason:', await result.finishReason)
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
