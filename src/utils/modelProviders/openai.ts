import { generateText, streamText } from 'ai'
import { createOllama } from 'ollama-ai-provider'
import { OpenAIModel, OpenAIModelID, OpenAIModels } from '@/types/openai'
import { decrypt, isEncrypted } from '~/utils/crypto'
import { LLMProvider, ProviderNames } from '~/types/LLMProvider'


export const config = {
    runtime: 'edge',
}

export const getOpenAIModels = async (openAIProvider: LLMProvider) => {
  console.log('in openai get models')

  const { OpenAI } = require("openai");

  const client = new OpenAI({
    apiKey: openAIProvider.apiKey, // change to openai
  });
  console.log('created openai client')

  try {
    const response = await client.models.list();

    // Check if the response has a data property
    if (!response.data) {
      throw new Error('Invalid response format');
    }

    // Iterate through the models
    const openAIModels = response.data.map((model: any) => {
      return {
        id: model.id,
        name: model.id, // Assuming model.id can be used as the name
        tokenLimit: model.token_limit || 4096, // Adjust based on available properties
      };
    });

    // Log each model for debugging
    /*
    openAIModels.forEach((model:any) => {
      console.log(model);
    });
    */

    return openAIModels;
  } catch (error) {
    console.error('Error fetching models:', error);
  }
}
