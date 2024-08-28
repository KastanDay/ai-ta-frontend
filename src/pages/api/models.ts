import {
  AllLLMProviders,
  AllSupportedModels,
  LLMProvider,
  ProviderNames,
} from '~/types/LLMProvider'
import { getOllamaModels } from '~/utils/modelProviders/ollama'
import { getOpenAIModels } from '~/utils/modelProviders/openai'
import { getAzureModels } from '~/utils/modelProviders/azure'
import { getAnthropicModels } from '~/utils/modelProviders/anthropic'
import { webLLMModels } from '~/utils/modelProviders/WebLLM'
import { parseOpenaiKey } from '~/utils/crypto'
import { NextRequest, NextResponse } from 'next/server'

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

    let apiKey: string | undefined
    if (openAIApiKey) {
      apiKey = await parseOpenaiKey(openAIApiKey)
    }

    // TODO: MOVE THESE TO DB INPUTS
    const AzureProvider: LLMProvider = {
      provider: ProviderNames.Azure,
      enabled: true,
      // TODO: COME FROM DB/INPUT not env
      apiKey: process.env.TMP_AZURE_KEY,
      AzureDeployment: process.env.TMP_DEPLOYMENT,
      AzureEndpoint: process.env.TMP_ENDPOINT,
    }

    const AnthropicProvider: LLMProvider = {
      provider: ProviderNames.Anthropic,
      enabled: true,
      apiKey: process.env.TMP_ANTHROPIC_API_KEY, // this is the anthropic api key
    }
    console.log('AnthropicProvider', AnthropicProvider)

    const ollamaProvider: LLMProvider = {
      provider: ProviderNames.Ollama,
      enabled: true,
      baseUrl: process.env.OLLAMA_SERVER_URL,
    }

    const OpenAIProvider: LLMProvider = {
      provider: ProviderNames.OpenAI,
      enabled: true,
      apiKey: apiKey,
    }

    const WebLLMProvider: LLMProvider = {
      provider: ProviderNames.WebLLM,
      enabled: true,
    }

    const llmProviderKeys: LLMProvider[] = [
      ollamaProvider,
      OpenAIProvider,
      WebLLMProvider,
      AzureProvider,
      AnthropicProvider,
    ]
    // END-TODO: MOVE THESE TO DB INPUTS

    const allLLMProviders: { [key in ProviderNames]?: LLMProvider } = {}
    for (const llmProvider of llmProviderKeys) {
      if (!llmProvider.enabled) {
        continue
      }
      if (llmProvider.provider == ProviderNames.Ollama) {
        allLLMProviders[llmProvider.provider] =
          await getOllamaModels(llmProvider)
      } else if (llmProvider.provider == ProviderNames.OpenAI) {
        allLLMProviders[llmProvider.provider] = await getOpenAIModels(
          llmProvider,
          projectName,
        )
      } else if (llmProvider.provider == ProviderNames.Azure) {
        allLLMProviders[llmProvider.provider] =
          await getAzureModels(llmProvider)
      } else if (llmProvider.provider == ProviderNames.Anthropic) {
        allLLMProviders[llmProvider.provider] =
          await getAnthropicModels(llmProvider)
      } else if (llmProvider.provider == ProviderNames.WebLLM) {
        llmProvider.models = webLLMModels
        allLLMProviders[llmProvider.provider] = llmProvider
      } else {
        continue
      }
    }

    return NextResponse.json(allLLMProviders as AllLLMProviders, {
      status: 200,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: JSON.stringify(error) }, { status: 500 })
  }
}

export default handler
