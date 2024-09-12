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
import { getOpenAIModels } from '~/utils/modelProviders/openai'
import { getAzureModels } from '~/utils/modelProviders/azure'
import { getAnthropicModels } from '~/utils/modelProviders/anthropic'
import { getWebLLMModels, webLLMModels } from '~/utils/modelProviders/WebLLM'
import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'
import { getNCSAHostedModels } from '~/utils/modelProviders/NCSAHosted'
import { migrateAllKeys } from './UIUC-api/MIGRATEALLKEYS'

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

    // Fetch the project's API keys
    let llmProviders = (await kv.get(`${projectName}-llms`)) as AllLLMProviders

    console.log('llmProviders in /models', llmProviders)

    if (!llmProviders) {
      llmProviders = {}
    }

    const allLLMProviders: AllLLMProviders = {}

    // Iterate through all possible providers
    for (const providerName of Object.values(ProviderNames)) {
      let llmProvider = llmProviders[providerName]

      console.log('llmProvider', llmProvider)
      console.log('providerName', providerName)
      if (!llmProvider) {
        // Create a disabled provider entry
        llmProvider = {
          provider: ProviderNames[providerName],
          enabled: false,
          apiKey: undefined,
          models: [],
        } as LLMProvider
        console.log(
          'Created disabled provider entry',
          allLLMProviders[providerName],
        )
      }

      // TODO: update how undefined values are handled... inside each provider or out here?

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
