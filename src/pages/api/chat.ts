import { DEFAULT_SYSTEM_PROMPT, DEFAULT_TEMPERATURE } from '@/utils/app/const'
import { OpenAIError, OpenAIStream } from '@/utils/server'

import { useState, useEffect } from 'react'

import { ChatBody, Message } from '@/types/chat'

// @ts-expect-error - no types
import wasm from '../../../node_modules/@dqbd/tiktoken/lite/tiktoken_bg.wasm?module'

import tiktokenModel from '@dqbd/tiktoken/encoders/cl100k_base.json'
import { Tiktoken, init } from '@dqbd/tiktoken/lite/init'

import { fetchContextsNOAXIOS, fetchContexts, getTopContextsResponse } from '~/pages/api/getContexts'
// import { all } from 'axios'
// import { optional } from 'zod'
// import { OptionalPortal } from '@mantine/core'

import log from 'next/dist/build/output/log';

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

      const prompt_tokens = encoding.encode(promptToSend)

      let tokenCount = prompt_tokens.length
      let messagesToSend: Message[] = []

      for (let i = messages.length - 1; i >= 0; i--) {
        const message = messages[i];
        if (message) {
          const tokens = encoding.encode(message.content);

          if (tokenCount + tokens.length + 1000 > model.tokenLimit) {
            break;
          }
          tokenCount += tokens.length;
          messagesToSend = [message, ...messagesToSend];
        }
      }

      for (let i = messages.length - 1; i >= 0; i--) {
        const message = messages[i];
        if (message) {
          const tokens = encoding.encode(message.content);

          if (tokenCount + tokens.length + 1000 > model.tokenLimit) {
            break;
          }
          tokenCount += tokens.length;
          messagesToSend = [message, ...messagesToSend];
        }
      }


      encoding.free() // keep this, idk what it does

      // ! A BUNCH OF CRAP TO DO PROMPT STUFFING WITH CONTEXTS
      // TODO -- move this semewhere else, and run it before we trim the context limit
      console.log('COURSE NAME ------------ ', course_name)

      // update the last message.content with the prompt injection
      const original_message = messagesToSend[messagesToSend.length - 1]?.content

      const search_query = original_message || ""
      const context_text = await fetchContextsNOAXIOS(course_name, search_query).then((context_arr) => {
        const separator = "--------------------------" // between each context
        const all_texts = context_arr.map((context) => `Document: ${context.readable_filename}\n${context.text}\n`).join(separator + "\n");
        
        // log.warn('all_texts', context_arr[0]?.course_name);
        // log.warn('all_texts', context_arr[0]?.text);
        console.log('all_texts', all_texts)
        return all_texts
      }).catch((err) => {console.log('ERROR IN FETCH CONTEXT CALL', err); return ""});

      const stuffedPrompt = "Please answer the following question. Use the context below only if it's helpful and don't use parts that are very irrelevant. It's good to quote the context directly, something like 'from ABS source it says XYZ' Feel free to say you don't know. \nHere's a few passages of high quality context:\n" + context_text + "\n\nNow please respond to my query: " + original_message

      if (messagesToSend && messagesToSend.length > 0 && messagesToSend[messagesToSend.length - 1]) {
        messagesToSend[messagesToSend.length - 1]!.content = stuffedPrompt || ""
      }

      console.log("......................")
      console.log('Stuffed prompt', stuffedPrompt)
      console.log("RIGHT BEFORE OPENAI STREAM .........")

      const stream = await OpenAIStream(
        model,
        promptToSend,
        temperatureToUse,
        key,
        messagesToSend,
      )

      return new Response(stream)
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
