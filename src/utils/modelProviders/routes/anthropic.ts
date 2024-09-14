import { AnthropicProvider, ProviderNames } from '../LLMProvider'
import { AnthropicModel, AnthropicModels } from '../types/anthropic'

export const getAnthropicModels = async (
  anthropicProvider: AnthropicProvider,
): Promise<AnthropicProvider> => {
  anthropicProvider.provider = ProviderNames.Anthropic
  if (!anthropicProvider.apiKey) {
    anthropicProvider.error = 'Anthropic API key not set.'
    anthropicProvider.models = []
    return anthropicProvider
  }
  anthropicProvider.models = Object.values(AnthropicModels) as AnthropicModel[]
  delete anthropicProvider.error // Clear any previous errors
  return anthropicProvider
}
