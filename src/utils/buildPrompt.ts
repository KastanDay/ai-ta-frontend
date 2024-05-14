// import { Content, ContextWithMetadata, Conversation } from '~/types/chat'
// import { decrypt, isEncrypted } from './crypto'
// import {
//   getStuffedPrompt,
//   getSystemPrompt,
// } from '~/pages/api/contextStuffingHelper'

// export const buildPrompt = async ({
//   conversation,
//   rawOpenaiKey,
// }: {
//   conversation: Conversation
//   rawOpenaiKey: string
//   projectName: string
// }): Promise<Conversation> => {
//   /*
//   Priorities for building prompt w/ limited window: 
//     1. most recent user message
//     2. image description
//     3. tool result
//     4. query_topContext
//     5. image_topContext
//     6. tool_topContext
//     7. conversation history
//   */

//   const tokenLimit = conversation.model.tokenLimit - 2001 // save space for images, OpenAI's handling, etc.
//   const openaiKeyPromise = parseOpenaiKey(rawOpenaiKey)

//   // Todo: do these things in parallel -- await later
//   const systemPromptPromise = getSystemPrompt(conversation.name)
//   const query_prompt = getStuffedPrompt()

//   const [systemPrompt, openaiKey, otherAsyncResult] = await Promise.all([
//     systemPromptPromise,
//     openaiKeyPromise,
//     otherAsyncOperationPromise,
//   ])

//   return conversation
// }

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

// // function conversationToMessages(conversation: Conversation) {
// //   // simplify the conversation object to an array of messages
// //   const transformedData = conversation.messages.map(message => {
// //     // Handle different content types within a message
// //     let contentString = '';
// //     if (typeof message.content === 'string') {
// //       contentString = message.content;
// //     } else {
// //       // Assuming content is an array of Content objects
// //       contentString = message.content.map(content => {
// //         if (content.type === 'text') {
// //           return content.text || '';
// //         } else if (content.type === 'image_url') {
// //           return `Image: ${content.image_url?.url || ''}`;
// //         } else {
// //           // Handle other types as needed
// //           return '';
// //         }
// //       }).join(', ');
// //     }
// //     return {
// //       role: message.role,
// //       content: contentString
// //     };
// //   });
// //   return transformedData;
// // }

// const parseOpenaiKey = async (openaiKey: string) => {
//   if (openaiKey && isEncrypted(openaiKey)) {
//     const decryptedText = await decrypt(
//       openaiKey,
//       process.env.NEXT_PUBLIC_SIGNING_KEY as string,
//     )
//     openaiKey = decryptedText as string
//   } else {
//     // console.log('Using client key for openai chat: ', apiKey)
//   }
//   return openaiKey
// }