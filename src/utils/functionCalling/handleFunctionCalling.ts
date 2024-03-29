import { Conversation, Message } from '~/types/chat'

export default async function handleTools(
  message: Message,
  availableTools: OpenAICompatibleTool[],
  selectedConversation: Conversation,
  openaiKey: string,
) {
  console.log('Available tools in handleFunctionCalling: ', availableTools)
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
      return function_call
    } else {
      console.log('No response body.')
    }
  } catch (error) {
    console.error('Error calling openaiFunctionCall: ', error)
  }
  // TODO: return the updated message. This is a placeholder.
  // return message
}

// TODO: finalize this function calling
const callN8nFunction = async (
  function_call: any,
  selectedConversation: Conversation,
) => {
  const response = await fetch('http://localhost:8000/runWorkflow', {
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

// conform to the OpenAI function calling API
interface FormField {
  fieldLabel: string
  fieldType?: string
  requiredField?: boolean
}

interface FormNodeParameter {
  formFields: {
    values: FormField[]
  }
  formDescription: string
}

interface Node {
  id: string
  name: string
  parameters: FormNodeParameter
  type: string
}

interface WorkflowNode {
  id: string
  name: string
  type: string
  active: boolean
  nodes: Node[]
}

interface ExtractedParameter {
  type: 'string' | 'textarea' | 'number' | 'Date' | 'DropdownList'
  description: string
  enum?: string[]
}

export interface OpenAICompatibleTool {
  name: string
  description: string
  parameters: {
    type: 'object'
    properties: Record<string, ExtractedParameter>
    required: string[]
  }
}

export function getOpenAIFunctionsFromN8n(
  workflows: WorkflowNode[],
): OpenAICompatibleTool[] {
  const extractedObjects: OpenAICompatibleTool[] = []

  for (const workflow of workflows) {
    console.log('workflowGroup: ', workflow)

    // Only active workflows
    if (!workflow.active) continue

    // Must have a form trigger node!
    const formTriggerNode = workflow.nodes.find(
      (node) => node.type === 'n8n-nodes-base.formTrigger',
    )
    if (!formTriggerNode) continue

    const properties: Record<string, ExtractedParameter> = {}
    const required: string[] = []

    formTriggerNode.parameters.formFields.values.forEach((field) => {
      const key = field.fieldLabel.replace(/\s+/g, '_').toLowerCase() // Replace spaces with underscores and lowercase
      properties[key] = {
        type: field.fieldType === 'number' ? 'number' : 'string',
        description: field.fieldLabel,
      }

      if (field.requiredField) {
        required.push(key)
      }
    })

    extractedObjects.push({
      name: workflow.name.replace(/\s+/g, '_'),
      description: formTriggerNode.parameters.formDescription,
      parameters: {
        type: 'object',
        properties,
        required,
      },
    })
  }

  return extractedObjects
}

// Usage example:
// const extracted = extractParameters(giantJson);
// console.log(extracted);
