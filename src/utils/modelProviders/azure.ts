import { AzureProvider, LLMProvider } from '~/types/LLMProvider'

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
  azureProvider: AzureProvider,
): Promise<AzureProvider> => {
  try {
    if (!azureProvider.AzureEndpoint || !azureProvider.AzureDeployment) {
      // TODO move away from env vars
      azureProvider.error = `Azure OpenAI endpoint or deployment is not set. Endpoint: ${azureProvider.AzureEndpoint}, Deployment: ${azureProvider.AzureDeployment}`
      return azureProvider
    }

    const url = `${azureProvider.AzureEndpoint}/openai/models?api-version=2024-02-01`

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'api-key': azureProvider.apiKey!,
      },
    })

    if (!response.ok) {
      azureProvider.error = `Azure OpenAI failed to fetch models. HTTP error, status: ${response.status}`
      return azureProvider
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
    azureProvider.models = azureModels
    return azureProvider
  } catch (error: any) {
    azureProvider.error = error.message
    return azureProvider
  }
}
