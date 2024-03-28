// import { EssentialToolDetails } from '~/pages/api/UIUC-api/tools/getN8nWorkflows'
import { Conversation, Message } from '~/types/chat'

export default async function handleTools(
  message: Message,
  availableTools: EssentialToolDetails[],
  selectedConversation: Conversation,
  openaiKey: string,
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
        openaiKey: openaiKey,
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
      if (function_call) {
        console.log('Function call: ', function_call)
        callN8nFunction(function_call, selectedConversation)
      }
    } else {
      console.log('No response body.')
    }
  } catch (error) {
    console.error('Error calling openaiFunctionCall: ', error)
  }
  // TODO: return the updated message. This is a placeholder.
  return message
}

// TODO: finalize this function calling
const callN8nFunction = async (
  function_call: any,
  selectedConversation: Conversation,
) => {
  const response = await fetch('/api/UIUC-api/tools/callN8nFunction', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      function_call: function_call,
      conversation: selectedConversation,
    }),
  })
  if (!response.ok) {
    console.error('Error calling n8n function: ', response)
  }
  const data = await response.json()
  console.log('N8n function response: ', data)
}

// TODO: conform to the new function calling API
export interface EssentialToolDetails {
  id: string
  name: string
}

// TYPES for OpenAI function calling
// interface FunctionParam {
//   type: string;
//   description?: string;
//   enum?: string[];
// }

// interface FunctionParameter {
//   type: string;
//   properties: { [key: string]: FunctionParam };
//   required: string[];
// }

// interface ChatCompletionCreateParamsFunction {
//   name: string;
//   description: string;
//   parameters: FunctionParameter;
// }

export const getOpenAIFunctionsFromN8n = (allWorkflowsJson: any) => {
  // Function to parse the JSON and extract the desired fields, only including active tools
  function parseJson(jsonString: string): EssentialToolDetails[] {
    const data = JSON.parse(jsonString)

    const flattenedData = data.flat()

    // Filter for active tools, then map over the filtered array to extract the fields of interest
    return flattenedData
      .filter((item: any) => item.active)
      .map((item: any) => ({
        Name: item.name,
        ID: item.id,
      }))
  }

  const validTools = parseJson(allWorkflowsJson)
  console.log('getN8nWorkflows -- Valid tools:', validTools)
  return validTools
}
