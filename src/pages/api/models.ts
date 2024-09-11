import {
  AllLLMProviders,
  AllSupportedModels,
  AnthropicProvider,
  AzureProvider,
  LLMProvider,
  OllamaProvider,
  OpenAIProvider,
  ProviderNames,
  WebLLMProvider,
} from '~/types/LLMProvider'
import { getOllamaModels } from '~/utils/modelProviders/ollama'
import { getOpenAIModels } from '~/utils/modelProviders/openai'
import { getAzureModels } from '~/utils/modelProviders/azure'
import { getAnthropicModels } from '~/utils/modelProviders/anthropic'
import { webLLMModels } from '~/utils/modelProviders/WebLLM'
import { parseOpenaiKey } from '~/utils/crypto'
import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'

export const config = {
  runtime: 'edge',
}

const handler = async (
  req: NextRequest,
): Promise<NextResponse<AllLLMProviders | { error: string }>> => {
  try {
    const { projectName, openAIApiKey } = (await req.json()) as {
      projectName: string
      openAIApiKey?: string
    }

    if (!projectName) {
      return NextResponse.json(
        { error: 'Missing project name' },
        { status: 400 },
      )
    }

    // Fetch LLM providers from the API
    // TODO: work in progress.
    const llmProviders = (await kv.get(
      `${projectName}-llms`,
    )) as AllLLMProviders

    console.log('llmProviders in /models', llmProviders)
    console.log(
      '❌⭐️❌TODO: fix /models to grab Keys form DB, fetch available && enabled models.',
    )

    if (!llmProviders) {
      return NextResponse.json(
        { error: 'No LLM providers found for this project' },
        { status: 200 },
      )
    }

    // TODO: MOVE THESE TO DB INPUTS
    // const AzureProvider: LLMProvider = {
    //   provider: ProviderNames.Azure,
    //   enabled: true,
    //   // TODO: COME FROM DB/INPUT not env
    //   apiKey: process.env.TMP_AZURE_KEY,
    //   AzureDeployment: process.env.TMP_DEPLOYMENT,
    //   AzureEndpoint: process.env.TMP_ENDPOINT,
    // }

    // const AnthropicProvider: LLMProvider = {
    //   provider: ProviderNames.Anthropic,
    //   enabled: true,
    //   apiKey: process.env.TMP_ANTHROPIC_API_KEY, // this is the anthropic api key
    // }

    // const ollamaProvider: LLMProvider = {
    //   provider: ProviderNames.Ollama,
    //   enabled: true,
    //   baseUrl: process.env.OLLAMA_SERVER_URL,
    // }

    // const OpenAIProvider: LLMProvider = {
    //   provider: ProviderNames.OpenAI,
    //   enabled: true,
    //   apiKey: apiKey,
    // }

    // const WebLLMProvider: LLMProvider = {
    //   provider: ProviderNames.WebLLM,
    //   enabled: true,
    // }

    // const llmProviderKeys: LLMProvider[] = [
    //   ollamaProvider,
    //   OpenAIProvider,
    //   WebLLMProvider,
    //   AzureProvider,
    //   AnthropicProvider,
    // ]
    // END-TODO: MOVE THESE TO DB INPUTS

    const allLLMProviders: AllLLMProviders = {}

    for (const providerName of Object.values(ProviderNames)) {
      const llmProvider = llmProviders[providerName]

      console.log('llmProvider', llmProvider)
      console.log('providerName', providerName)
      if (!llmProvider || !llmProvider.enabled) {
        // Create a disabled provider entry
        ;(allLLMProviders[providerName] as LLMProvider) = {
          provider: ProviderNames[providerName],
          enabled: false,
          apiKey: undefined,
          models: [],
        }
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
          ;(llmProvider as WebLLMProvider).models = webLLMModels
          allLLMProviders[providerName] = llmProvider as WebLLMProvider
          break
        case ProviderNames.NCSAHosted:
          // TODO: Implement NCSAHosted provider handling
          break
        default:
          console.warn(`Unhandled provider: ${providerName}`)
      }
    }
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
