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

import { WebLLMModels, WebllmModel } from '~/utils/modelProviders/WebLLM'
export const config = {
  runtime: 'edge',
}
// is this what gives me the json object lwt me print to find out
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
      apiKey:process.env.OPENAI_API_KEY,
      baseUrl: 'https://ollama.ncsa.ai/api/tags',

    }
    // next task is to add the proper providers to azure then from there
    // add streaming to azure
    const AzureProvider: LLMProvider = {
      provider: ProviderNames.Azure,
      enabled: true,
      apiKey: apiKey,

      AzureKey =b1a402d721154a97a4eeaa61200eb93f,
      
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
    for(const provider of llmProviderKeys) {
      if(provider.provider == 'Ollama') {
        // 1. Call An endpoint to check what Ollama models are available.
        //console.log('entering ollama')
        const ollamaModels = await getOllamaModels(ollamaProvider)
        totalModels.push(ollamaModels)
        //console.log('Ollama Models in models.ts: ', ollamaModels)


      } 
      else if(provider.provider == 'OpenAI') {
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

    //3. call endpoint for azure 
    //console.log('check if azure models fetch')
    //const azureOpenaiModels = await getAzureModels(AzureProvider)

    // Test chat function
    const ret = await runOllamaChat()
    console.log('Ollama chat test: ', ret)

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
    console.log('models.ts Final openai key: ', apiKey)
    // this is my attempt at simplifying what is belowby creating if statements for each model type
  
    return new Response(JSON.stringify(totalModels), { status: 200 })
  } catch (error) {
    console.error(error)
    return new Response('Error', { status: 500 })
  }
}

export default handler
