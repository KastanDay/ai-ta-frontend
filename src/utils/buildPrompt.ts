import { Content, ContextWithMetadata, Conversation } from '~/types/chat'
import { decrypt, isEncrypted } from './crypto'
import {
  getStuffedPrompt,
  getSystemPrompt,
} from '~/pages/api/contextStuffingHelper'
import { CourseMetadata } from '~/types/courseMetadata'
import { getCourseMetadata } from '~/pages/api/UIUC-api/getCourseMetadata'

interface Prompts {
  systemPrompt: string
  userPrompt: string
}

export const buildPrompt = async ({
  conversation,
  rawOpenaiKey,
  courseMetadata,
}: {
  conversation: Conversation
  rawOpenaiKey: string
  projectName: string
  courseMetadata: CourseMetadata | undefined
}): Promise<Prompts> => {
  /*
  System prompt -- defined by user. Then we add the citations instructions to it.

  Priorities for building prompt w/ limited window: 
    1. ✅ most recent user message
    2. ✅ image description
    3. ✅ tool result
    4. query_topContext
    5. image_topContext
    6. tool_topContext
    7. conversation history
  */

  const allPromises = []

  const tokenLimit = conversation.model.tokenLimit - 1500 // save space for images, OpenAI's handling, etc.

  // const openaiKeyPromise = parseOpenaiKey(rawOpenaiKey)
  // const lastUserMessagePromise = _getLastUserMessage({ conversation })
  // const lastToolResultPromise = _getLastToolResult({ conversation })
  // const systemPrompt = _getSystemPrompt({ courseMetadata, conversation }) // faster to await... otherwise control flow too complex for no good reason


  allPromises.push(parseOpenaiKey(rawOpenaiKey))
  allPromises.push(_getLastUserMessage({ conversation }))
  allPromises.push(_getLastToolResult({ conversation }))
  allPromises.push(_getSystemPrompt({ courseMetadata, conversation }))

  // Todo: do these things in parallel -- await later

  // Get system prompt


  const [openaiKey, lastUserMessage, lastToolResult, systemPrompt] = await Promise.all(allPromises)

  // Do final prompt building
  let userPrompt = ''
  userPrompt += lastUserMessage
  // Do some dreaming thinking about what this context building should look like! 
  // "Please respond to my query: "

  return { systemPrompt: systemPrompt as string, userPrompt }
}



// const _getLastQueryTopContext = async ({
//   conversation,
// }: {
//   conversation: Conversation
// }): Promise<string> => {
//   const queryTopContexts = conversation.messages?.[conversation.messages.length - 1]?.contexts?.map((context) => {
//     return `Context: ${context.text}`
//   })
//   if (queryTopContexts) {
//     return queryTopContexts.join('\n')
//   } else {
//     return ''
//   }
// }


const _getSystemPrompt = async ({
  courseMetadata,
  conversation,
}: {
  courseMetadata: CourseMetadata | undefined
  conversation: Conversation
}): Promise<string> => {
  let systemPrompt
  if (courseMetadata) {
    systemPrompt = courseMetadata.system_prompt || process.env.DEFAULT_SYSTEM_PROMPT as string
  } else {
    systemPrompt = await getCourseMetadata(conversation.name).then((courseMetadata) => {
      return courseMetadata?.system_prompt || process.env.DEFAULT_SYSTEM_PROMPT as string
    })
  }
  return systemPrompt
}
const _getLastToolResult = async ({
  conversation,
}: {
  conversation: Conversation
}): Promise<string> => {
  const toolResults = conversation.messages?.[conversation.messages.length - 1]?.tools?.map((tool) => {
    return `Tool: ${tool.tool?.name}\nOutput: ${tool.toolResult}`
  })
  if (toolResults) {
    return toolResults.join('\n')
  } else {
    return ''
  }
}
const _getLastUserMessage = async ({
  conversation,
}: {
  conversation: Conversation
}): Promise<string> => {
  /* 
    Gets either/or user message and/or image descriptions.
  */

  let most_recent_user_message = '';
  const lastMessageContent = conversation.messages?.[conversation.messages.length - 1]?.content;
  if (typeof lastMessageContent === 'string') {
    most_recent_user_message = lastMessageContent;
  } else if (Array.isArray(lastMessageContent)) {
    most_recent_user_message = lastMessageContent.map(content => content.text || '').join('\n');
  }
  return most_recent_user_message
}


// const _buildTopContextPrompt = ({
//   conversation,
// }: {
//   conversation: Conversation
// }): Conversation => {
//   /* 
//     This is compatible with having MULTIPLE top context calls in a single message.
//   */

//   const messages = conversation.messages

//   // ! Get search query (most recent user message)
//   let search_query: string
//   if (typeof messages[messages.length - 1]?.content === 'string') {
//     search_query = messages[messages.length - 1]?.content as string
//   } else {
//     // Extract image description...
//     // Change the content type for 'tool_image_url' to 'image_url'
//     // This is very important to differentiate the tool generated images from user uploaded images. Otherwise "regenerate" behavior will treat tool-result images as user images.
//     ; (messages[messages.length - 1]?.content as Content[]).forEach(
//       (content) => {
//         if (content.type === 'tool_image_url') {
//           console.debug(
//             'Changing tool_image_url to image_url for message',
//             content,
//           )
//           content.type = 'image_url'
//         }
//       },
//     )
//     // Combine all text content into one string
//     search_query = (messages[messages.length - 1]?.content as Content[])
//       .map((c) => c.text || '')
//       .join(' ')
//   }

//   // ! Do context stuffing
//   // most recent message
//   const contexts_arr = messages[messages.length - 1]
//     ?.contexts as ContextWithMetadata[]

//   if (course_name == 'gpt4') {
//     console.log('NO CONTEXT STUFFING FOR /chat slug')
//   } else if (!isImage) {
//     // regular context stuffing
//     const stuffedPrompt = (await getStuffedPrompt(
//       search_query,
//       contexts_arr,
//       conversation.model.tokenLimit,
//       TODO_SYSTEM_PROMPT,
//     )) as string
//     if (typeof messages[messages.length - 1]?.content === 'string') {
//       messages[messages.length - 1]!.content = stuffedPrompt
//     } else if (
//       Array.isArray(messages[messages.length - 1]?.content) &&
//       (messages[messages.length - 1]!.content as Content[]).every(
//         (item) => 'type' in item,
//       )
//     ) {
//       const contentArray = messages[messages.length - 1]!.content as Content[]
//       const textContentIndex =
//         contentArray.findIndex((item) => item.type === 'text') || 0

//       if (textContentIndex !== -1 && contentArray[textContentIndex]) {
//         // Replace existing text content with the new stuffed prompt
//         contentArray[textContentIndex] = {
//           ...contentArray[textContentIndex],
//           text: stuffedPrompt,
//           type: 'text',
//         }
//       } else {
//         // Add new stuffed prompt if no text content exists
//         // TODO What??
//         contentArray.push({ type: 'text', text: stuffedPrompt })
//       }
//     }
//   }
// }

const parseOpenaiKey = async (openaiKey: string) => {
  if (openaiKey && isEncrypted(openaiKey)) {
    const decryptedText = await decrypt(
      openaiKey,
      process.env.NEXT_PUBLIC_SIGNING_KEY as string,
    )
    openaiKey = decryptedText as string
  } else {
    // console.log('Using client key for openai chat: ', apiKey)
  }
  return openaiKey
}