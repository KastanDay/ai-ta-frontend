// task is to iterate through the models and find available models that can run on ollama
import {
  OPENAI_API_HOST,
  OPENAI_API_TYPE,
  OPENAI_API_VERSION,
  OPENAI_ORGANIZATION,
} from '@/utils/app/const'

import { OpenAIModel, OpenAIModelID, OpenAIModels } from '@/types/openai'
import { decrypt, isEncrypted } from '~/utils/crypto'
import { LLMProvider, ProviderNames, SupportedModels } from '~/types/LLMProvider'
import { getOllamaModels, runOllamaChat } from '~/utils/modelProviders/ollama'
import { getOpenAIModels } from '~/utils/modelProviders/openai'
import { getAzureModels } from '~/utils/modelProviders/azure'

import { WebllmModel } from '~/utils/modelProviders/WebLLM'
import { ModelRecord, prebuiltAppConfig } from '~/utils/modelProviders/ConfigWebLLM'
import { OllamaModel } from '~/utils/modelProviders/ollama'
import { CreateMLCEngine } from "@mlc-ai/web-llm";

export const config = {
  runtime: 'edge',
}
export function convertToLocalModels(record: ModelRecord): WebllmModel {
  return {
    id: record.model_id,
    name: record.model_id,
    parameterSize: 'Unknown',
    tokenLimit: record.overrides?.context_window_size,
    downloadSize: record.vram_required_MB ? `${(record.vram_required_MB / 1024).toFixed(2)}GB` : 'unknown',
    // isDownloaded: false
  };
}
export const webLLMModels: WebllmModel[] = prebuiltAppConfig.model_list.map((model: ModelRecord) => convertToLocalModels(model));
export let ollamaModels: OllamaModel[] = []

const handler = async (req: Request): Promise<Response> => {
  console.log('in handler')
  let apiKey = ''
  let apiType = OPENAI_API_TYPE
  let endpoint = OPENAI_API_HOST
  console.log('this is what reuest is', req)
  try {
    const { key } = (await req.json()) as {
      key: string

    }
    console.log('key', key)

    // Eventually we'll use this. For now, there's no API Key for Ollama
    const ollamaProvider: LLMProvider = {
      provider: ProviderNames.Ollama,
      enabled: true,
      baseUrl: 'https://ollama.ncsa.ai/api/tags',
    }

    const OpenAIProvider: LLMProvider = {
      provider: ProviderNames.OpenAI,
      enabled: true,
      apiKey: process.env.OPENAI_API_KEY,
      baseUrl: 'https://ollama.ncsa.ai/api/tags',

    }
    // next task is to add the proper providers to azure then from there
    // add streaming to azure
    const AzureProvider: LLMProvider = {
      provider: ProviderNames.Azure,
      enabled: true,
      apiKey: apiKey,

      // AzureKey: 'b1a402d721154a97a4eeaa61200eb93f',

      AzureDeployment: 'gpt-35-turbo-16k',


      //baseUrl: '',
      //models?: SupportedModels
      //endpoint, deployment, and api key
      AzureEndpoint: 'https://uiuc-chat-canada-east.openai.azure.com/'

    }

    const llmProviderKeys: LLMProvider[] = [ollamaProvider, OpenAIProvider]
    // I need input providers for all the models and then return of the list from each provider 
    // this is to print the mdoel type for all providers in provider keys just general test
    let totalModels: SupportedModels[] = []
    // let ollamaModels: OllamaModel[] = []
    for (const provider of llmProviderKeys) {
      if (provider.provider == 'Ollama') {
        // 1. Call An endpoint to check what Ollama models are available.
        //console.log('entering ollama')
        const fetchedOllamaModels = await getOllamaModels(ollamaProvider)
        ollamaModels = fetchedOllamaModels // Update the exported variable
        totalModels.push(ollamaModels)
        //console.log('Ollama Models in models.ts: ', ollamaModels)


      }
      else if (provider.provider == 'OpenAI') {
        //2. call an endpoint to check which openai modle available
        //console.log('check if it got out of ollama fetch to openai')
        const openAIModels = await getOpenAIModels(OpenAIProvider)
        totalModels.push(openAIModels)
        //console.log('OpenAi models.ts: ', openAIModels)
      }
      else {
        continue
      }

    }

    console.log('total models available', totalModels)
    console.log('ollama models', ollamaModels)

    //3. call endpoint for azure 
    //console.log('check if azure models fetch')
    //const azureOpenaiModels = await getAzureModels(AzureProvider)

    // Test chat function
    // const ret = await runOllamaChat()
    // console.log('Ollama chat test: ', ret)

    // Iterate over the providers, check if their key works. Return all available models...
    // each model provider should have at least `/chat` and `/models` endpoints

    apiKey = key ? key : (process.env.OPENAI_API_KEY as string)
    // Check if the key starts with 'sk-' (indicating it's not encrypted)
    if (key && isEncrypted(key)) {
      // Decrypt the key
      const decryptedText = await decrypt(
        key,
        process.env.NEXT_PUBLIC_SIGNING_KEY as string,
      )
      apiKey = decryptedText as string
      // console.log('models.ts Decrypted api key: ', apiKey)
    }
    // console.log('models.ts Final openai key: ', apiKey)

    if (apiKey && !apiKey.startsWith('sk-')) {
      // console.log('setting azure variables')
      // have to figure out what tyeps of keys fit with the users api key and see which ones are available is enabled flag.
      // add in new stuff here to get beginning of new providers to check start name of each model
      apiType = 'azure'
      endpoint = process.env.AZURE_OPENAI_ENDPOINT || OPENAI_API_HOST
    }

    if (!apiKey) {
      return new Response('Warning: OpenAI Key was not found', { status: 400 })
    }

    let url = `${endpoint}/v1/models`
    if (apiType === 'azure') {
      url = `${endpoint}/openai/deployments?api-version=${OPENAI_API_VERSION}`
    }

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(apiType === 'openai' && {
          Authorization: `Bearer ${apiKey}`,
        }),
        ...(apiType === 'azure' && {
          'api-key': `${apiKey}`,
        }),
        ...(apiType === 'openai' &&
          OPENAI_ORGANIZATION && {
          'OpenAI-Organization': OPENAI_ORGANIZATION,
        }),
      },
    })

    if (response.status === 401) {
      return new Response(response.body, {
        status: 500,
        headers: response.headers,
      })
    } else if (response.status !== 200) {
      console.error(
        `OpenAI API returned an error ${response.status
        }: ${await response.text()}`,
      )
      throw new Error('OpenAI API returned an error')
    }

    const json = await response.json()

    const uniqueModels: string[] = Array.from(
      new Set(json.data.map((model: any) => model.id)),
    )

    const models: OpenAIModel[] = uniqueModels
      .map((modelId: string) => {
        const model = json.data.find((m: any) => m.id === modelId)
        if (!model) return undefined

        for (const [key, value] of Object.entries(OpenAIModelID)) {
          if (value === model.id) {
            return {
              id: model.id,
              name: OpenAIModels[value].name,
              tokenLimit: OpenAIModels[value].tokenLimit,
            }
          }
        }
        return undefined
      })
      .filter((model): model is OpenAIModel => model !== undefined)

    const finalModels = [
      ...models,
      ...ollamaModels,
      ...webLLMModels,
    ]
    console.log('Final combined model list:', finalModels)

    return new Response(JSON.stringify(finalModels), { status: 200 })
  } catch (error) {
    console.error(error)
    return new Response('Error', { status: 500 })
  }
}

export default handler
