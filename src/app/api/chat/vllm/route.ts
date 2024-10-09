import { streamText } from 'ai'
import { NextResponse } from 'next/server'
import { createOpenAI } from '@ai-sdk/openai'
import {
  NCSAHostedVLLMProvider,
  ProviderNames,
} from '~/utils/modelProviders/LLMProvider'

// export const runtime = 'edge'

export async function POST(req: Request) {
  try {
    let { messages } = await req.json()

    const openai = createOpenAI({
      baseURL: process.env.NCSA_HOSTED_VLLM_BASE_URL,
      apiKey: 'non-empty',
      compatibility: 'compatible', // strict/compatible - enable 'strict' when using the OpenAI API
    })

    const result = await streamText({
      model: openai('meta-llama/Llama-3.2-11B-Vision-Instruct'),
      messages,
    })
    return result.toTextStreamResponse()
  } catch (error) {
    console.error('Error in POST request:', error)

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    } else {
      return NextResponse.json(
        { error: 'An unknown error occurred' },
        { status: 500 },
      )
    }
  }
}

export interface NCSAHostedVLLMModel {
  id: string
  name: string
  tokenLimit: number
  enabled: boolean
}

export enum NCSAHostedVLLMModelID {
  Llama_3_2_11B_Vision_Instruct = 'meta-llama/Llama-3.2-11B-Vision-Instruct',
}

export const NCSAHostedVLLMModels: Record<
  NCSAHostedVLLMModelID,
  NCSAHostedVLLMModel
> = {
  [NCSAHostedVLLMModelID.Llama_3_2_11B_Vision_Instruct]: {
    id: NCSAHostedVLLMModelID.Llama_3_2_11B_Vision_Instruct,
    name: 'Llama 3.2 11B Vision Instruct',
    tokenLimit: 128000,
    enabled: true,
  },
}

export const getNCSAHostedVLLMModels = async (
  vllmProvider: NCSAHostedVLLMProvider,
): Promise<NCSAHostedVLLMProvider> => {
  delete vllmProvider.error // Clear any previous errors
  vllmProvider.provider = ProviderNames.NCSAHostedVLLM
  try {
    // if (!vllmProvider.baseUrl || vllmProvider.baseUrl === '') {
    //   vllmProvider.error = `VLLM baseUrl is not defined, please set it to the URL that points to your VLLM instance.`
    //   return vllmProvider
    // }
    vllmProvider.baseUrl = process.env.NCSA_HOSTED_VLLM_BASE_URL

    const response = await fetch(`${vllmProvider.baseUrl}/models`, {
      // headers: {
      //   'Authorization': `Bearer non-empty`, // any non-empty string will work
      // },
    })

    if (!response.ok) {
      vllmProvider.error = `HTTP error ${response.status} ${response.statusText}.`
      vllmProvider.models = [] // clear any previous models.
      return vllmProvider as NCSAHostedVLLMProvider
    }

    const data = await response.json()
    const vllmModels: NCSAHostedVLLMModel[] = data.data.map((model: any) => {
      const knownModel = NCSAHostedVLLMModels[model.id as NCSAHostedVLLMModelID]
      return {
        id: model.id,
        name: knownModel ? knownModel.name : model.id,
        tokenLimit: model.max_tokens || 128000, // Default to 128000 if max_tokens is not provided
        enabled: true,
      }
    })

    vllmProvider.models = vllmModels
    console.log('VLLM Provider in GET', vllmProvider)
    return vllmProvider as NCSAHostedVLLMProvider
  } catch (error: any) {
    console.warn('Error fetching VLLM models:', error)
    vllmProvider.models = [] // clear any previous models.
    return vllmProvider as NCSAHostedVLLMProvider
  }
}
