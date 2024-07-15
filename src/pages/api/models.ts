// task is to iterate through the models and find available models that can run on ollama
import {
  OPENAI_API_HOST,
  OPENAI_API_TYPE,
  OPENAI_API_VERSION,
  OPENAI_ORGANIZATION,
} from '@/utils/app/const'

import { OpenAIModel, OpenAIModelID, OpenAIModels } from '@/types/openai'
import { decrypt, isEncrypted } from '~/utils/crypto'
import {
  LLMProvider,
  ProviderNames,
  SupportedModels,
} from '~/types/LLMProvider'
import { getOllamaModels, runOllamaChat } from '~/utils/modelProviders/ollama'
import { getOpenAIModels } from '~/utils/modelProviders/openai'
import { getAzureModels } from '~/utils/modelProviders/azure'
import {
  getAnthropicModels,
  runAnthropicChat,
} from '~/utils/modelProviders/anthropic'

import { WebllmModel } from '~/utils/modelProviders/WebLLM'
import {
  ModelRecord,
  prebuiltAppConfig,
} from '~/utils/modelProviders/ConfigWebLLM'
import { OllamaModel } from '~/utils/modelProviders/ollama'
import { CreateMLCEngine } from '@mlc-ai/web-llm'
import { ChevronsDownLeft } from 'tabler-icons-react'
import { env } from 'process'
import { all } from 'axios'

export const config = {
  runtime: 'edge',
}
export function convertToLocalModels(record: ModelRecord): WebllmModel {
  return {
    id: record.model_id,
    name: record.model_id,
    parameterSize: 'Unknown',
    tokenLimit: record.overrides?.context_window_size,
    downloadSize: record.vram_required_MB
      ? `${(record.vram_required_MB / 1024).toFixed(2)}GB`
      : 'unknown',
  }
}
export const webLLMModels: WebllmModel[] = prebuiltAppConfig.model_list.map(
  (model: ModelRecord) => convertToLocalModels(model),
)
export let ollamaModels: OllamaModel[] = []

const handler = async (req: Request): Promise<Response> => {
  try {
    // TODO: MOVE THESE TO DB INPUTS

    // const { key } = (await req.json()) as {
    //   key: string
    // }
    // Eventually we'll use this. For now, there's no API Key for Ollama
    const ollamaProvider: LLMProvider = {
      provider: ProviderNames.Ollama,
      enabled: true,
      baseUrl: 'https://ollama.ncsa.ai/api/tags',
    }

    const OpenAIProvider: LLMProvider = {
      provider: ProviderNames.OpenAI,
      enabled: true,
      apiKey: process.env.OPENAI_API_KEY,
      baseUrl: 'https://ollama.ncsa.ai/api/tags',
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
      //AzureEndpoint: 'https://uiuc-chat-canada-east.openai.azure.com/'
    }

    const llmProviderKeys: LLMProvider[] = [
      ollamaProvider,
      OpenAIProvider,
      AzureProvider,
      AnthropicProvider,
    ]
    // END-TODO: MOVE THESE TO DB INPUTS

    let allSupportedModels: { [providerName: string]: SupportedModels } = {}
    for (const llmProvider of llmProviderKeys) {
      if (llmProvider.provider == ProviderNames.Ollama) {
        const fetchedOllamaModels = await getOllamaModels(ollamaProvider)
        ollamaModels = fetchedOllamaModels // Update the exported variable
        allSupportedModels[llmProvider.provider] = fetchedOllamaModels
      } else if (llmProvider.provider == ProviderNames.OpenAI) {
        const openAIModels = await getOpenAIModels(OpenAIProvider)
        allSupportedModels[llmProvider.provider] = openAIModels
      } else if (llmProvider.provider == ProviderNames.Azure) {
        const azureModels = await getAzureModels(AzureProvider)
        allSupportedModels[llmProvider.provider] = azureModels
      } else if (llmProvider.provider == ProviderNames.Anthropic) {
        const anthropicModels = await getAnthropicModels(AnthropicProvider)
        allSupportedModels[llmProvider.provider] = anthropicModels
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
