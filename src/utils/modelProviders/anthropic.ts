import { generateText, streamText } from 'ai'
import { createOllama } from 'ollama-ai-provider'
// import { openai } from '@ai-sdk/openai';
import { OpenAIModel, OpenAIModelID, OpenAIModels } from '@/types/openai'
import { decrypt, isEncrypted } from '~/utils/crypto'
import { LLMProvider, ProviderNames } from '~/types/LLMProvider'
import Anthropic from '@anthropic-ai/sdk';
import { API_KEY } from '@clerk/nextjs/dist/types/server'

// anthropic model interface for dispay
export interface AnthropicModel {
    id: string
    name: string
    tokenLimit: number
}
// gave the id's for each anthropic model available
export enum AnthropicModelID {
    Claude_3_5_Sonnet = 'claude-3-5-sonnet-20240620', // rolling model 
    Claude_3_Opus = 'claude-3-opus-20240229', // rolling model 
    Claude_3_Sonnet = 'claude-3-sonnet-20240229', // rolling model 
    Claude_3_Haiku = 'claude-3-haiku-20240307', // rolling model 
}

// hardcoded anthropic models 
export const AnthropicModels: Record<AnthropicModelID, AnthropicModel> = {
    [AnthropicModelID.Claude_3_5_Sonnet]: {
      id: AnthropicModelID.Claude_3_5_Sonnet,
      name: 'claude-3-5-sonnet',
      tokenLimit: 200000,
    },
    [AnthropicModelID.Claude_3_Opus]: {
      id: AnthropicModelID.Claude_3_Opus,
      name: 'claude-3-opus',
      tokenLimit: 200000,
    },
    [AnthropicModelID.Claude_3_Sonnet]: {
      id: AnthropicModelID.Claude_3_Sonnet,
      name: 'claude-3-sonnet',
      tokenLimit: 200000,
    },
    [AnthropicModelID.Claude_3_Haiku]: {
      id: AnthropicModelID.Claude_3_Haiku,
      name: 'claude-3-haiku',
      tokenLimit: 200000,
    }
}

// gettign all model attributes for display
export const getAnthropicModels = async (AnthropicProvider: LLMProvider): Promise<AnthropicModel[]>=> {
    const AnthropicList: AnthropicModel[] = Object.values(AnthropicModels);
    return AnthropicList;
    
}



export const runAnthropicChat = async (AnthropicProvider: LLMProvider) =>{
  const client = new Anthropic({apiKey: AnthropicProvider.apiKey!}); // gets API Key from environment variable ANTHROPIC_API_KEY     
  const stream = client.messages
    .stream({
      messages: [
        {
          role: 'user',
          content: `Hey Claude! How can I recursively list all files in a directory in Rust?`,
        },
      ],
      model: AnthropicProvider.AnthropicModel!,
      max_tokens: 1024,
    })
    // Once a content block is fully streamed, this event will fire
    //.on('contentBlock', (content) => console.log('contentBlock', content))
    // Once a message is fully streamed, this event will fire
    //.on('message', (message) => console.log('message', message));

  for await (const event of stream) {
    //console.log('event', event);
  }

  const message = await stream.finalMessage();
  console.log('finalMessage', message);
}






