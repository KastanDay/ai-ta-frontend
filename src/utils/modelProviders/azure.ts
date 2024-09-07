import { AzureProvider } from '~/types/LLMProvider'

export const config = {
  runtime: 'edge',
}

export interface AzureModel {
  id: string
  name: string
  tokenLimit: number
  enabled: boolean
}

export enum AzureModelID {
  GPT_4o_mini = 'gpt-4o-mini-2024-07-18',
  GPT_4o = 'gpt-4o-2024-08-06',
  GPT_4 = 'gpt-4-0613',
  GPT_4_Turbo = 'gpt-4-turbo-2024-04-09',
  GPT_3_5 = 'gpt-35-turbo-0125',
}

export const AzureModels: Record<AzureModelID, AzureModel> = {
  [AzureModelID.GPT_3_5]: {
    id: AzureModelID.GPT_3_5,
    name: 'GPT-3.5',
    tokenLimit: 16385,
    enabled: false,
  },
  [AzureModelID.GPT_4]: {
    id: AzureModelID.GPT_4,
    name: 'GPT-4',
    tokenLimit: 8192,
    enabled: false,
  },
  [AzureModelID.GPT_4_Turbo]: {
    id: AzureModelID.GPT_4_Turbo,
    name: 'GPT-4 Turbo',
    tokenLimit: 128000,
    enabled: false,
  },
  [AzureModelID.GPT_4o]: {
    id: AzureModelID.GPT_4o,
    name: 'GPT-4o',
    tokenLimit: 128000,
    enabled: false,
  },
  [AzureModelID.GPT_4o_mini]: {
    id: AzureModelID.GPT_4o_mini,
    name: 'GPT-4o-mini',
    tokenLimit: 128000,
    enabled: false,
  },
}

export const getAzureModels = async (
  azureProvider: AzureProvider,
): Promise<AzureProvider> => {
  try {
    if (!azureProvider.AzureEndpoint || !azureProvider.AzureDeployment) {
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
    }

    const data = await response.json()
    const azureModels: AzureModel[] = data.data
      .filter((model: any) => Object.values(AzureModelID).includes(model.id))
      .map((model: any) => {
        const azureModel = AzureModels[model.id as AzureModelID]
        return {
          id: model.id,
          name: azureModel.name,
          tokenLimit: azureModel.tokenLimit,
          enabled: true,
        } as AzureModel
      })
    azureProvider.models = azureModels
    return azureProvider
  } catch (error: any) {
    azureProvider.error = error.message
    return azureProvider
  }
}
