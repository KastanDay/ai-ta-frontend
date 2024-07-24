import { kv } from '@vercel/kv'
import { CourseMetadata } from '~/types/courseMetadata'
import { OpenAIModel, OpenAIModelID, OpenAIModels } from '@/types/openai'
import { LLMProvider, ProviderNames } from '~/types/LLMProvider'
import { OpenAI } from "openai";

export const config = {
  runtime: 'edge',
}

const tokenLimMAp = new Map([
  ['gpt-3.5-turbo-0125', 16385],
  ['gpt-4-0613', 8192],
  ['gpt-4-turbo-2024-04-09', 128000],
  ['gpt-4o-2024-05-13', 128000]
]);


const openAINames = new Map([
  ['gpt-3.5-turbo-0125', 'gpt-3.5-turbo'],
  ['gpt-4-0613', 'gpt-4'],
  ['gpt-4-turbo-2024-04-09', 'gpt-4-turbo'],
  ['gpt-4o-2024-05-13', 'gpt-4o'],

]);

export const getOpenAIModels = async (
  openAIProvider: LLMProvider,
  projectName: string,
) => {
  console.log('in openai get models', projectName)

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
      .filter(model => 
        ['gpt-3.5-turbo-0125', 'gpt-4-0613', 'gpt-4-turbo-2024-04-09', 'gpt-4o-2024-05-13'].includes(model.id)
      )
      .map((model: any) => {
        const value = tokenLimMAp.get(model.id);
        if (value === undefined) {
          throw new Error('model token limit not found for model id', model.id);
        }
        return {
          id: model.id,
          name: model.id, // Assuming model.id can be used as the name
          tokenLimit: tokenLimMAp.get(model.id) || 4096, // TODO: hard code.
          
        }
      })

    return openAIModels
  } catch (error) {
    console.error('Error fetching models:', error)
    return []
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
