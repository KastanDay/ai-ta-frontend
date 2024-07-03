// task is to iterate through the models and find available models that can run on ollama
import {
    OPENAI_API_HOST,
    OPENAI_API_TYPE,
    OPENAI_API_VERSION,
    OPENAI_ORGANIZATION,
} from '@/utils/app/const'

import { OpenAIModel, OpenAIModelID, OpenAIModels } from '@/types/openai'
import { decrypt, isEncrypted } from '~/utils/crypto'
import { LLMProvider, ProviderNames } from '~/types/LLMProvider'
import { getOllamaModels, runOllamaChat } from '~/utils/modelProviders/ollama'
//import { VercelAISDK } from 'vercel-ai-sdk'

import { openai } from '@ai-sdk/openai';
export const config = {
    runtime: 'edge',
}

export interface AzureModel {
    id: string
    name: string
    tokenLimit: number
}
import { CoreMessage, streamText } from 'ai';


// active model will be passed in form front-end just hard-code for now
// just make it a standard funciton for testing without post

//export async function POST(req: Request) {
export async function runAzure(messages, AzureProvider, activeModel) {
  //const { messages, AzureProvider, activeModel }: { messages: CoreMessage[], AzureProvider: LLMProvider, activeModel: string } = await req.json();

  const result = await streamText({
    model: openai(activeModel), // replace with active model
    system: 'You are a helpful assistant.',
    messages,
  });

  return result.toAIStreamResponse();
}


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



export const getAzureModels = async (AzureProvider: LLMProvider): Promise<AzureModel[]> => {
  
   // Ensure this is set in your environment

  if (!AzureProvider.AzureEndpoint || !AzureProvider.AzureDeployment) {
    throw new Error('Azure OpenAI endpoint or API version is not set in environment variables');
  }

  const url = `${AzureProvider.AzureEndpoint}/openai/deployments?api-version=2024-02-01}`;

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'api-key': '811d00e8396d417ba63175e6c4297d77',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();

  const azureModels: AzureModel[] = data.value.map((model: any) => {
    return {
      id: model.id,
      name: model.properties.model,
      tokenLimit: model.properties.maxTokens,
      // Add any other relevant fields here
    } as AzureModel;
  });
  console.log('Azure OpenAI models:', azureModels);

  return azureModels;
};



