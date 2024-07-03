import { OllamaModel } from '~/utils/modelProviders/ollama'
import { OpenAIModel } from './openai'
import { WebllmModel } from '~/utils/modelProviders/WebLLM'

export enum ProviderNames {
  Ollama = 'Ollama',
  OpenAI = 'OpenAI',
  Azure = 'Azure'
}

export type SupportedModels = OllamaModel[] | OpenAIModel[] | WebllmModel[]

export interface LLMProvider {
  provider: ProviderNames
  enabled: boolean
  baseUrl?: string
  apiKey?: string
  models?: SupportedModels
  AzureEndpoint?: string
  AzureDeployment?: string
  
}
