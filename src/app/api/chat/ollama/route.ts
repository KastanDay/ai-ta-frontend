import { createOllama } from 'ollama-ai-provider'
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

  // const res = ollama.chat('llama3:70b-instruct', )//, numCtx=8192)
  const model = ollama('llama3:70b-instruct')
  model.doStream

  // return new StreamingTextResponse(res.doStream)
  // return res.doStream
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
