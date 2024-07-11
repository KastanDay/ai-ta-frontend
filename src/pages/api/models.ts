// task is to iterate through the models and find available models that can run on ollama
import {
  OPENAI_API_HOST,
  OPENAI_API_TYPE,
  OPENAI_API_VERSION,
  OPENAI_ORGANIZATION,
} from '@/utils/app/const'

import { OpenAIModel, OpenAIModelID, OpenAIModels } from '@/types/openai'
import { decrypt, isEncrypted } from '~/utils/crypto'
import { LLMProvider, ProviderNames, SupportedModels } from '~/types/LLMProvider'
import { getOllamaModels, runOllamaChat } from '~/utils/modelProviders/ollama'
import { getOpenAIModels } from '~/utils/modelProviders/openai'
import { getAzureModels } from '~/utils/modelProviders/azure'
import { getAnthropicModels } from '~/utils/modelProviders/anthropic'

import { WebllmModel } from '~/utils/modelProviders/WebLLM'
import { ModelRecord, prebuiltAppConfig } from '~/utils/modelProviders/ConfigWebLLM'
import { OllamaModel } from '~/utils/modelProviders/ollama'
import { CreateMLCEngine } from "@mlc-ai/web-llm";

export const config = {
  runtime: 'edge',
}
export function convertToLocalModels(record: ModelRecord): WebllmModel {
  return {
    id: record.model_id,
    name: record.model_id,
    parameterSize: 'Unknown',
    tokenLimit: record.overrides?.context_window_size,
    downloadSize: record.vram_required_MB ? `${(record.vram_required_MB / 1024).toFixed(2)}GB` : 'unknown',
    isDownloaded: false
  };
}
export const webLLMModels: WebllmModel[] = prebuiltAppConfig.model_list.map((model: ModelRecord) => convertToLocalModels(model));
export let ollamaModels: OllamaModel[] = []

const handler = async (req: Request): Promise<Response> => {
  console.log('in handler')
  let apiKey = ''
  let apiType = OPENAI_API_TYPE
  let endpoint = OPENAI_API_HOST
  console.log('this is what reuest is', req)
  try {
    const { key } = (await req.json()) as {
      key: string

    }
    console.log('key', key)

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
      apiKey: 'b1a402d721154a97a4eeaa61200eb93f',   // this is the azure api key
      AzureDeployment: 'gpt-35-turbo-16k',
      AzureEndpoint: 'https://uiuc-chat-canada-east.openai.azure.com/'

    }

    const AnthropicProvider: LLMProvider = {
      provider: ProviderNames.Anthropic,
      enabled: true,
      //apiKey: 'b1a402d721154a97a4eeaa61200eb93f',   // this is the azure api key
      AnthropicModel: 'claude-3-opus-20240229'
      //AzureEndpoint: 'https://uiuc-chat-canada-east.openai.azure.com/'
      
    }

    const llmProviderKeys: LLMProvider[] = [ollamaProvider, OpenAIProvider, AzureProvider, AnthropicProvider] 
    // iterates and collects all models for the givne provider keys
    let totalModels: SupportedModels[] = []
    for (const provider of llmProviderKeys) {
      if (provider.provider == 'Ollama') {
        const fetchedOllamaModels = await getOllamaModels(ollamaProvider)
        ollamaModels = fetchedOllamaModels // Update the exported variable
        totalModels.push(ollamaModels)

      }
      else if (provider.provider == 'OpenAI') {
        //2. call an endpoint to check which openai modle available
        const openAIModels = await getOpenAIModels(OpenAIProvider)
        totalModels.push(openAIModels)
      } 
      else if(provider.provider == 'Azure') {
        const azureOpenaiModels = await getAzureModels(AzureProvider)
        totalModels.push(azureOpenaiModels)
      }
      else if(provider.provider == 'Anthropic'){
        const AnthropicModels = await getAnthropicModels(AnthropicProvider)
        totalModels.push(AnthropicModels)
      }
      else {
        continue
      }

    }
    //print all models to terminal
    console.log('total models available', totalModels)

    // Test chat function
    //const ret = await runOllamaChat() still needs work fors stremaing

    // legacy code take a look
    apiKey = key ? key : (process.env.OPENAI_API_KEY as string)
    // Check if the key starts with 'sk-' (indicating it's not encrypted)
    if (key && isEncrypted(key)) {
      // Decrypt the key
      const decryptedText = await decrypt(
        key,
        process.env.NEXT_PUBLIC_SIGNING_KEY as string,
      )
      apiKey = decryptedText as string
    }
    console.log('models.ts Final openai key: ', apiKey)
    // return total models which compiles all valid models
    return new Response(JSON.stringify(totalModels), { status: 200 })
  } catch (error) {
    console.error(error)
    return new Response('Error', { status: 500 })
  }
}

export default handler
