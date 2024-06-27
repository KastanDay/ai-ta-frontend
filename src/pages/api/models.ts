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
import { CreateMLCEngine } from "@mlc-ai/web-llm";
import { MLCEngine } from "@mlc-ai/web-llm";


async function initializeEngine() {
  const initProgressCallback = (initProgress: any) => {
    console.log(initProgress);
    // Update a loading indicator with the progress
  }
  const selectedModel = "Llama-3-8B-Instruct-q4f32_1-MLC";

  let engine;
  try {
    engine = await CreateMLCEngine(
      selectedModel,
      {
        initProgressCallback: initProgressCallback,
        // logLevel: "INFO", // specify the log level
      },
      // customize kv cache, use either context_window_size or sliding_window_size (with attention sink)
      // {
      // context_window_size: 2048,
      // sliding_window_size: 1024,
      // attention_sink_size: 4,
      // },
    );
  } catch (error) {
    console.error('Error initializing engine:', error);
    // Handle the error appropriately in your application
  }

  return engine;
}

// Use the function

const handler = async (req: Request): Promise<Response> => {
  let apiKey = ''
  let apiType = OPENAI_API_TYPE
  let endpoint = OPENAI_API_HOST
  try {
    // const messages = [
    //   { role: "system", content: "You are a helpful AI assistant." },
    //   { role: "user", content: "list some city names" },
    // ]
    const engine = await initializeEngine();

    const reply = await engine!.chat.completions.create({
      messages: [
        { role: "system", content: "You are a helpful AI assistant." },
        { role: "user", content: "list some city names" },
      ],
    });
    if (reply.choices && reply.choices[0]) {
      console.log(reply.choices[0].message);
      console.log(reply.usage);
    } else {
      console.log('No choices available');
    }

    const { key } = (await req.json()) as {
      key: string
    }
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
