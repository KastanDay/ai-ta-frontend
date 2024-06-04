// src/pages/api/chat.ts
import { CourseMetadata } from '~/types/courseMetadata'
import { getCourseMetadata } from '~/pages/api/UIUC-api/getCourseMetadata'
// @ts-expect-error - no types
import wasm from '../../../node_modules/@dqbd/tiktoken/lite/tiktoken_bg.wasm?module'
import tiktokenModel from '@dqbd/tiktoken/encoders/cl100k_base.json'
import { Tiktoken, init } from '@dqbd/tiktoken/lite/init'
import { OpenAIError, OpenAIStream } from '@/utils/server'
import {
  ChatBody,
  Content,
  ContextWithMetadata,
  Conversation,
  Message,
  MessageType,
  OpenAIChatMessage,
  ToolOutput,
  UIUCTool,
} from '@/types/chat'
import { NextResponse } from 'next/server'
import { parseOpenaiKey } from '~/utils/crypto'

export const config = {
  runtime: 'edge',
}

const handler = async (req: Request): Promise<NextResponse> => {
  try {
    const { conversation, key, course_name, courseMetadata, stream } =
      (await req.json()) as ChatBody

    // Call buildPrompt
    // const { systemPrompt, userPrompt, convoHistory, openAIKey } =
    //   await buildPrompt({
    //     conversation,
    //     rawOpenaiKey: key,
    //     projectName: course_name,
    //     courseMetadata,
    //   })

    const openAIKey = await parseOpenaiKey(key)

    // console.log(
    //   'PROMPT TO BE SENT -- ',
    //   userPrompt,
    //   'system prompt:',
    //   systemPrompt,
    // )

    // const latestMessage: OpenAIChatMessage = {
    //   role: 'user',
    //   content: [
    //     {
    //       type: 'text' as MessageType,
    //       text: userPrompt,
    //     },
    //   ],
    // }

    // const messagesToSend = [latestMessage, ...convoHistory] // BUG: REPLACE (not append to) latest user message. RN we have dupliacates.

    // console.log('Messages to send: ', messagesToSend)

    const apiStream = await OpenAIStream(
      conversation.model,
      conversation.messages[conversation.messages.length - 1]!
        .latestSystemMessage!,
      conversation.temperature,
      openAIKey,
      // @ts-ignore -- I think the types are fine.
      conversation.messages, // old:  messagesToSend
      stream,
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

interface Prompts {
  systemPrompt: string
  userPrompt: string
  convoHistory: OpenAIChatMessage[]
  openAIKey: string
}

export const buildPrompt = async ({
  conversation,
  rawOpenaiKey,
  projectName,
  courseMetadata,
}: {
  conversation: Conversation
  rawOpenaiKey: string
  projectName: string
  courseMetadata: CourseMetadata | undefined
  // }): Promise<Prompts> => {
}): Promise<Conversation> => {
  /*
  System prompt -- defined by user. Then we add the citations instructions to it.

  isImage -- means we're JUST generating an image description, not a final answer.
  
Priorities for building prompt w/ limited window: 
1. ✅ most recent user message
2. Last 1 or 2 convo history. At least the user message and the AI response. Key for follow-up questions.
2. ✅ image description
3. ✅ tool result
4. ✅ query_topContext
5. image_topContext
6. tool_topContext
7. ✅ conversation history
*/
  let remainingTokenBudget = conversation.model.tokenLimit - 1500 // save space for images, OpenAI's handling, etc.

  await init((imports) => WebAssembly.instantiate(wasm, imports))
  const encoding = new Tiktoken(
    tiktokenModel.bpe_ranks,
    tiktokenModel.special_tokens,
    tiktokenModel.pat_str,
  )

  // do these things in parallel -- await at end
  const allPromises = []
  allPromises.push(parseOpenaiKey(rawOpenaiKey))
  allPromises.push(_getLastUserMessage({ conversation }))
  allPromises.push(_getLastToolResult({ conversation }))
  allPromises.push(_getSystemPrompt({ courseMetadata, conversation }))
  // ideally, run context search here -- parallelized. (tricky due to sending status updates homeDispatch)
  const [openaiKey, lastUserMessage, lastToolResult, userDefinedSystemPrompt] =
    (await Promise.all(allPromises)) as [string, string, UIUCTool[], string]

  // SYSTEM PROMPT
  const systemPostPrompt = getSystemPostPrompt(projectName)
  const systemPrompt = userDefinedSystemPrompt + '\n\n' + systemPostPrompt
  remainingTokenBudget -= encoding.encode(systemPrompt).length
  

  // TOOLS
  // if (lastToolResult && remainingTokenBudget > 0) {
  //   let toolMsg = `The user invoked API(s), aka tool(s), and here's the tool output(s). Remember, use this information when relevant in crafting your response. Cite it directly using an inline citation. Tool output: `
  //   lastToolResult.forEach((tool) => {
  //     if (tool.output && tool.output.text) {
  //       toolMsg += `Tool: ${tool.name}\nOutput: ${tool.output.text}\n\n`
  //     } else if (tool.output && tool.output.imageUrls) {
  //       toolMsg += `Tool: ${tool.name}\nOutput: 'Images were generated by this tool call and the generated image(s) is/are provided below.'`
  //     } else if (tool.output && tool.output.data) {
  //       toolMsg += `Tool: ${tool.name}\nOutput: ${JSON.stringify(tool.output.data)}`
  //     }
  //   })
  //   remainingTokenBudget -= encoding.encode(toolMsg).length
  //   if (remainingTokenBudget >= 0) {
  //     // add tool output to user prompt
  //     userPrompt += toolMsg
  //   }
  // }

  // USER PROMPT
  let userPrompt = ''
  remainingTokenBudget -= encoding.encode(lastUserMessage).length

  // Tool output + user Query (added to prompt below)
  const userQuery = _buildUserQuery({ conversation })

  // Keep room in budget for latest 2 convo messages
  const tokensInLastTwoMessages = _getRecentConvoTokens({
    conversation,
    encoding,
  })
  console.log('Tokens in last two messages: ', tokensInLastTwoMessages)

  remainingTokenBudget -= encoding.encode(
    `\nFinally, please respond to the user's query: ${userQuery}`,
  ).length

  // query_topContext
  const query_topContext = _buildQueryTopContext({
    conversation: conversation,
    encoding: encoding,
    tokenLimit: remainingTokenBudget - tokensInLastTwoMessages, // keep room for convo history
  })
  if (query_topContext) {
    const queryContextMsg = `\nHere's high quality passages from the user's documents. Use these, and cite them carefully in the format previously described, to construct your answer:\n${query_topContext}`
    remainingTokenBudget -= encoding.encode(queryContextMsg).length
    userPrompt += queryContextMsg
  }

  // add conversation history
  const convoHistory = _buildConvoHistory({
    conversation,
    encoding,
    tokenLimit: remainingTokenBudget,
  })

  userPrompt += `\nFinally, please respond to the user's query: ${userQuery} ${userPrompt}`

  encoding.free() // keep this

  // conversation.messages = convoHistory // Necessary??
  // latest user message
  conversation.messages[
    conversation.messages.length - 1
  ]!.finalPromtEngineeredMessage = userPrompt
  conversation.messages[conversation.messages.length - 1]!.latestSystemMessage =
    systemPrompt
  return conversation

  // return {
  //   systemPrompt: systemPrompt as string,
  //   userPrompt,
  //   convoHistory,
  //   openAIKey: openaiKey as string,
  // }
}

const _getRecentConvoTokens = ({
  conversation,
  encoding,
}: {
  conversation: Conversation
  encoding: Tiktoken
}): number => {
  // TODO: This is not counting the last 2/4 messages properly. I think it only counts assistant messages, not user. Not sure.

  return conversation.messages.slice(-4).reduce((acc, message) => {
    let content: string
    if (typeof message.content === 'string') {
      content = message.content
      console.log('Message content: ', content)
    } else {
      content = ''
    }

    console.log('Encoding content: ', content, encoding.encode(content).length)
    const tokens = encoding.encode(content).length
    return acc + tokens
  }, 0)
}

const _buildUserQuery = ({
  conversation,
}: {
  conversation: Conversation
}): string => {
  // ! PROMPT STUFFING
  let userQuery = ''
  const latestUserMessage =
    conversation.messages[conversation.messages.length - 1]
  if (latestUserMessage?.content === 'string') {
    userQuery = latestUserMessage.content as string
  } else if (latestUserMessage?.tools) {
    // Add tool output to user query
    let toolMsg = `The API(s), aka tool(s) were invoked, and here's the tool output(s). Remember, use this information when relevant in crafting your response. Cite it directly using an inline citation. \nTool outputs:\n`
    latestUserMessage?.tools?.forEach((tool) => {
      let toolOutput = ''
      if (tool.output && tool.output.text) {
        toolOutput += `Tool: ${tool.name}\nOutput: ${tool.output.text}\n`
      } else if (tool.output && tool.output.imageUrls) {
        toolOutput += `Tool: ${tool.name}\nOutput: Images were generated by this tool call and the generated image(s) is/are provided below`
        // Add image urls to message content
        ;(latestUserMessage.content as Content[]).push(
          ...tool.output.imageUrls.map((imageUrl) => ({
            type: 'image_url' as MessageType,
            image_url: { url: imageUrl },
          })),
        )
      } else if (tool.output && tool.output.data) {
        toolOutput += `Tool: ${tool.name}\nOutput: ${JSON.stringify(tool.output.data)}\n`
      } else if (tool.error) {
        toolOutput += `Tool: ${tool.name}\n${tool.error}\n`
      }
      toolMsg += toolOutput
    })
    userQuery += toolMsg += '\n\n'
    // userQuery += "User Query: " + ((latestUserMessage?.content as Content[])?.map((c) => c.text || '').join('\n') || '')
  }
  // console.log('Built userQuery: ', userQuery)
  return userQuery
}
const _buildConvoHistory = ({
  conversation,
  tokenLimit,
  encoding,
}: {
  conversation: Conversation
  tokenLimit: number
  encoding: Tiktoken
}): OpenAIChatMessage[] => {
  let tokenCount = 0
  let messagesToSend: OpenAIChatMessage[] = []
  const messages = conversation.messages

  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i]
    if (message) {
      let content: string
      if (typeof message.content === 'string') {
        content = message.content
      } else {
        // image descriptions
        content = message.content.map((c) => c.text || '').join(' ')
      }
      const tokens = encoding.encode(content)

      if (tokenCount + tokens.length + 1000 > tokenLimit) {
        break
      }
      tokenCount += tokens.length
      messagesToSend = [
        { role: message.role, content: message.content as Content[] },
        ...messagesToSend,
      ]
    }
  }
  return messagesToSend
}

export function _buildQueryTopContext({
  conversation,
  encoding,
  tokenLimit = 8000,
}: {
  conversation: Conversation
  encoding: Tiktoken
  tokenLimit: number
}) {
  try {
    const contexts = conversation.messages[conversation.messages.length - 1]
      ?.contexts as ContextWithMetadata[]

    if (contexts.length === 0) {
      return undefined
    }

    let tokenCounter = 0 // encoding.encode(system_prompt + searchQuery).length
    const validDocs = []
    for (const [index, d] of contexts.entries()) {
      const docString = `---\n${index + 1}: ${d.readable_filename}${
        d.pagenumber ? ', page: ' + d.pagenumber : ''
      }\n${d.text}\n`
      const numTokens = encoding.encode(docString).length
      // console.log(
      //   `token_counter: ${tokenCounter}, num_tokens: ${numTokens}, token_limit: ${tokenLimit}`,
      // )
      if (tokenCounter + numTokens <= tokenLimit) {
        tokenCounter += numTokens
        validDocs.push({ index, d })
      } else {
        continue
      }
    }

    const separator = '---\n' // between each context
    const contextText = validDocs
      .map(
        ({ index, d }) =>
          `${index + 1}: ${d.readable_filename}${
            d.pagenumber ? ', page: ' + d.pagenumber : ''
          }\n${d.text}\n`,
      )
      .join(separator)

    // const stuffedPrompt =
    //   contextText + '\n\nNow please respond to my query: ' + searchQuery
    // const totalNumTokens = encoding.encode(stuffedPrompt).length
    // console.log('contextText', contextText)
    // console.log(
    // `Total number of tokens: ${totalNumTokens}. Number of docs: ${contexts.length}, number of valid docs: ${validDocs.length}`,
    // )

    return contextText
  } catch (e) {
    console.error(`Error in getStuffedPrompt: ${e}`)
    throw e
  }
}

const _getSystemPrompt = async ({
  courseMetadata,
  conversation,
}: {
  courseMetadata: CourseMetadata | undefined
  conversation: Conversation
}): Promise<string> => {
  let systemPrompt
  if (courseMetadata) {
    systemPrompt =
      courseMetadata.system_prompt ||
      (process.env.DEFAULT_SYSTEM_PROMPT as string)
  } else {
    systemPrompt = await getCourseMetadata(conversation.name).then(
      (courseMetadata) => {
        return (
          courseMetadata?.system_prompt ||
          (process.env.DEFAULT_SYSTEM_PROMPT as string)
        )
      },
    )
  }
  return systemPrompt
}

const _getLastToolResult = async ({
  conversation,
}: {
  conversation: Conversation
}): Promise<UIUCTool[] | undefined> => {
  const toolResults: UIUCTool[] = conversation.messages?.[
    conversation.messages.length - 1
  ]?.tools as UIUCTool[]
  return toolResults
}

const _getLastUserMessage = async ({
  conversation,
}: {
  conversation: Conversation
}): Promise<string> => {
  /* 
    Gets either/or user message and/or image descriptions.
  */

  let most_recent_user_message = ''
  const lastMessageContent =
    conversation.messages?.[conversation.messages.length - 1]?.content
  if (typeof lastMessageContent === 'string') {
    most_recent_user_message = lastMessageContent
  } else if (Array.isArray(lastMessageContent)) {
    most_recent_user_message = lastMessageContent
      .map((content) => content.text || '')
      .join('\n')
  }
  return most_recent_user_message
}

export function getSystemPostPrompt(course_name: string) {
  /*
  This goes AFTER the user-defined system message. It's mostly about citations and response format styling.
  */
  let prePrompt = `Please analyze and respond to the following question using the excerpts from the provided documents. These documents can be pdf files or web pages. Additionally, you may see the output from API calls (called 'tools') to the user's services which, when relevant, you should use to construct your answer. You may also see image descriptions from images uploaded by the user. Prioritize image descriptions, when helpful, to construct your answer.
Integrate relevant information from these documents, ensuring each reference is linked to the document's number.
Your response should be semi-formal. 
When quoting directly, cite with footnotes linked to the document number and page number, if provided. 
Summarize or paraphrase other relevant information with inline citations, again referencing the document number and page number, if provided.
If the answer is not in the provided documents, state so. Yet always provide as helpful a response as possible to directly answer the question.
Conclude your response with a LIST of the document titles as clickable placeholders, each linked to its respective document number and page number, if provided.
Always share page numbers if they were shared with you.
ALWAYS follow the examples below:
Insert an inline citation like this in your response: 
"[1]" if you're referencing the first document or 
"[1, page: 2]" if you're referencing page 2 of the first document.
At the end of your response, list the document title with a clickable link, like this: 
"1. [document_name](#)" if you're referencing the first document or
"1. [document_name, page: 2](#)" if you're referencing page 2 of the first document.
Nothing else should prefixxed or suffixed to the citation or document name. Consecutive citations should be separated by a comma.

Suppose a document name is shared with you along with the index and pageNumber below like "27: www.pdf, page: 2", "28: www.osd", "29: pdf.www, page 11\n15" where 27, 28, 29 are indices, www.pdf, www.osd, pdf.www are document_name, and 2, 11 are the pageNumbers and 15 is the content of the document, then inline citations and final list of cited documents should ALWAYS be in the following format:
"""
The sky is blue. [27, page: 2][28] The grass is green. [29, page: 11]
Relevant Sources:

27. [www.pdf, page: 2](#)
28. [www.osd](#)
29. [pdf.www, page: 11](#)
"""
ONLY return the documents with relevant information and cited in the response. If there are no relevant sources, don't include the "Relevant Sources" section in response.
The following are excerpts from the high-quality documents, APIs/tools, and image descriptions to construct your answer.\n`

  // Law school "closed world" question answering
  if (course_name == 'Law794-TransactionalDraftingAlam') {
    const lawPreprompt =
      'This is for the law domain and we train law students to stick to facts that are in the record. Do not improvise or use your world knowledge, stick to only the information provided and make heavy use of direct quotes instead of paraphrasing or summarizing.\n'
    prePrompt = lawPreprompt + prePrompt
  }

  return prePrompt
}
