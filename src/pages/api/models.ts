import {
  AllLLMProviders,
  AnthropicProvider,
  AzureProvider,
  LLMProvider,
  NCSAHostedProvider,
  OllamaProvider,
  OpenAIProvider,
  ProviderNames,
  WebLLMProvider,
} from '~/utils/modelProviders/LLMProvider'
import { getOllamaModels } from '~/utils/modelProviders/ollama'
import { getAzureModels } from '~/utils/modelProviders/azure'
import { getAnthropicModels } from '~/utils/modelProviders/routes/anthropic'
import { getWebLLMModels } from '~/utils/modelProviders/WebLLM'
import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'
import { getNCSAHostedModels } from '~/utils/modelProviders/NCSAHosted'
// import { migrateAllKeys } from './UIUC-api/MIGRATEALLKEYS'
import { getOpenAIModels } from '~/utils/modelProviders/routes/openai'
import { decryptKeyIfNeeded } from '~/utils/crypto'

export const config = {
  runtime: 'edge',
}

const handler = async (
  req: NextRequest,
): Promise<NextResponse<AllLLMProviders | { error: string }>> => {
  try {
    const { projectName } = (await req.json()) as {
      projectName: string
    }

    if (!projectName) {
      return NextResponse.json(
        { error: 'Missing project name' },
        { status: 400 },
      )
    }

    // Fetch the project's API keys, filtering out all keys if requested
    let llmProviders = (await kv.get(`${projectName}-llms`)) as AllLLMProviders

    console.log('INITIAL -- llmProviders', llmProviders)

    if (!llmProviders) {
      // Initialize providers if they don't exist
      llmProviders = {
        [ProviderNames.Ollama]: {
          provider: ProviderNames.Ollama,
          enabled: false,
          models: [],
        },
        [ProviderNames.OpenAI]: {
          provider: ProviderNames.OpenAI,
          enabled: false,
          models: [],
        },
        [ProviderNames.Azure]: {
          provider: ProviderNames.Azure,
          enabled: false,
          models: [],
        },
        [ProviderNames.Anthropic]: {
          provider: ProviderNames.Anthropic,
          enabled: false,
          models: [],
        },
        [ProviderNames.WebLLM]: {
          provider: ProviderNames.WebLLM,
          enabled: true,
          models: [],
        },
        [ProviderNames.NCSAHosted]: {
          provider: ProviderNames.NCSAHosted,
          enabled: true,
          models: [],
        },
      } as AllLLMProviders
    } else {
      // Decrypt API keys
      const processProviders = async () => {
        for (const providerName in llmProviders) {
          if (providerName == 'defaultModel' || providerName == 'defaultTemp') {
            continue
          }
          const typedProviderName = providerName as keyof AllLLMProviders
          const provider = llmProviders[typedProviderName]
          console.log('LOOP -- provider', provider)
          if (
            provider &&
            'apiKey' in provider &&
            provider.apiKey !== 'this key is defined, but hidden'
          ) {
            llmProviders[typedProviderName] = {
              ...provider,
              apiKey:
                (await decryptKeyIfNeeded(provider.apiKey!)) ?? provider.apiKey,
            } as LLMProvider & { provider: typeof typedProviderName }
          }
        }
      }
      await processProviders()
    }

    const allLLMProviders: Partial<AllLLMProviders> = {}

    // Iterate through all possible providers
    for (const providerName of Object.values(ProviderNames)) {
      const llmProvider = llmProviders[providerName]

      switch (providerName) {
        case ProviderNames.Ollama:
          allLLMProviders[providerName] = (await getOllamaModels(
            llmProvider as OllamaProvider,
          )) as OllamaProvider
          break
        case ProviderNames.OpenAI:
          allLLMProviders[providerName] = await getOpenAIModels(
            llmProvider as OpenAIProvider,
            projectName,
          )
          break
        case ProviderNames.Azure:
          allLLMProviders[providerName] = await getAzureModels(
            llmProvider as AzureProvider,
          )
          break
        case ProviderNames.Anthropic:
          allLLMProviders[providerName] = await getAnthropicModels(
            llmProvider as AnthropicProvider,
          )
          break
        case ProviderNames.WebLLM:
          allLLMProviders[providerName] = await getWebLLMModels(
            llmProvider as WebLLMProvider,
          )
          break
        case ProviderNames.NCSAHosted:
          allLLMProviders[providerName] = await getNCSAHostedModels(
            llmProvider as NCSAHostedProvider,
          )
          break
        default:
          console.warn(`Unhandled provider: ${providerName}`)
      }
    }

    // Call MIGRATEALLKEYS.ts
    // try {
    //   const migrateResult = await migrateAllKeys()
    //   console.log('MIGRATEALLKEYS result:', migrateResult);
    // } catch (error) {
    //   console.error('Error calling MIGRATEALLKEYS:', error);
    // }

    console.log('FINAL -- allLLMProviders', allLLMProviders)
    return NextResponse.json(allLLMProviders as AllLLMProviders, {
      status: 200,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: JSON.stringify(error) }, { status: 500 })
  }
}

export default handler
