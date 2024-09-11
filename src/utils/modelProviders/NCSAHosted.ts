// import { OllamaProvider } from 'ollama-ai-provider'
import { NCSAHostedProvider } from '~/types/LLMProvider'

export interface OllamaModel {
  id: string
  name: string
  parameterSize: string
  tokenLimit: number
  enabled: boolean
}

export enum NCSAHostedModelID {
  // Use "official" IDs from the Ollama API. Human-readable names in 'OllamaModels' below.
  LLAMA31_70b = 'llama3.1:70b',
}

export const NCSAHostedModels: Record<NCSAHostedModelID, OllamaModel> = {
  [NCSAHostedModelID.LLAMA31_70b]: {
    id: NCSAHostedModelID.LLAMA31_70b,
    name: 'Llama 3.1 70b',
    parameterSize: '70b',
    tokenLimit: 128000,
    enabled: true,
  },
}

export const getNCSAHostedModels = async (
  ncsaHostedProvider: NCSAHostedProvider,
): Promise<NCSAHostedProvider> => {
  try {
    if (!ncsaHostedProvider.baseUrl) {
      ncsaHostedProvider.baseUrl = process.env.OLLAMA_SERVER_URL
    }

    console.log('NCSA HOSTED PROVIDER', ncsaHostedProvider)

    const response = await fetch(ncsaHostedProvider.baseUrl + '/api/tags')

    if (!response.ok) {
      ncsaHostedProvider.error = `HTTP error! status: ${response.status}`
      return ncsaHostedProvider as NCSAHostedProvider
    }
    const data = await response.json()
    const ollamaModels: OllamaModel[] = data.models
      .filter((model: any) =>
        Object.values(NCSAHostedModelID).includes(model.model),
      )
      .map((model: any): OllamaModel => {
        return NCSAHostedModels[model.model as NCSAHostedModelID]
      })

    ncsaHostedProvider.models = ollamaModels
    return ncsaHostedProvider as NCSAHostedProvider
  } catch (error: any) {
    ncsaHostedProvider.error = error.message
    console.log('ERROR in getNCSAHostedModels', error)
    return ncsaHostedProvider as NCSAHostedProvider
  }
}
