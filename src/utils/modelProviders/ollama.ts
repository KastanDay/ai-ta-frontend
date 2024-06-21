import { generateText, streamText } from 'ai'
import { createOllama } from 'ollama-ai-provider'

export interface OllamaModel {
  id: string
  name: string
  parameterSize: string
  tokenLimit: number
}

export const runOllamaChat = async () => {
  console.log('In ollama POST endpoint')

  const ollama = createOllama({
    // custom settings
    baseURL: 'https://ollama.ncsa.ai/api',
  })

  const messages = [
    {
      role: 'user',
      content: 'why is the sky blue?',
    },
  ]

  const result = await generateText({
    maxTokens: 1024,
    model: ollama('llama3:70b-instruct'),
    prompt: 'Invent a new holiday and describe its traditions.',
  })

  console.log('OLLAMA RESULT', result.text)

  // TODO: Check out the server example for how to handle streaming responses
  // https://sdk.vercel.ai/examples/next-app/chat/stream-chat-completion#server

  // const result = await streamText({
  //     maxRetries: 5,
  //     maxTokens: 512,
  //     model: ollama('llama3:70b-instruct'),
  //     messages: messages,
  //     temperature: 0.3,
  // })

  // let fullResponse = '';
  // for await (const textPart of result.textStream) {
  //     fullResponse += textPart;
  // }

  // try {
  //     const parsedResponse = JSON.parse(fullResponse);
  //     console.log(parsedResponse);
  // } catch (error) {
  //     console.error('Failed to parse JSON:', error);
  // }

  // console.log()
  // console.log('Token usage:', await result.usage)
  // console.log('Finish reason:', await result.finishReason)
}

export const getOllamaModels = async () => {
  const response = await fetch('https://ollama.ncsa.ai/api/ps')
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
