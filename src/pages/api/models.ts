import {
  LLMProvider,
  ProviderNames,
  SupportedModels,
} from '~/types/LLMProvider'
import { getOllamaModels, runOllamaChat } from '~/utils/modelProviders/ollama'
import { getOpenAIModels } from '~/utils/modelProviders/openai'
import { getAzureModels } from '~/utils/modelProviders/azure'
import { getAnthropicModels } from '~/utils/modelProviders/anthropic'

import { webLLMModels } from '~/utils/modelProviders/WebLLM'

export const config = {
  runtime: 'edge',
}

const handler = async (req: Request): Promise<Response> => {
  try {
    const { projectName } = (await req.json()) as {
      projectName: string
    }
    // TODO: MOVE THESE TO DB INPUTS
    const ollamaProvider: LLMProvider = {
      provider: ProviderNames.Ollama,
      enabled: true,
      baseUrl: 'https://ollama.ncsa.ai',
    }

    const OpenAIProvider: LLMProvider = {
      provider: ProviderNames.OpenAI,
      enabled: true,
      apiKey: process.env.OPENAI_API_KEY,
      // baseUrl: 'https://ollama.ncsa.ai/api/tags',
    }
    const AzureProvider: LLMProvider = {
      provider: ProviderNames.Azure,
      enabled: true,
      apiKey: process.env.AZURE_API_KEY, // this is the azure api key
      AzureDeployment: 'gpt-35-turbo-16k',
      AzureEndpoint: 'https://uiuc-chat-canada-east.openai.azure.com/',
    }

    const AnthropicProvider: LLMProvider = {
      provider: ProviderNames.Anthropic,
      enabled: true,
      apiKey: process.env.ANTHROPIC_API_KEY, // this is the anthropic api key
      AnthropicModel: 'claude-3-opus-20240229',
    }

    const WebLLMProvider: LLMProvider = {
      provider: ProviderNames.WebLLM,
      enabled: true,
    }

    const llmProviderKeys: LLMProvider[] = [
      ollamaProvider,
      OpenAIProvider,
      AzureProvider,
      AnthropicProvider,
      WebLLMProvider,
    ]
    // END-TODO: MOVE THESE TO DB INPUTS

    await runOllamaChat(ollamaProvider)

    const allSupportedModels: { [providerName: string]: SupportedModels } = {}
    for (const llmProvider of llmProviderKeys) {
      if (!llmProvider.enabled) {
        continue
      }

      if (llmProvider.provider == ProviderNames.Ollama) {
        const fetchedOllamaModels = await getOllamaModels(ollamaProvider)
        const ollamaModels = fetchedOllamaModels // Update the exported variable
        allSupportedModels[llmProvider.provider] = fetchedOllamaModels
      } else if (llmProvider.provider == ProviderNames.OpenAI) {
        const openAIModels = await getOpenAIModels(OpenAIProvider, projectName)
        allSupportedModels[llmProvider.provider] = openAIModels
      } else if (llmProvider.provider == ProviderNames.Azure) {
        const azureModels = await getAzureModels(AzureProvider)
        allSupportedModels[llmProvider.provider] = azureModels
      } else if (llmProvider.provider == ProviderNames.Anthropic) {
        allSupportedModels[llmProvider.provider] =
          await getAnthropicModels(AnthropicProvider)
      } else if (llmProvider.provider == ProviderNames.WebLLM) {
        allSupportedModels[llmProvider.provider] = webLLMModels
      } else {
        continue
      }
    }

    // console.log('allSupportedModels', allSupportedModels)
    console.log('Done loading models...')

    return new Response(JSON.stringify(allSupportedModels), { status: 200 })
  } catch (error) {
    console.error(error)
    return new Response('Error', { status: 500 })
  }
}

export default handler

export interface SupportedModelsObj {
  [providerName: string]: SupportedModels
}
