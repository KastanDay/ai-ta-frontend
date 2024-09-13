import { AnthropicProvider } from '~/types/LLMProvider'
import Anthropic from '@anthropic-ai/sdk'

export interface AnthropicModel {
  id: string
  name: string
  tokenLimit: number
  enabled: boolean
}

export enum AnthropicModelID {
  Claude_3_5_Sonnet = 'claude-3-5-sonnet-20240620',
  Claude_3_Opus = 'claude-3-opus-20240229',
  // Claude_3_Sonnet = 'claude-3-sonnet-20240229',
  Claude_3_Haiku = 'claude-3-haiku-20240307',
}

// hardcoded anthropic models
export const AnthropicModels: Record<AnthropicModelID, AnthropicModel> = {
  [AnthropicModelID.Claude_3_5_Sonnet]: {
    id: AnthropicModelID.Claude_3_5_Sonnet,
    name: 'Claude 3.5 Sonnet',
    tokenLimit: 200000,
    enabled: true,
  },
  [AnthropicModelID.Claude_3_Opus]: {
    id: AnthropicModelID.Claude_3_Opus,
    name: 'Claude 3 opus',
    tokenLimit: 200000,
    enabled: true,
  },
  // [AnthropicModelID.Claude_3_Sonnet]: {
  //   id: AnthropicModelID.Claude_3_Sonnet,
  //   name: 'Claude 3 sonnet',
  //   tokenLimit: 200000,
  //   enabled: false,
  // },
  [AnthropicModelID.Claude_3_Haiku]: {
    id: AnthropicModelID.Claude_3_Haiku,
    name: 'Claude 3 Haiku',
    tokenLimit: 200000,
    enabled: true,
  },
}

export const getAnthropicModels = async (
  anthropicProvider: AnthropicProvider,
): Promise<AnthropicProvider> => {
  if (!anthropicProvider.apiKey) {
    anthropicProvider.error = 'Anthropic API key not set.'
    anthropicProvider.models = []
    return anthropicProvider
  }
  anthropicProvider.models = Object.values(AnthropicModels) as AnthropicModel[]
  delete anthropicProvider.error // Clear any previous errors
  return anthropicProvider
}

export const runAnthropicChat = async (
  anthropicProvider: AnthropicProvider,
) => {
  const client = new Anthropic({ apiKey: anthropicProvider.apiKey! }) // gets API Key from environment variable ANTHROPIC_API_KEY
  const stream = client.messages.stream({
    messages: [
      {
        role: 'user',
        content: `Hey Claude! How can I recursively list all files in a directory in Rust?`,
      },
    ],
    model: anthropicProvider.models![0]!.id, // hard-coded for now.
    max_tokens: 4096, // output tokens. Might increase to 8192 soon. https://docs.anthropic.com/en/docs/about-claude/models
  })

  const message = await stream.finalMessage()
  console.log('finalMessage', message)
}
