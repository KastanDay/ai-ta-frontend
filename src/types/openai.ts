// import { OPENAI_API_TYPE } from '../utils/app/const'

export interface OpenAIModel {
  id: string
  name: string
  maxLength: number // maximum length of a message in characters... should deprecate
  tokenLimit: number
}

export enum OpenAIModelID {
  GPT_3_5 = 'gpt-3.5-turbo',
  GPT_3_5_16k = 'gpt-3.5-turbo-16k',
  GPT_4 = 'gpt-4',
  GPT_4_1106_PREVIEW = 'gpt-4-1106-preview',
  GPT_4_0125_PREVIEW = 'gpt-4-0125-preview',
  GPT_4_VISION = 'gpt-4-vision-preview',
  // GPT_4_32K = 'gpt-4-32k',
  // Azure -- ONLY GPT-4 supported for now... due to deployment param being env var...
  GPT_4_AZURE = 'gpt-4-128k',
  // GPT_3_5_AZ = 'gpt-35-turbo',
  // GPT_3_5_16k_AZURE = 'gpt-35-turbo-16k'
}

// in case the `DEFAULT_MODEL` environment variable is not set or set to an unsupported model
export const fallbackModelID = OpenAIModelID.GPT_4

export const OpenAIModels: Record<OpenAIModelID, OpenAIModel> = {
  [OpenAIModelID.GPT_3_5]: {
    id: OpenAIModelID.GPT_3_5,
    name: 'GPT-3.5 (4k)',
    maxLength: 12000,
    tokenLimit: 4096,
  },
  [OpenAIModelID.GPT_3_5_16k]: {
    id: OpenAIModelID.GPT_3_5_16k,
    name: 'GPT-3.5 (16k)',
    maxLength: 49000,
    tokenLimit: 16385,
  },
  [OpenAIModelID.GPT_4]: {
    id: OpenAIModelID.GPT_4,
    name: 'GPT-4 (8k)',
    maxLength: 24000,
    tokenLimit: 8192,
  },
  [OpenAIModelID.GPT_4_1106_PREVIEW]: {
    id: OpenAIModelID.GPT_4_1106_PREVIEW,
    name: 'GPT-4 Turbo 1106 (128k)',
    maxLength: 24000,
    tokenLimit: 128000,
  },
  [OpenAIModelID.GPT_4_0125_PREVIEW]: {
    id: OpenAIModelID.GPT_4_0125_PREVIEW,
    name: 'GPT-4 Turbo 0125 (128k)',
    maxLength: 24000,
    tokenLimit: 128000,
  },
  // ! Our hard-coded Azure implementation ONLY allows GPT-4, no other azure models on that deployment

  // [OpenAIModelID.GPT_3_5_AZ]: {
  //   id: OpenAIModelID.GPT_3_5_AZ,
  //   name: 'GPT-3.5',
  //   maxLength: 12000,
  //   tokenLimit: 4096,
  // },
  // [OpenAIModelID.GPT_3_5_16k_AZURE]: {
  //   id: OpenAIModelID.GPT_3_5_16k_AZURE,
  //   name: 'GPT-3.5-16k (large context)',
  //   maxLength: 49000,
  //   tokenLimit: 16385,
  // },
  // [OpenAIModelID.GPT_4_32K]: {
  //   id: OpenAIModelID.GPT_4_32K,
  //   name: 'GPT-4-32K',
  //   maxLength: 96000,
  //   tokenLimit: 32768,
  // },
  [OpenAIModelID.GPT_4_AZURE]: {
    id: OpenAIModelID.GPT_4_AZURE,
    name: 'GPT-4 Turbo (128k)',
    maxLength: 24000,
    tokenLimit: 128000,
  },
  [OpenAIModelID.GPT_4_VISION]: {
    id: OpenAIModelID.GPT_4_VISION,
    name: 'GPT-4 Vision',
    maxLength: 8000,
    tokenLimit: 110000, // TPM of 40,000 -- so have to reduce this, despite it supporting up to 128k
  },
}
