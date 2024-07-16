import { OllamaModel } from '~/utils/modelProviders/ollama'
import { OpenAIModel } from './openai'
import { WebllmModel } from '~/utils/modelProviders/WebLLM'
import { AnthropicModel } from '~/utils/modelProviders/anthropic'

export enum ProviderNames {
  Ollama = 'Ollama',
  OpenAI = 'OpenAI',
  Azure = 'Azure',
  Anthropic = 'Anthropic',
}

export type SupportedModels =
  | OllamaModel[]
  | OpenAIModel[]
  | WebllmModel[]
  | AnthropicModel[]

export interface GenericSupportedModel {
  id: string
  name: string
  parameterSize?: string
  tokenLimit: number
}

export interface LLMProvider {
  provider: ProviderNames
  enabled: boolean
  baseUrl?: string
  apiKey?: string
  models?: SupportedModels
  AzureEndpoint?: string
  AzureDeployment?: string
  AnthropicModel?: string
}
