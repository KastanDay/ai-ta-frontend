import { useQuery } from '@tanstack/react-query'
import { Dispatch } from 'react'
import { Conversation, Message } from '~/types/chat'
import { ActionType } from '@/hooks/useCreateReducer'
import { HomeInitialState } from '~/pages/api/home/home.state'
import { ChatCompletionMessageToolCall } from 'openai/resources/chat/completions'
import { N8NParameter, N8nWorkflow, OpenAICompatibleTool } from '~/types/tools'
import { UIUCTool } from '~/types/chat'
import { uploadToS3 } from '../apiUtils'

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
      console.error(
        'in HandleTools -- Error calling openaiFunctionCall: ',
        response,
      )
      homeDispatch({ field: 'isRouting', value: false })
      return
    }
    const openaiResponse: ChatCompletionMessageToolCall[] =
      await response.json()
    console.log('OpenAI tools to run: ', openaiResponse)
    // map tool into UIUCTool, parse arguments
    const uiucToolsToRun = openaiResponse.map((openaiTool) => {
      const uiucTool = availableTools.find(
        (availableTool) => availableTool.name === openaiTool.function.name,
      ) as UIUCTool
      uiucTool.aiGeneratedArgumentValues = JSON.parse(
        openaiTool.function.arguments,
      )
      return uiucTool
    })
    console.log('UIUC tools to run: ', uiucToolsToRun)

    // Update conversation with tools & arguments (for fast UI), then we'll actually call the tools below
    homeDispatch({ field: 'isRouting', value: false })
    message.tools = [...uiucToolsToRun]
    selectedConversation.messages[currentMessageIndex] = message
    homeDispatch({
      field: 'selectedConversation',
      value: selectedConversation,
    })

    if (uiucToolsToRun.length > 0) {
      // Tool calling in Parallel here!!
      const toolResultsPromises = uiucToolsToRun.map(async (tool) => {
        try {
          const toolOutput = await callN8nFunction(tool, 'todo!') // TODO: Get API key
          handleToolOutput(toolOutput, tool)
        } catch (error: unknown) {
          console.error(
            `Error running tool: ${error instanceof Error ? error.message : error}`,
          )
          tool.error = `Error running tool: ${error instanceof Error ? error.message : error}`
          // tool.output = { text: `Error running tool: ${error instanceof Error ? error.message : error}` };
        }
        // update message with tool output, but don't add another tool.
        selectedConversation.messages[currentMessageIndex]!.tools!.find(
          (t) => t.readableName === tool.readableName,
        )!.output = tool.output

        selectedConversation.messages[currentMessageIndex] = message
        homeDispatch({
          field: 'selectedConversation',
          value: selectedConversation,
        })
      })
      await Promise.all(toolResultsPromises)

      return null
    }
  } catch (error) {
    console.error('Error calling openaiFunctionCall: ', error)
  }
}

const handleToolOutput = async (toolOutput: any, tool: UIUCTool) => {
  console.debug('Handling tool output: ', toolOutput)
  // Handle case where toolOutput is a simple string
  if (typeof toolOutput === 'string') {
    tool.output = { text: toolOutput }
  }
  else if (typeof toolOutput === 'object') {
    tool.output = { data: toolOutput }
  }
  // Handle case where toolOutput contains image URLs
  else if (toolOutput?.imageUrls && Array.isArray(toolOutput?.imageUrls)) {
    tool.output = { imageUrls: toolOutput.imageUrls }
  }
  // Handle case where toolOutput is a single Blob object (binary data)
  else if (toolOutput?.data instanceof Blob) {
    const s3Key = (await uploadToS3(toolOutput?.data, tool.name)) as string
    tool.output = { s3Paths: [s3Key] }
  }
  // Handle case where toolOutput is an array of Blob objects
  else if (
    Array.isArray(toolOutput) &&
    toolOutput.every((item: any) => item instanceof Blob)
  ) {
    const s3KeysPromises = toolOutput.map(async (blob: Blob) => {
      const file = new File([blob], 'filename', {
        type: blob.type,
        lastModified: Date.now(),
      })
      return uploadToS3(file, tool.name)
    })
    const s3Keys = (await Promise.all(s3KeysPromises)) as string[]
    tool.output = { s3Paths: s3Keys }
  } else if (tool.output && Array.isArray(toolOutput)) {
    tool.output.data = toolOutput.reduce((acc, cur) => ({ ...acc, ...cur }), {})
  }
  // Default case: directly assign toolOutput to tool.output
  else {
    tool.output = { data: toolOutput }
  }
}

// TODO: finalize this function calling
const callN8nFunction = async (tool: UIUCTool, n8n_api_key: string) => {
  console.log('Calling n8n function with data: ', tool)

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 25000)

  const body = JSON.stringify({
    api_key:
      'n8n_api_e46b54038db2eb82e2b86f2f7f153a48141113113f38294022f495774612bb4319a4670e68e6d0e6',
    name: tool.readableName,
    data: tool.aiGeneratedArgumentValues,
  })

  console.log('Calling n8n function with body: ', body)
  const timeStart = Date.now()
  const response: Response = await fetch(
    `https://flask-production-751b.up.railway.app/run_flow`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: body,
      signal: controller.signal,
    },
  ).catch((error) => {
    if (error.name === 'AbortError') {
      throw new Error('Request timed out after 15 seconds, try "Regenerate Response" button')
    }
    throw error
  })
  const timeEnd = Date.now()
  console.log('Time taken for n8n function call: ', timeEnd - timeStart)

  clearTimeout(timeoutId)
  if (!response.ok) {
    const errjson = await response.json()
    console.error('Error calling n8n function: ', errjson.error)
    throw new Error(errjson.error)
  }

  // Parse final answer from n8n workflow object
  const n8nResponse = await response.json()
  const resultData = n8nResponse.data.resultData
  console.debug('N8n results data: ', resultData)
  const finalNodeType = resultData.lastNodeExecuted

  // Check for N8N tool error, like invalid auth
  if (resultData.runData[finalNodeType][0]['error']) {
    console.error(
      'N8N tool error: ',
      resultData.runData[finalNodeType][0]['error'],
    )
    const err = resultData.runData[finalNodeType][0]['error']
    throw new Error(err.message)
  }

  // I used to have ['data'] at the end, but sometimes it's only 'response' not 'data'
  if (!resultData.runData[finalNodeType][0].data || !resultData.runData[finalNodeType][0].data.main[0][0].json) {
    console.error('Tool executed successfully, but we got an empty response!')
    throw new Error('Tool executed successfully, but we got an empty response!')
  }
  if (resultData.runData[finalNodeType][0].data.main[0][0].json['data']) {
    return resultData.runData[finalNodeType][0].data.main[0][0].json['data']
    // } else if (
    //   resultData.runData[finalNodeType][0].data.main[0][0].json['response']
    // ) {
    //   return resultData.runData[finalNodeType][0].data.main[0][0].json['response']
  } else {
    console.log("Just the json here: ", resultData.runData[finalNodeType][0].data.main[0][0].json)
    return resultData.runData[finalNodeType][0].data.main[0][0].json
  }
  // Old:
  // return resultData.runData[finalNodeType][0].data.main[0][0].json['data']
}

export function getOpenAIToolFromUIUCTool(
  tools: UIUCTool[],
): OpenAICompatibleTool[] {
  return tools.map((tool) => {
    return {
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputParameters
          ? {
            type: 'object',
            properties: Object.keys(tool.inputParameters.properties).reduce(
              (acc, key) => {
                const param = tool.inputParameters?.properties[key]
                acc[key] = {
                  type:
                    param?.type === 'number'
                      ? 'number'
                      : param?.type === 'Boolean'
                        ? 'Boolean'
                        : 'string',
                  description: param?.description,
                  enum: param?.enum,
                }
                return acc
              },
              {} as {
                [key: string]: {
                  type: 'string' | 'number' | 'Boolean'
                  description?: string
                  enum?: string[]
                }
              },
            ),
            required: tool.inputParameters.required,
          }
          : undefined,
      },
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

    const properties: Record<string, N8NParameter> = {}
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
      inputParameters:
        Object.keys(parameters).length > 0 ? parameters : undefined,
    })
  }

  return extractedObjects
}

export const useFetchAllWorkflows = (
  course_name?: string,
  api_key?: string,
  limit = 20,
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
