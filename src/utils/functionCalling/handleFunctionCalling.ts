import { EssentialToolDetails } from '~/pages/api/UIUC-api/tools/getN8nWorkflows'
import { Conversation, Message } from '~/types/chat'

export default async function handleTools(
  message: Message,
  availableTools: EssentialToolDetails[],
  selectedConversation: Conversation,
) {
  console.log('Available tools: ', availableTools)
  try {
    const response = await fetch('/api/chat/openaiFunctionCall', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversation: selectedConversation,
        tools: availableTools,
      }),
    })

    if (response.body) {
      const reader = response.body.getReader()
      let { value: chunk, done: readerDone } = await reader.read()
      chunk = chunk ? chunk : new Uint8Array()

      const chunks = []
      while (!readerDone) {
        const segment = new TextDecoder().decode(chunk, { stream: true })
        // console.log('Chunk from openaiFunctionCall: ', segment);
        chunks.push(segment)
        const result = await reader.read()
        chunk = result.value
        readerDone = result.done
      }

      // Parse function calling from OpenAI
      const finalResponse = JSON.parse(chunks.join(''))
      const { function_call } = finalResponse

      // Parse the function arguments from JSON
      if (function_call && function_call.arguments) {
        const args = JSON.parse(function_call.arguments)
        function_call.arguments = args
      }
      console.log('Function call from openaiFunctionCall: ', function_call)
      // TODO: Do tool calling here!!
      // callN8nFunction(function_call, selectedConversation);
    } else {
      console.log('No response body.')
    }
  } catch (error) {
    console.error('Error calling openaiFunctionCall: ', error)
  }
  // TODO: return the updated message. This is a placeholder.
  return message
}
