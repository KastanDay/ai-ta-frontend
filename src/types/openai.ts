// import { OPENAI_API_TYPE } from '../utils/app/const'

import {
  AllLLMProviders,
  GenericSupportedModel,
  SupportedModels,
} from './LLMProvider'

// import { SupportedModelsObj } from '~/pages/api/models'

export interface OpenAIModel {
  id: string
  name: string
  tokenLimit: number
}

// Ordered list of preferred model IDs -- the first available model will be used as default
export const preferredModelIds = [
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4-turbo-2024-04-09',
  'gpt-4-128k',
  'gpt-4-0125-preview',
  'gpt-4-1106-preview',
  'gpt-4-vision-preview',
  'gpt-4',
  'gpt-3.5-turbo-16k',
  'gpt-3.5-turbo',
]

export const selectBestModel = (
  allLLMProviders: AllLLMProviders,
): GenericSupportedModel => {
  // TODO: fix
  return {
    id: 'llama3.1:70b',
    name: 'llama3.1:70b',
    tokenLimit: 128000,
  }
  const defaultModelId = OpenAIModelID.GPT_4o
  return OpenAIModels[defaultModelId]
  // if (!models || !models.OpenAI) {
  //   return OpenAIModels[defaultModelId]
  // }

  // // Find and return the first available preferred model
  // for (const preferredId of preferredModelIds) {
  //   const model = models.OpenAI.find((m) => m.id === preferredId)
  //   if (model) {
  //     return model
  //   }
  // }

  // // Fallback to the first model in the list or the default model
  // return models.OpenAI[0] || OpenAIModels[defaultModelId]
}

export enum OpenAIModelID {
  GPT_3_5 = 'gpt-3.5-turbo', // rolling model - currently points to gpt-3.5-turbo-0125
  GPT_4 = 'gpt-4', // rolling model - currently points to gpt-4-0613
  GPT_4_Turbo = 'gpt-4-turbo', // rolling model - currently points to gpt-4-turbo-2024-04-09
  GPT_4o = 'gpt-4o', // rolling model - currently points to gpt-4o-2024-05-13
  GPT_4o_mini = 'gpt-4o-mini', // rolling model - currently points to gpt-4o-2024-05-13

  // Azure -- ONLY GPT-4 supported for now... due to deployment param being env var...
  // This values are deployment names, not model names
  GPT_4_AZURE = 'gpt-4-128k',
  GPT_4_HACKATHON = 'gpt-4-hackathon',
  GPT_4_AZURE_04_09 = 'gpt-4-04-09',
}

// in case the `DEFAULT_MODEL` environment variable is not set or set to an unsupported model
export const fallbackModelID = OpenAIModelID.GPT_4

export const OpenAIModels: Record<OpenAIModelID, OpenAIModel> = {
  [OpenAIModelID.GPT_3_5]: {
    id: OpenAIModelID.GPT_3_5,
    name: 'GPT-3.5 (16k)',
    tokenLimit: 16385,
  },
  [OpenAIModelID.GPT_4]: {
    id: OpenAIModelID.GPT_4,
    name: 'GPT-4 (8k)',
    tokenLimit: 8192,
  },
  [OpenAIModelID.GPT_4_Turbo]: {
    id: OpenAIModelID.GPT_4_Turbo,
    name: 'GPT-4 Turbo (128k)',
    tokenLimit: 128000,
  },
  [OpenAIModelID.GPT_4o]: {
    id: OpenAIModelID.GPT_4o,
    name: 'GPT-4o (128k)',
    tokenLimit: 128000,
  },
  [OpenAIModelID.GPT_4o_mini]: {
    id: OpenAIModelID.GPT_4o_mini,
    name: 'GPT-4o-mini (128k)',
    tokenLimit: 128000,
  },

  // ! Our hard-coded Azure implementation ONLY allows GPT-4, no other azure models on that deployment
  [OpenAIModelID.GPT_4_AZURE]: {
    id: OpenAIModelID.GPT_4_AZURE,
    name: 'GPT-4 Turbo (128k)',
    tokenLimit: 128000,
  },
  [OpenAIModelID.GPT_4_HACKATHON]: {
    id: OpenAIModelID.GPT_4_HACKATHON,
    name: 'GPT-4 Hackathon',
    tokenLimit: 128000,
  },
  [OpenAIModelID.GPT_4_AZURE_04_09]: {
    id: OpenAIModelID.GPT_4_AZURE_04_09,
    name: 'GPT-4 Turbo 0409 (128k)',
    tokenLimit: 128000,
  },
}

export const VisionCapableModels: Set<OpenAIModelID> = new Set([
  OpenAIModelID.GPT_4_Turbo, // Add other vision capable models here as needed
  OpenAIModelID.GPT_4_AZURE_04_09,
  OpenAIModelID.GPT_4o,
  OpenAIModelID.GPT_4o_mini,
])
