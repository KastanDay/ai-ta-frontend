// src/pages/api/chat.ts
import { DEFAULT_SYSTEM_PROMPT, DEFAULT_TEMPERATURE } from '@/utils/app/const'
import { OpenAIError, OpenAIStream } from '@/utils/server'
import {
  ChatBody,
  ContextWithMetadata,
  Message,
  OpenAIChatMessage,
} from '@/types/chat'
// @ts-expect-error - no types
import wasm from '../../../node_modules/@dqbd/tiktoken/lite/tiktoken_bg.wasm?module'
import tiktokenModel from '@dqbd/tiktoken/encoders/cl100k_base.json'
import { Tiktoken, init } from '@dqbd/tiktoken/lite/init'
import { fetchContextsNOAXIOS } from '~/pages/api/getContexts'
import { getExtremePrompt } from './getExtremePrompt'
import { Context } from 'react-markdown/lib/ast-to-react'

// TODO: maybe this is why searchQuery is running so many times?
// import { useSearchQuery } from '~/components/UIUC-Components/ContextCards'

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

    let promptToSend = prompt
    if (!promptToSend) {
      promptToSend = DEFAULT_SYSTEM_PROMPT
    }

    let temperatureToUse = temperature
    if (temperatureToUse == null) {
      temperatureToUse = DEFAULT_TEMPERATURE
    }

    // ! PROMPT STUFFING
    // TODO -- move this semewhere else, and run it before we trim the context limit
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
      const separator = '--------------------------' // between each context
      const context_text = contexts_arr
        .map(
          (context) =>
            `Document: ${context.readable_filename}, page number (if exists): ${context.pagenumber_or_timestamp}\n${context.text}\n`,
        )
        .join(separator + '\n')

      const stuffedPrompt =
        "Please answer the following question. Use the context below, called 'your documents,' only if it's helpful and don't use parts that are very irrelevant. It's good to quote 'your documents' directly, something like 'from ABS source it says XYZ' Feel free to say you don't know. \nHere's a few passages of the high quality 'your documents':\n" +
        context_text +
        '\n\nNow please respond to my query: ' +
        search_query

      messages[messages.length - 1]!.content = stuffedPrompt as string

      console.log('......................')
      console.log('Stuffed prompt', stuffedPrompt)
      console.log('RIGHT BEFORE OPENAI STREAM .........')
    }

    //  COMPRESS TO PROPER SIZE
    const prompt_tokens = encoding.encode(promptToSend)

    let tokenCount = prompt_tokens.length
    let messagesToSend: OpenAIChatMessage[] = []

    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i]
      if (message) {
        const tokens = encoding.encode(message.content)

        if (tokenCount + tokens.length + 1000 > model.tokenLimit) {
          break
        }
        tokenCount += tokens.length
        messagesToSend = [
          { role: message.role, content: message.content },
          ...messagesToSend,
        ]
      }
    }

    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i]
      if (message) {
        const tokens = encoding.encode(message.content)

        if (tokenCount + tokens.length + 1000 > model.tokenLimit) {
          break
        }
        tokenCount += tokens.length
        messagesToSend = [
          { role: message.role, content: message.content },
          ...messagesToSend,
        ]
      }
    }
    encoding.free() // keep this, idk what it does

    const stream = await OpenAIStream(
      model,
      promptToSend,
      temperatureToUse,
      key,
      messagesToSend,
    )
    // let response = new Response(stream)
    // let newResponse = new Response(stream, {
    //   headers: {
    //     'X-Contexts': messages[messages.length - 1]!.contexts as ContextWithMetadata[]
    //   }
    // });
    // response.extraData = { contexts: messages[messages.length - 1]!.contexts }

    return new Response(stream)
    // return { response: new Response(stream), context_arr };
  } catch (error) {
    console.error(error)
    if (error instanceof OpenAIError) {
      return new Response('Error', { status: 500, statusText: error.message })
    } else {
      return new Response('Error', { status: 500 })
    }
  }
}

export default handler
