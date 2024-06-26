// wrong rn working on integratign azure first


import { generateText, streamText } from 'ai'
import { createOllama } from 'ollama-ai-provider'
//import { openai } from '@ai-sdk/openai';

import { OpenAIModel, OpenAIModelID, OpenAIModels } from '@/types/openai'
import { decrypt, isEncrypted } from '~/utils/crypto'
import { LLMProvider, ProviderNames } from '~/types/LLMProvider'
//import { getOllamaModels, runOllamaChat } from '~/utils/modelProviders/ollama'

export const config = {
    runtime: 'edge',
}

/*
export const runOpenAIChat = async () => {
  console.log('In OpenAiApi chat function')

  const ollama = createOllama({
    // custom settings
    baseURL: 'https://ollama.ncsa.ai/api',
  })

  console.log('Right before calling fetch')
  const result = await generateText({
    maxTokens: 50,
    model: ollama('llama3:8b'),
    prompt: 'Invent a new holiday and describe its traditions.',
  })
  console.log(
    'generateText result: ---------------------------------------------',
  )
  console.log(result.text)
  console.log('^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^')
  return result.text

  // This should work, but we're getting JSON Parse errors.
  // const result = await streamText({
  //   maxTokens: 1024,
  //   messages: [
  //     {
  //       content: 'Hello!',
  //       role: 'user',
  //     },
  //     {
  //       content: 'Hello! How can I help you today?',
  //       role: 'assistant',
  //     },
  //     {
  //       content: 'I need help with my computer.',
  //       role: 'user',
  //     },
  //   ],
  //   model: model,
  //   system: 'You are a helpful chatbot.',
  // })

  // console.log("after starting streamtext. Result:", result)

  // for await (const textPart of result.textStream) {
  //   console.log('OLLAMA TEXT PART:', textPart)
  // }
  // return result

  // const messages = [
  //   {
  //     role: 'tool',
  //     content: 'why is the sky blue?',
  //   },
  // ]

  // console.log('OLLAMA RESULT', result.text)

  // TODO: Check out the server example for how to handle streaming responses
  // https://sdk.vercel.ai/examples/next-app/chat/stream-chat-completion#server
}
*/

export const getOpenAIModels = async () => {
  console.log('in openai get models')

  const { OpenAI } = require("openai");

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  console.log('created openai client')

  try {
    const response = await client.models.list();
    console.log('got valid response from openai model fetch')

    // Log the entire response for debugging
    console.log('Response:', response);

    // Check if the response has a data property
    if (!response.data) {
      throw new Error('Invalid response format');
    }

    // Iterate through the models
    const models = response.data;
     for(var i in models) {
      console.log(models[i]);
    };

    return models;
  } catch (error) {
    console.error('Error fetching models:', error);
  }
}
