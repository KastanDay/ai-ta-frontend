import { generateText, streamText } from 'ai'
import { createOllama } from 'ollama-ai-provider'
// import { openai } from '@ai-sdk/openai';

export interface OllamaModel {
  id: string
  name: string
  parameterSize: string
  tokenLimit: number
}

export const runOllamaChat = async () => {
  console.log('In ollama runOllamaChat function')

  const ollama = createOllama({
    // custom settings
    baseURL: 'https://ollama.ncsa.ai/api',
  })

  console.log('Right before calling fetch')
  const result = await generateText({
    maxTokens: 50,
    model: ollama('llama3:8b'),
    prompt: 'Invent a new holiday and describe its traditions.',
  })
  console.log(
    'generateText result: ---------------------------------------------',
  )
  console.log(result.text)
  console.log('^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^')
  return result.text

  // This should work, but we're getting JSON Parse errors.
  // const result = await streamText({
  //   maxTokens: 1024,
  //   messages: [
  //     {
  //       content: 'Hello!',
  //       role: 'user',
  //     },
  //     {
  //       content: 'Hello! How can I help you today?',
  //       role: 'assistant',
  //     },
  //     {
  //       content: 'I need help with my computer.',
  //       role: 'user',
  //     },
  //   ],
  //   model: model,
  //   system: 'You are a helpful chatbot.',
  // })

  // console.log("after starting streamtext. Result:", result)

  // for await (const textPart of result.textStream) {
  //   console.log('OLLAMA TEXT PART:', textPart)
  // }
  // return result

  // const messages = [
  //   {
  //     role: 'tool',
  //     content: 'why is the sky blue?',
  //   },
  // ]

  // console.log('OLLAMA RESULT', result.text)

  // TODO: Check out the server example for how to handle streaming responses
  // https://sdk.vercel.ai/examples/next-app/chat/stream-chat-completion#server
}

export const getOllamaModels = async () => {
  const response = await fetch('https://ollama.ncsa.ai/api/tags')
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  const data = await response.json()

  const ollamaModels: OllamaModel[] = data.models.map((model: any) => {
    return {
      id: model.name,
      name: model.name,
      parameterSize: model.details.parameter_size,
      tokenLimit: 4096,
    } as OllamaModel
  })

  return ollamaModels
}
