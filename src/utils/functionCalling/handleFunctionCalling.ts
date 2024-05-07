import { useQuery } from '@tanstack/react-query'
import { Dispatch } from 'react'
import { Conversation, Message } from '~/types/chat'
import { ActionType } from '@/hooks/useCreateReducer'
import { HomeInitialState } from '~/pages/api/home/home.state'

export default async function handleTools(
  message: Message,
  availableTools: OpenAICompatibleTool[],
  imageUrls: string[],
  imageDescription: string,
  selectedConversation: Conversation,
  openaiKey: string,
  homeDispatch: Dispatch<ActionType<HomeInitialState>>,
) {
  // TODO: Use imageURLs and imageDescription to call the appropriate tool
  console.log('Available tools in handleFunctionCalling: ', availableTools)
  try {
    homeDispatch({ field: 'isRouting', value: true })

    const response = await fetch('/api/chat/openaiFunctionCall', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversation: selectedConversation,
        tools: availableTools,
        imageUrls: imageUrls,
        imageDescription: imageDescription,
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

      homeDispatch({ field: 'isRouting', value: false })
      // homeDispatch({ field: 'isPestDetectionLoading', value: false })

      // Add back the original name, for matching in N8N interface.
      function_call.readableName = function_call.name.replace(/_/g, ' ')
      console.log('Function call from openaiFunctionCall: ', function_call)

      homeDispatch({
        field: 'routingResponse',
        // value: JSON.stringify(function_call, null, 2),
        value: `${function_call.readableName}\nArguments: ${JSON.stringify(function_call.arguments)}`,
      })

      // TODO: Do tool calling here!!
      if (function_call) {
        homeDispatch({ field: 'isPestDetectionLoading', value: true })
        const response = await callN8nFunction(function_call, 'todo!') // TODO: Get API key
        homeDispatch({ field: 'isPestDetectionLoading', value: false })
        return response
      }
    } else {
      console.debug('HandleTools routing response missing - No response body.')
    }
  } catch (error) {
    console.error('Error calling openaiFunctionCall: ', error)
  }
}

// TODO: finalize this function calling
const callN8nFunction = async (function_call: any, n8n_api_key: string) => {
  console.log('Calling n8n function with data: ', function_call)

  const response = await fetch(`${process.env.RAILWAY_URL}/run_flow`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      api_key:
        'n8n_api_e46b54038db2eb82e2b86f2f7f153a48141113113f38294022f495774612bb4319a4670e68e6d0e6',
      name: function_call.readableName,
      data: function_call.arguments,
    }),
  })
  if (!response.ok) {
    console.error('Error calling n8n function: ', response)
    throw new Error(`Error calling n8n function. Status: ${response.status}`)
  }

  // Parse final answer from n8n workflow object
  const data = await response.json()
  console.log('N8n function response: ', data)
  const resultData = data[0].data.resultData
  const finalNodeType = resultData.lastNodeExecuted
  console.log('N8n final node type: ', finalNodeType)
  const finalResponse =
    resultData.runData[finalNodeType][0].data.main[0][0].json
  console.log('N8n final response: ', finalResponse)
  // N8n final response: {Search result: 'No agriculture info available (hard coded testing response).'}

  return finalResponse
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
  readableName: string
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
      readableName: workflow.name,
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
        `${process.env.RAILWAY_URL}/getworkflows?api_key=${api_key}&limit=${limit}&pagination=${parsedPagination}`,
      )
      if (!response.ok) {
        // return res.status(response.status).json({ error: response.statusText })
        throw new Error(`Unable to fetch n8n tools: ${response.statusText}`)
      }

      const workflows = await response.json()
      if (full_details) return workflows[0]

      const openAIFunctions = getOpenAIFunctionsFromN8n(workflows[0])
      console.log('All OpenAI Functions: ', openAIFunctions)
      return openAIFunctions
    },
  })
}
