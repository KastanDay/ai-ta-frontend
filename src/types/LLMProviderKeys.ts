import { OllamaModel } from './OllamaProvider'
import { OpenAIModel } from './openai'

export enum ProviderNames {
  Ollama = 'Ollama',
  OpenAI = 'OpenAI',
}

export interface LLMProvider {
  provider: ProviderNames
  enabled: boolean
  baseUrl: string
  apiKey?: string
  models?: OllamaModel[] | OpenAIModel[]
}
