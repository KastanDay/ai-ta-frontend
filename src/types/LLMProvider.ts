import { OllamaModel } from '~/utils/modelProviders/ollama'
import { OpenAIModel } from './openai'

export enum ProviderNames {
  Ollama = 'Ollama',
  OpenAI = 'OpenAI',
}

export type SupportedModels = OllamaModel[] | OpenAIModel[]

export interface LLMProvider {
  provider: ProviderNames
  enabled: boolean
  baseUrl: string
  apiKey?: string
  models?: SupportedModels
}
