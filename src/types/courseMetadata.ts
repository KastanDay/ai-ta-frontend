// all values are email addresses

import { LLMProvider, ProviderNames } from './LLMProvider'

// courseMetadata.ts
export interface CourseMetadata {
  is_private: boolean
  course_owner: string
  course_admins: string[]
  approved_emails_list: string[]
  example_questions: string[] | undefined
  banner_image_s3: string | undefined
  course_intro_message: string | undefined
  system_prompt: string | undefined
  openai_api_key: string | undefined // TODO: remove
  disabled_models: string[] | undefined // TODO: remove
  // llmProviders?: LLMProvider[]
}

export type ProjectWideLLMProviders = {
  [P in ProviderNames]?: LLMProvider & { provider: P }
} & {
  // llmProviders?: LLMProvider[]
  defaultModel: string
  defaultTemperature: number
  disabled_models: string[] | undefined
}

export interface CourseMetadataOptionalForUpsert {
  is_private: boolean | undefined
  course_owner: string | undefined
  course_admins: string[] | undefined
  approved_emails_list: string[] | undefined
  example_questions: string[] | undefined
  banner_image_s3: string | undefined
  course_intro_message: string | undefined
  openai_api_key: string | undefined
  system_prompt: string | undefined
  disabled_models: string[] | undefined
}
