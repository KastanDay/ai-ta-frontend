// src/pages/api/chat.ts
import { DEFAULT_SYSTEM_PROMPT, DEFAULT_TEMPERATURE } from '@/utils/app/const'
import { OpenAIError, OpenAIStream } from '@/utils/server'
import { ChatBody, Content, ContextWithMetadata, OpenAIChatMessage } from '@/types/chat'
// @ts-expect-error - no types
import wasm from '../../../node_modules/@dqbd/tiktoken/lite/tiktoken_bg.wasm?module'
import tiktokenModel from '@dqbd/tiktoken/encoders/cl100k_base.json'
import { Tiktoken, init } from '@dqbd/tiktoken/lite/init'
import { getExtremePrompt } from './getExtremePrompt'
import { getStuffedPrompt } from './contextStuffingHelper'
import { OpenAIModelID, OpenAIModels } from '~/types/openai'
import { NextResponse } from 'next/server'

export const config = {
  runtime: 'edge',
}

const handler = async (req: Request): Promise<NextResponse> => {
  try {
    console.log("Top of /api/chat.ts. req: ", req)
    const { model, messages, key, prompt, temperature, course_name, stream } =
      (await req.json()) as ChatBody
    console.log("After message parsing: ", model, messages, key, prompt, temperature, course_name, stream)

    await init((imports) => WebAssembly.instantiate(wasm, imports))
    const encoding = new Tiktoken(
      tiktokenModel.bpe_ranks,
      tiktokenModel.special_tokens,
      tiktokenModel.pat_str,
    )

    let modelObj;
    if (typeof model === 'string') {
      modelObj = OpenAIModels[model as OpenAIModelID];
    } else {
      modelObj = model;
    }


    const token_limit = OpenAIModels[modelObj.id as OpenAIModelID].tokenLimit
    console.log("Model's token limit", token_limit)

    let promptToSend = prompt
    if (!promptToSend) {
      promptToSend = DEFAULT_SYSTEM_PROMPT
    }

    let temperatureToUse = temperature
    if (temperatureToUse == null) {
      temperatureToUse = DEFAULT_TEMPERATURE
    }

    // ! PROMPT STUFFING
    let search_query: string;
    if (typeof messages[messages.length - 1]?.content === 'string') {
      search_query = messages[messages.length - 1]?.content as string;
    } else {
      search_query = (messages[messages.length - 1]?.content as Content[]).map(c => c.text || '').join(' ');
    }
    // most recent message
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
      console.log('NO CONTEXT STUFFING FOR /chat slug')
    }
    // else if (course_name == 'global' || course_name == 'search-all') {
    // todo
    // }
    else if (stream) {
      // regular context stuffing
      const stuffedPrompt = (await getStuffedPrompt(
        course_name,
        search_query,
        contexts_arr,
        token_limit,
      )) as string
      if (typeof messages[messages.length - 1]?.content === 'string') {
        messages[messages.length - 1]!.content = stuffedPrompt;
      } else if (Array.isArray(messages[messages.length - 1]?.content) &&
        (messages[messages.length - 1]!.content as Content[]).every(item => 'type' in item)) {

        const contentArray = messages[messages.length - 1]!.content as Content[];
        const textContentIndex = contentArray.findIndex(item => item.type === 'text') || 0;

        if (textContentIndex !== -1 && contentArray[textContentIndex]) {
          // Replace existing text content with the new stuffed prompt
          contentArray[textContentIndex] = { ...contentArray[textContentIndex], text: stuffedPrompt, type: 'text' };
        } else {
          // Add new stuffed prompt if no text content exists
          contentArray.push({ type: 'text', text: stuffedPrompt });
        }
      }
    }

    // Take most recent N messages that will fit in the context window
    const prompt_tokens = encoding.encode(promptToSend)

    let tokenCount = prompt_tokens.length
    let messagesToSend: OpenAIChatMessage[] = []

    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i]
      if (message) {
        let content: string;
        if (typeof message.content === 'string') {
          content = message.content;
        } else {
          content = message.content.map(c => c.text || '').join(' ');
        }
        const tokens = encoding.encode(content)

        if (tokenCount + tokens.length + 1000 > token_limit) {
          break
        }
        tokenCount += tokens.length
        messagesToSend = [
          { role: message.role, content: message.content as Content[] },
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

    const apiStream = await OpenAIStream(
      modelObj,
      systemPrompt,
      temperatureToUse,
      key,
      messagesToSend,
      stream
    )
    if (stream) {
      return new NextResponse(apiStream)
    } else {
      return new NextResponse(JSON.stringify(apiStream))
    }

  } catch (error) {
    if (error instanceof OpenAIError) {
      const { name, message } = error
      console.error('OpenAI Completion Error', message)
      const resp = NextResponse.json(
        {
          statusCode: 400,
          name: name,
          message: message,
        },
        { status: 400 },
      )
      console.log('Final OpenAIError resp: ', resp)
      return resp
    } else {
      console.error('Unexpected Error', error)
      const resp = NextResponse.json({ name: 'Error' }, { status: 500 })
      console.log('Final Error resp: ', resp)
      return resp
    }
  }
}

export default handler
