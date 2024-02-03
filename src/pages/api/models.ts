import {
  OPENAI_API_HOST,
  OPENAI_API_TYPE,
  OPENAI_API_VERSION,
  OPENAI_ORGANIZATION,
} from '@/utils/app/const'

import { OpenAIModel, OpenAIModelID, OpenAIModels } from '@/types/openai'
import { decrypt, isEncrypted } from '~/utils/crypto'

export const config = {
  runtime: 'edge',
}

const handler = async (req: Request): Promise<Response> => {
  let apiKey = ''
  let apiType = OPENAI_API_TYPE
  let endpoint = OPENAI_API_HOST
  try {
    const { key } = (await req.json()) as {
      key: string
    }
    apiKey = key ? key : (process.env.OPENAI_API_KEY as string)
    console.log('Validating apikey:', apiKey)
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
        `OpenAI API returned an error ${
          response.status
        }: ${await response.text()}`,
      )
      throw new Error('OpenAI API returned an error')
    }

    const json = await response.json()

    const uniqueModels: string[] = Array.from(
      new Set(json.data.map((model: any) => model.id)),
    )

    // console.log('Unique models: ', uniqueModels)

    const models: OpenAIModel[] = uniqueModels
      .map((modelId: string) => {
        const model = json.data.find((m: any) => m.id === modelId)
        if (!model) return undefined

        for (const [key, value] of Object.entries(OpenAIModelID)) {
          if (value === model.id) {
            return {
              id: model.id,
              name: OpenAIModels[value].name,
              maxLength: OpenAIModels[value].maxLength,
              tokenLimit: OpenAIModels[value].tokenLimit,
            }
          }
        }
        return undefined
      })
      .filter((model): model is OpenAIModel => model !== undefined)

    // console.log('Final list of Models: ', models)

    return new Response(JSON.stringify(models), { status: 200 })
  } catch (error) {
    console.error(error)
    return new Response('Error', { status: 500 })
  }
}

export default handler
