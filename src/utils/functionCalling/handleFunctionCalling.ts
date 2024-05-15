import { useQuery } from '@tanstack/react-query'
import { Dispatch } from 'react'
import { Conversation, Message } from '~/types/chat'
import { ActionType } from '@/hooks/useCreateReducer'
import { HomeInitialState } from '~/pages/api/home/home.state'

// TODO: move this to the backend so it's in the API!!

export interface RoutingResponse {
  toolName: string
  arguments: JSON
}

export default async function handleTools(
  message: Message,
  availableTools: UIUCTool[],
  imageUrls: string[],
  imageDescription: string,
  selectedConversation: Conversation,
  currentMessageIndex: number,
  openaiKey: string,
  homeDispatch: Dispatch<ActionType<HomeInitialState>>,
) {
  // TODO: Use imageURLs and imageDescription to call the appropriate tool
  console.log('Available tools in handleFunctionCalling: ', availableTools)
  try {
    homeDispatch({ field: 'isRouting', value: true })

    // Convert UIUCTool to OpenAICompatibleTool
    const openAITools = getOpenAIToolFromUIUCTool(availableTools)
    console.log('OpenAI compatible tools (handle tools): ', openAITools)

    const response = await fetch('/api/chat/openaiFunctionCall', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversation: selectedConversation,
        tools: openAITools,
        imageUrls: imageUrls,
        imageDescription: imageDescription,
        openaiKey: openaiKey,
      }),
    })
    if (!response.ok) {
      // print error message
      console.error('Error calling openaiFunctionCall: ', response)
    }

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
        // value: `${function_call.readableName}\nArguments: ${JSON.stringify(function_call.arguments)}`,
        value: [
          {
            toolName: function_call.readableName,
            arguments: function_call.arguments,
          },
        ],
      })

      // Do tool calling here!!
      if (function_call) {
        homeDispatch({ field: 'isRunningTool', value: true })
        const toolResult = await callN8nFunction(function_call, 'todo!') // TODO: Get API key

        homeDispatch({ field: 'isRunningTool', value: false })

        // Get UIUCTool from openAI function call name
        const uiucTool = availableTools.find(
          (tool) => tool.name === function_call.name,
        )

        // Add tool result to messages
        if (message.tools) {
          message.tools.push({
            toolResult: JSON.stringify(toolResult),
            tool: uiucTool,
          })
        } else {
          message.tools = [
            { toolResult: JSON.stringify(toolResult), tool: uiucTool },
          ]
        }
        selectedConversation.messages[currentMessageIndex] = message
        homeDispatch({
          field: 'selectedConversation',
          value: selectedConversation,
        })

        return toolResult
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

  const response = await fetch(
    `https://flask-production-751b.up.railway.app/run_flow`,
    {
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
    },
  )
  if (!response.ok) {
    console.error('Error calling n8n function: ', response)
    throw new Error(`Error calling n8n function. Status: ${response.status}`)
  }

  // Parse final answer from n8n workflow object
  const n8nResponse = await response.json()
  console.log('N8n function response: ', n8nResponse)
  // const resultData = data[0].data.resultData
  const resultData = n8nResponse.data.resultData
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

export interface N8nWorkflow {
  id: string
  name: string
  type: string
  active: boolean
  nodes: Node[]
  createdAt: string
  updatedAt: string
}

interface Parameter {
  type: 'string' | 'textarea' | 'number' | 'Date' | 'DropdownList'
  description: string
  enum?: string[]
}

export interface OpenAICompatibleTool {
  name: string
  readableName: string
  description: string
  parameters?: {
    type: 'object'
    properties: Record<string, Parameter>
    required: string[]
  }
}

// TODO: Refine type here, use in chat.tsx
// name: string
// enabled: boolean
// course_name: string
// doc_count: number
export interface UIUCTool {
  id: string
  name: string
  readableName: string
  description: string
  parameters?: {
    type: 'object'
    properties: Record<string, Parameter>
    required: string[]
  }
  courseName?: string
  enabled?: boolean
  createdAt?: string
  updatedAt?: string
}

export function getOpenAIToolFromUIUCTool(
  tools: UIUCTool[],
): OpenAICompatibleTool[] {
  return tools.map((tool) => {
    return {
      id: tool.name,
      name: tool.name,
      readableName: tool.readableName,
      description: tool.description,
      parameters: tool.parameters
        ? {
            type: 'object',
            properties: tool.parameters.properties,
            required: tool.parameters.required,
          }
        : undefined,
    }
  })
}

export function getUIUCToolFromN8n(workflows: N8nWorkflow[]): UIUCTool[] {
  const extractedObjects: UIUCTool[] = []

  for (const workflow of workflows) {
    // Only active workflows
    if (!workflow.active) continue

    // Must have a form trigger node!
    const formTriggerNode = workflow.nodes.find(
      (node) => node.type === 'n8n-nodes-base.formTrigger',
    )
    if (!formTriggerNode) continue

    const properties: Record<string, Parameter> = {}
    const required: string[] = []
    let parameters = {}

    if (formTriggerNode.parameters.formFields) {
      formTriggerNode.parameters.formFields.values.forEach((field) => {
        const key = field.fieldLabel.replace(/\s+/g, '_').toLowerCase() // Replace spaces with underscores and lowercase
        properties[key] = {
          type: field.fieldType === 'number' ? 'number' : 'string',
          description: field.fieldLabel,
        }

        if (field.requiredField) {
          required.push(key)
        }
        parameters = {
          type: 'object',
          properties,
          required,
        }
      })
    }

    console.log('Extracted workflow: ', workflow)
    console.log('Extracted workflow.createdAt: ', workflow.createdAt)

    extractedObjects.push({
      id: workflow.id,
      name: workflow.name.replace(/\s+/g, '_'),
      readableName: workflow.name,
      description: formTriggerNode.parameters.formDescription,
      updatedAt: workflow.updatedAt,
      createdAt: workflow.createdAt,
      // @ts-ignore -- can't get the 'only add if non-zero' to work nicely. It's fine.
      parameters: Object.keys(parameters).length > 0 ? parameters : undefined,
    })
  }

  return extractedObjects
}

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
    queryFn: async (): Promise<UIUCTool[]> => {
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

      //! console.log("Railway url: ", process.env.RAILWAY_URL) // undefined !!!

      const response = await fetch(
        `https://flask-production-751b.up.railway.app/getworkflows?api_key=${api_key}&limit=${limit}&pagination=${parsedPagination}`,
      )
      if (!response.ok) {
        // return res.status(response.status).json({ error: response.statusText })
        throw new Error(`Unable to fetch n8n tools: ${response.statusText}`)
      }

      const workflows = await response.json()
      if (full_details) return workflows[0]

      const uiucTools = getUIUCToolFromN8n(workflows[0])
      console.log('All uiuc tools: ', uiucTools)
      return uiucTools
    },
  })
}
