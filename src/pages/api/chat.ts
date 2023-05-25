import { DEFAULT_SYSTEM_PROMPT, DEFAULT_TEMPERATURE } from '@/utils/app/const'
import { OpenAIError, OpenAIStream } from '@/utils/server'

import { ChatBody, Message } from '@/types/chat'

// @ts-expect-error - no types
import wasm from '../../../node_modules/@dqbd/tiktoken/lite/tiktoken_bg.wasm?module'

import tiktokenModel from '@dqbd/tiktoken/encoders/cl100k_base.json'
import { Tiktoken, init } from '@dqbd/tiktoken/lite/init'

import { fetchContexts } from '~/pages/api/getContexts'
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


      encoding.free()

      console.log('promptToSend promptToSend promptToSend promptToSend promptToSend promptToSend ')
      console.log('promptToSend', promptToSend)
      console.log('messages', messagesToSend)
      
      
      console.log('COURSE NAME ------------ ', course_name)

      // update the last message.content with the prompt injection
      const original_message = messagesToSend[messagesToSend.length - 1]?.content

      const search_query = original_message || ""

      const context_text = await fetchContexts(course_name, search_query).then((context_arr) => {
        const separator = "--------------------------" // between each context
        const all_texts = context_arr.map((context) => `${context.readable_filename}\n${context.text}`).join(separator + "\n");

        console.log('all_texts', all_texts)
        log.warn('all_texts', all_texts);
        return all_texts
      }).catch((err) => {console.log('err', err); return ""});

      const stuffedPrompt = "Please answer this question using the following context" + context_text + "Question: " + original_message + "Answer:"

      if (messagesToSend && messagesToSend.length > 0 && messagesToSend[messagesToSend.length - 1]) {
        messagesToSend[messagesToSend.length - 1]!.content = stuffedPrompt || ""
      }

    // promptToSend is just the SYSTEM PROMPT ONLY
    // get last messages instead 
    //     {
    //   role: 'assistant',
    //   content: 'I\'m not sure what you\'re trying to convey with "dsf." If you have any questions or need assistance, please feel free to ask.'
    // },
    //   { role: 'user', content: 'one more' }

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
