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
} from '~/types/LLMProvider'
import { getOllamaModels } from '~/utils/modelProviders/ollama'
import { getAzureModels } from '~/utils/modelProviders/azure'
import { getAnthropicModels } from '~/utils/modelProviders/anthropic'
import { getWebLLMModels, webLLMModels } from '~/utils/modelProviders/WebLLM'
import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'
import { getNCSAHostedModels } from '~/utils/modelProviders/NCSAHosted'
import { migrateAllKeys } from './UIUC-api/MIGRATEALLKEYS'
import { getOpenAIModels } from '~/app/api/chat/openAI/route'

export const config = {
  runtime: 'edge',
}

const handler = async (
  req: NextRequest,
): Promise<NextResponse<AllLLMProviders | { error: string }>> => {
  try {
    const { projectName, hideApiKeys } = (await req.json()) as {
      projectName: string
      hideApiKeys?: boolean
    }

    if (!projectName) {
      return NextResponse.json(
        { error: 'Missing project name' },
        { status: 400 },
      )
    }

    // Fetch the project's API keys, filtering out all keys if requested
    let llmProviders = (await kv.get(`${projectName}-llms`)) as AllLLMProviders

    if (!llmProviders) {
      llmProviders = {}
    }

    const allLLMProviders: AllLLMProviders = {}

    // Iterate through all possible providers
    for (const providerName of Object.values(ProviderNames)) {
      let llmProvider = llmProviders[providerName]

      if (!llmProvider) {
        // Create a disabled provider entry
        llmProvider = {
          provider: ProviderNames[providerName],
          enabled: false,
          apiKey: undefined,
          models: [],
        } as LLMProvider
      }

      switch (providerName) {
        case ProviderNames.Ollama:
          allLLMProviders[providerName] = await getOllamaModels(
            llmProvider as OllamaProvider,
          )
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

    // Don't show any API keys.
    if (hideApiKeys) {
      let cleanedLLMProviders = { ...allLLMProviders }
      cleanedLLMProviders = Object.fromEntries(
        Object.entries(allLLMProviders).map(([key, value]) => [
          key,
          {
            ...value,
            apiKey:
              value.apiKey && value.apiKey !== ''
                ? 'this key is defined, but hidden'
                : undefined,
          },
        ]),
      )
      delete cleanedLLMProviders.NCSAHosted?.baseUrl
      return NextResponse.json(cleanedLLMProviders as AllLLMProviders, {
        status: 200,
      })
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
