import { generateText, streamText } from 'ai'
import { createOllama } from 'ollama-ai-provider'
// import { openai } from '@ai-sdk/openai';
import { OpenAIModel, OpenAIModelID, OpenAIModels } from '@/types/openai'
import { decrypt, isEncrypted } from '~/utils/crypto'
import { LLMProvider, ProviderNames } from '~/types/LLMProvider'


export interface AnthropicModel {
    id: string
    model: string
    //parameterSize: string
    tokenLimit: number
}


import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: 'my_api_key', // defaults to process.env["ANTHROPIC_API_KEY"]
});

const msg = await anthropic.messages.create({
  model: "claude-3-5-sonnet-20240620",
  max_tokens: 1024,
  messages: [{ role: "user", content: "Hello, Claude" }],
});
console.log(msg);




const client = new Anthropic(); // gets API Key from environment variable ANTHROPIC_API_KEY

export const runAzureChat = async() =>{
  const stream = client.messages
    .stream({
      messages: [
        {
          role: 'user',
          content: `Hey Claude! How can I recursively list all files in a directory in Rust?`,
        },
      ],
      model: 'claude-3-opus-20240229',
      max_tokens: 1024,
    })
    // Once a content block is fully streamed, this event will fire
    .on('contentBlock', (content) => console.log('contentBlock', content))
    // Once a message is fully streamed, this event will fire
    .on('message', (message) => console.log('message', message));

  for await (const event of stream) {
    console.log('event', event);
  }

  const message = await stream.finalMessage();
  console.log('finalMessage', message);
}






