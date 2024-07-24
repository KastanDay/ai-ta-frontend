// task is to iterate through the models and find available models that can run on ollama
import {
  OPENAI_API_HOST,
  OPENAI_API_TYPE,
  OPENAI_API_VERSION,
  OPENAI_ORGANIZATION,
} from '@/utils/app/const'

import { OpenAIModel, OpenAIModelID, OpenAIModels } from '@/types/openai'
import { decrypt, isEncrypted } from '~/utils/crypto'
import { LLMProvider, ProviderNames } from '~/types/LLMProvider'
import { getOllamaModels, runOllamaChat } from '~/utils/modelProviders/ollama'
//import { VercelAISDK } from 'vercel-ai-sdk'

import { openai } from '@ai-sdk/openai'
export const config = {
  runtime: 'edge',
}

export interface AzureModel {
  id: string
  name: string
  tokenLimit: number
}
import { CoreMessage, streamText } from 'ai'
import { Message } from '~/types/chat'

//azure streaming has already been created ignore this code and jsut use the model compilation code
export async function runAzure(
  messages: any,
  AzureProvider: LLMProvider,
  activeModel: any,
) {
  // TODO: fix the Messages type
  const result = await streamText({
    model: openai(activeModel), // replace with active model
    system: 'You are a helpful assistant.',
    messages,
  })

  return result.toAIStreamResponse()
}

export const getAzureModels = async (
  AzureProvider: LLMProvider,
): Promise<LLMProvider> => {
  try {
    if (!AzureProvider.AzureEndpoint || !AzureProvider.AzureDeployment) {
      // TODO move away from env vars
      AzureProvider.error = `Azure OpenAI endpoint or deployment is not set. Endpoint: ${AzureProvider.AzureEndpoint}, Deployment: ${AzureProvider.AzureDeployment}`
      return AzureProvider
    }

    const url = `${AzureProvider.AzureEndpoint}/openai/models?api-version=2024-02-01`

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'api-key': AzureProvider.apiKey!,
      },
    })

    if (!response.ok) {
      AzureProvider.error = `Azure OpenAI failed to fetch models. HTTP error, status: ${response.status}`
      return AzureProvider
      throw new Error(``)
    }

    const data = await response.json()
    console.log('this is the data', data)
    const azureModels: AzureModel[] = data.data.map((model: any) => {
      return {
        id: model.id,
        name: model.id,
        tokenLimit: 128000, // might need to change with smaller models add hardcode mapping model to token limit
        // Add any other relevant fields here
      } as AzureModel
    })
    console.log('Azure OpenAI models:', azureModels)
    AzureProvider.models = azureModels
    return AzureProvider
  } catch (error: any) {
    AzureProvider.error = error.message
    return AzureProvider
  }
}
