import OpenAI from 'openai'
import { OpenAIStream, StreamingTextResponse } from 'ai'
import { NextResponse } from 'next/server'
import { decrypt, parseOpenaiKey } from '~/utils/crypto'
import { CourseMetadata } from '~/types/courseMetadata'
import { kv } from '@vercel/kv'
import { OpenAIProvider, ProviderNames } from '~/types/LLMProvider'
import { OpenAIModelID, OpenAIModels } from '~/utils/modelProviders/openai'

export const runtime = 'edge'

export async function POST(req: Request) {
  try {
    // let { messages, apiKey } = await req.json()
    // console.log('headers', req.headers);
    // const headers = {
    //   'Content-type': 'application/json;charset=UTF-8',
    //   'Authorization': `Bearer ${apiKey}`,
    // }
    // const openai = new OpenAI({
    //   apiKey: apiKey,
    //   headers: headers,
    // })

    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      })
    }
    let apiKey = authHeader.substring(7)
    const { messages } = await req.json()

    if (!apiKey || apiKey == 'undefined') {
      apiKey = process.env.VLADS_OPENAI_KEY as string
    }
    if (!apiKey.startsWith('sk')) {
      apiKey = (await decrypt(
        apiKey,
        process.env.NEXT_PUBLIC_SIGNING_KEY as string,
      )) as string
      console.log('apikey', apiKey)
    }

    const openai = new OpenAI({
      apiKey,
    })
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      stream: true,
      messages,
    })

    const stream = OpenAIStream(response)

    return new StreamingTextResponse(stream)
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      const { name, status, headers, message } = error
      return NextResponse.json({ name, status, headers, message }, { status })
    } else {
      throw error
    }
  }
}

export const getOpenAIModels = async (
  openAIProvider: OpenAIProvider,
  projectName: string,
): Promise<OpenAIProvider> => {
  try {
    delete openAIProvider.error // Remove the error property if it exists
    openAIProvider.provider = ProviderNames.OpenAI
    // Priority #1: use passed in key
    // Priority #2: use the key from the course metadata
    const { disabledModels, openaiAPIKey } = await getDisabledOpenAIModels({
      projectName,
    })

    if (!openAIProvider.apiKey) {
      // TODO: check this doesn't leak keys to client side on /chat page
      openAIProvider.apiKey = openaiAPIKey
    }

    if (!openAIProvider.apiKey || openAIProvider.apiKey === undefined) {
      openAIProvider.error = 'OpenAI API Key is not set.'
      openAIProvider.models = [] // clear any previous models.
      return openAIProvider
    }

    const client = new OpenAI({
      apiKey: openAIProvider.apiKey,
    })

    const response = await client.models.list()

    if (!response.data) {
      openAIProvider.error = `Error fetching models from OpenAI, unexpected response format. Response: ${response}`
    }

    // Iterate through the models
    const openAIModels = response.data
      .filter((model: any) => Object.values(OpenAIModelID).includes(model.id))
      .map((model: any) => {
        return {
          id: model.id,
          name: OpenAIModels[model.id as OpenAIModelID].name,
          tokenLimit: OpenAIModels[model.id as OpenAIModelID].tokenLimit,
          enabled: !disabledModels.includes(model.id),
        }
      })

    openAIProvider.models = openAIModels
    return openAIProvider
  } catch (error: any) {
    console.warn('Error fetching OpenAImodels:', error)
    openAIProvider.error = error.message
    openAIProvider.models = [] // clear any previous models.
    return openAIProvider
  }
}

type DisabledOpenAIModels = {
  disabledModels: string[]
  openaiAPIKey: string | undefined
}

const getDisabledOpenAIModels = async ({
  projectName,
}: {
  projectName: string
}): Promise<DisabledOpenAIModels> => {
  /* 
  returns just the model IDs.
  */

  const course_metadata = (await kv.hget(
    'course_metadatas',
    projectName,
  )) as CourseMetadata

  let apiKey: string | undefined = undefined
  if (course_metadata.openai_api_key) {
    apiKey = await parseOpenaiKey(course_metadata.openai_api_key)
  }

  if (course_metadata && course_metadata.disabled_models) {
    // returns just the model IDs
    return {
      disabledModels: course_metadata.disabled_models,
      openaiAPIKey: apiKey,
    }
  } else {
    // All models are enabled
    return { disabledModels: [], openaiAPIKey: apiKey }
  }
}
