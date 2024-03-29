import { useQuery } from '@tanstack/react-query'
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

interface N8nWorkflow {
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
  workflows: N8nWorkflow[],
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

export const useFetchAllWorkflows = (
  course_name?: string,
  api_key?: string,
  limit = 10,
  pagination = 'true',
  full_details = false,
) => {
  if (!course_name && !api_key) {
    throw new Error('One of course_name OR api_key is required')
  }

  return useQuery({
    queryKey: ['tools', api_key],
    queryFn: async () => {
      if (isNaN(limit) || limit <= 0) {
        limit = 10
      }

      if (!api_key) {
        const response = await fetch(
          `/api/UIUC-api/tools/getN8nKeyFromProject?course_name=${course_name}`,
          {
            method: 'GET',
          },
        )
        if (!response.ok) {
          throw new Error('Network response was not ok')
        }
        api_key = await response.json()
        console.log('⚠️ API Key from getN8nAPIKey: ', api_key)
      }

      const parsedPagination = pagination.toLowerCase() === 'true'

      console.log('About to fetch workflows. Key:', api_key)

      const response = await fetch(
        `http://localhost:8000/getworkflows?api_key=${api_key}&limit=${limit}&pagination=${parsedPagination}`,
      )
      if (!response.ok) {
        // return res.status(response.status).json({ error: response.statusText })
        throw new Error(`Unable to fetch n8n tools. ${response.statusText}`)
      }

      const workflows = await response.json()
      if (full_details) return workflows[0]

      const openAIFunctions = getOpenAIFunctionsFromN8n(workflows[0])
      return openAIFunctions
    },
  })
}
