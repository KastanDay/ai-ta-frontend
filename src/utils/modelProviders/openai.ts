import { kv } from '@vercel/kv'
import { CourseMetadata } from '~/types/courseMetadata'
import { OpenAIModel, OpenAIModelID, OpenAIModels } from '@/types/openai'
import { LLMProvider, ProviderNames } from '~/types/LLMProvider'

export const config = {
  runtime: 'edge',
}

export const getOpenAIModels = async (
  openAIProvider: LLMProvider,
  projectName: string,
) => {
  console.log('in openai get models', projectName)

  const { OpenAI } = require('openai')

  const client = new OpenAI({
    apiKey: openAIProvider.apiKey, // change to openai
  })
  console.log('created openai client')

  try {
    const response = await client.models.list()

    if (!response.data) {
      throw new Error('Invalid OpenAI Model List response format')
    }

    const disabledModels = await getDisabledOpenAIModels({ projectName })
    console.log('disabled models in OpenAI: ', disabledModels)

    // Iterate through the models
    // TODO double check this works: filter out disabled models
    const openAIModels = response.data
      .filter((model: any) => !disabledModels.includes(model.id)) // Exclude disabled models
      .map((model: any) => {
        return {
          id: model.id,
          name: model.id, // Assuming model.id can be used as the name
          tokenLimit: model.token_limit || 4096, // Adjust based on available properties
        }
      })

    return openAIModels
  } catch (error) {
    console.error('Error fetching models:', error)
  }
}

const getDisabledOpenAIModels = async ({
  projectName,
}: {
  projectName: string
}): Promise<string[]> => {
  /* 
  returns just the model IDs.
  */

  const course_metadata = (await kv.hget(
    'course_metadatas',
    projectName,
  )) as CourseMetadata

  if (course_metadata && course_metadata.disabled_models) {
    // returns just the model IDs
    return course_metadata.disabled_models
  } else {
    // All models are enabled
    return []
  }
}
