// src/pages/api/chat.ts
import { DEFAULT_SYSTEM_PROMPT, DEFAULT_TEMPERATURE } from '@/utils/app/const'
import { OpenAIError, OpenAIStream } from '@/utils/server'
import { ChatBody, ContextWithMetadata, OpenAIChatMessage } from '@/types/chat'
// @ts-expect-error - no types
import wasm from '../../../node_modules/@dqbd/tiktoken/lite/tiktoken_bg.wasm?module'
import tiktokenModel from '@dqbd/tiktoken/encoders/cl100k_base.json'
import { Tiktoken, init } from '@dqbd/tiktoken/lite/init'
import { getExtremePrompt } from './getExtremePrompt'
import { getStuffedPrompt } from './contextStuffingHelper'
import { OpenAIModelID, OpenAIModels } from '~/types/openai'

export const config = {
  runtime: 'edge',
}

const handler = async (req: Request): Promise<Response> => {
  try {
    const { model, messages, key, prompt, temperature, course_name } =
      (await req.json()) as ChatBody

    await init((imports) => WebAssembly.instantiate(wasm, imports))
    const encoding = new Tiktoken(
      tiktokenModel.bpe_ranks,
      tiktokenModel.special_tokens,
      tiktokenModel.pat_str,
    )

    const token_limit = OpenAIModels[model.id as OpenAIModelID].tokenLimit

    let promptToSend = prompt
    if (!promptToSend) {
      promptToSend = DEFAULT_SYSTEM_PROMPT
    }

    let temperatureToUse = temperature
    if (temperatureToUse == null) {
      temperatureToUse = DEFAULT_TEMPERATURE
    }

    // ! PROMPT STUFFING
    const search_query = messages[messages.length - 1]?.content as string // most recent message
    const contexts_arr = messages[messages.length - 1]
      ?.contexts as ContextWithMetadata[]

    if (course_name == 'extreme' || course_name == 'zotero-extreme') {
      console.log('CONTEXT STUFFING FOR /extreme and /zotero-extreme slugs')
      promptToSend = await getExtremePrompt(course_name, search_query).catch(
        (err) => {
          console.log(
            'ERROR IN FETCH CONTEXT CALL for EXTREME prompt stuffing, defaulting to NO PROMPT STUFFING :( SAD!',
            err,
          )
          return search_query
        },
      )
      console.log('EXTREME STUFFED PROMPT\n:', promptToSend)
    } else if (course_name == 'gpt4') {
      console.log('NO CONTEXT STUFFING FOR /gpt4 slug')
    }
    // else if (course_name == 'global' || course_name == 'search-all') {
    // todo
    // }
    else {
      // regular context stuffing
      const stuffedPrompt = (await getStuffedPrompt(
        course_name,
        search_query,
        contexts_arr,
        token_limit,
      )) as string
      messages[messages.length - 1]!.content = stuffedPrompt
    }

    // Take most recent N messages that will fit in the context window
    const prompt_tokens = encoding.encode(promptToSend)

    let tokenCount = prompt_tokens.length
    let messagesToSend: OpenAIChatMessage[] = []

    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i]
      if (message) {
        const tokens = encoding.encode(message.content)

        if (tokenCount + tokens.length + 1000 > token_limit) {
          break
        }
        tokenCount += tokens.length
        messagesToSend = [
          { role: message.role, content: message.content },
          ...messagesToSend,
        ]
      }
    }
    encoding.free() // keep this

    console.log('Prompt being sent to OpenAI: ', promptToSend)
    console.log('Message history being sent to OpenAI: ', messagesToSend)

    // Add custom instructions to system prompt
    const systemPrompt =
      promptToSend + "Only answer if it's related to the course materials."

    const stream = await OpenAIStream(
      model,
      systemPrompt,
      temperatureToUse,
      key,
      messagesToSend,
    )

    return new Response(stream)
  } catch (error) {
    console.error("Error while calling openai api: ", error)
    console.log("Type of the error", typeof(error))
    if (error && (error as OpenAIError).message) {
      console.log("error before parse: ", error)
      error = JSON.parse(error as string)
      console.log("Error after parse: ", error)
      const resp = new Response('Error', { status: 500, statusText: (error as OpenAIError).message })
      console.log("Final openai error:", resp)
      return resp
    } else {
      const resp = new Response('Error', { status: 500 })
      console.log("Final error:", resp)
      return resp
    }
  }
}

export default handler
