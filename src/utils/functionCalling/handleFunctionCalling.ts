import { useQuery } from '@tanstack/react-query'
import { Dispatch } from 'react'
import { Conversation, Message } from '~/types/chat'
import { ActionType } from '@/hooks/useCreateReducer'
import { HomeInitialState } from '~/pages/api/home/home.state'
import { ChatCompletionMessageToolCall } from 'openai/resources/chat/completions'
import { N8NParameter, N8nWorkflow, OpenAICompatibleTool } from '~/types/tools'
import { UIUCTool } from '~/types/chat'
import type { ToolOutput } from '~/types/chat'
import posthog from 'posthog-js'

export async function handleToolsServer(
  message: Message,
  availableTools: UIUCTool[],
  imageUrls: string[],
  imageDescription: string,
  selectedConversation: Conversation,
  openaiKey: string,
  projectName: string,
  base_url?: string,
) {
  try {
    // Convert UIUCTool to OpenAICompatibleTool
    const openAITools = getOpenAIToolFromUIUCTool(availableTools)
    // console.log('OpenAI compatible tools (handle tools): ', openAITools)
    console.log('OpenAI compatible tools (handle tools): ', openaiKey)

    const response = await fetch(`${base_url}/api/chat/openaiFunctionCall`, {
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
      console.error('Error calling openaiFunctionCall: ', response)
      return
    }
    const openaiFunctionCallResponse = await response.json()

    //Todo: Is there a better way to handle this? Generic messages for errors? Enum for message and status?
    if (openaiFunctionCallResponse.message === 'No tools invoked by OpenAI') {
      console.error('No tools invoked by OpenAI')
      return
    }

    const openaiResponse: ChatCompletionMessageToolCall[] =
      openaiFunctionCallResponse

    console.log('OpenAI tools to run: ', openaiResponse)

    // Map tool into UIUCTool, parse arguments
    const uiucToolsToRun = openaiResponse.map((openaiTool) => {
      const uiucTool = availableTools.find(
        (availableTool) => availableTool.name === openaiTool.function.name,
      ) as UIUCTool
      uiucTool.aiGeneratedArgumentValues = JSON.parse(
        openaiTool.function.arguments,
      )
      return uiucTool
    })
    message.tools = [...uiucToolsToRun]
    selectedConversation.messages[selectedConversation.messages.length - 1] =
      message
    console.log('UIUC tools to run: ', uiucToolsToRun)

    if (uiucToolsToRun.length > 0) {
      // Tool calling in Parallel here!!
      const toolResultsPromises = uiucToolsToRun.map(async (tool) => {
        try {
          const toolOutput = await callN8nFunction(
            tool,
            projectName,
            undefined,
            base_url,
          )
          tool.output = toolOutput
        } catch (error: unknown) {
          console.error(
            `Error running tool: ${error instanceof Error ? error.message : error}`,
          )
          tool.error = `Error running tool: ${error instanceof Error ? error.message : error}`
        }
        // update message with tool output, but don't add another tool.
        selectedConversation.messages[
          selectedConversation.messages.length - 1
        ]!.tools!.find((t) => t.readableName === tool.readableName)!.output =
          tool.output
        selectedConversation.messages[
          selectedConversation.messages.length - 1
        ] = message
      })
      await Promise.all(toolResultsPromises)
    }
    console.log(
      'tool outputs:',
      selectedConversation.messages[selectedConversation.messages.length - 1]!
        .tools,
    )
    return selectedConversation
  } catch (error) {
    console.error(
      'Error calling openaiFunctionCall from handleToolsServer: ',
      error,
    )
  }
}

export default async function handleTools(
  message: Message,
  availableTools: UIUCTool[],
  imageUrls: string[],
  imageDescription: string,
  selectedConversation: Conversation,
  currentMessageIndex: number,
  openaiKey: string,
  projectName: string,
  homeDispatch: Dispatch<ActionType<HomeInitialState>>,
) {
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
          const toolOutput = await callN8nFunction(tool, projectName, undefined)
          tool.output = toolOutput
        } catch (error: unknown) {
          console.error(
            `Error running tool: ${error instanceof Error ? error.message : error}`,
          )
          tool.error = `Error running tool: ${error instanceof Error ? error.message : error}`
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
    console.error('Error calling openaiFunctionCall from handleTools: ', error)
  }
}

const callN8nFunction = async (
  tool: UIUCTool,
  projectName: string,
  n8n_api_key: string | undefined,
  base_url?: string,
): Promise<ToolOutput> => {
  console.debug('Calling n8n function with data: ', tool)

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 20000)

  // get n8n api key per project
  if (!n8n_api_key) {
    const url = base_url
      ? `${base_url}/api/UIUC-api/tools/getN8nKeyFromProject?course_name=${projectName}`
      : `/api/UIUC-api/tools/getN8nKeyFromProject?course_name=${projectName}`

    const response = await fetch(url, {
      method: 'GET',
    })
    if (!response.ok) {
      throw new Error(
        'Unable to fetch current N8N API Key; the network response was not ok.',
      )
    }
    n8n_api_key = await response.json()
  }

  // Run tool
  const body = JSON.stringify({
    api_key: n8n_api_key,
    name: tool.readableName,
    data: tool.aiGeneratedArgumentValues,
  })

  console.debug('Calling n8n function with body: ', body)
  const timeStart = Date.now()
  const response: Response = await fetch(
    `https://flask-production-751b.up.railway.app/run_flow`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      body: body,
      signal: controller.signal,
    },
  ).catch((error) => {
    if (error.name === 'AbortError') {
      throw new Error(
        'Request timed out after 15 seconds, try "Regenerate Response" button',
      )
    }
    throw error
  })
  const timeEnd = Date.now()
  console.debug(
    'Time taken for n8n function call: ',
    (timeEnd - timeStart) / 1000,
    'seconds',
  )

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

    posthog.capture('tool_error', {
      course_name: projectName,
      readableToolName: tool.readableName,
      toolDescription: tool.description,
      secondsToRunTool: (timeEnd - timeStart) / 1000,
      toolInputs: tool.inputParameters,
      toolError: err,
    })
    throw new Error(err.message)
  }

  // -- PARSE TOOL OUTPUT --

  // ERROR
  if (
    !resultData.runData[finalNodeType][0].data ||
    !resultData.runData[finalNodeType][0].data.main[0][0].json
  ) {
    posthog.capture('tool_error_empty_response', {
      course_name: projectName,
      readableToolName: tool.readableName,
      toolDescription: tool.description,
      secondsToRunTool: (timeEnd - timeStart) / 1000,
      toolInputs: tool.inputParameters,
      toolError: 'Tool executed successfully, but we got an empty response!',
    })

    console.error('Tool executed successfully, but we got an empty response!')
    throw new Error('Tool executed successfully, but we got an empty response!')
  }

  let toolOutput: ToolOutput
  if (resultData.runData[finalNodeType][0].data.main[0][0].json['data']) {
    // JSON data output
    toolOutput = {
      data: resultData.runData[finalNodeType][0].data.main[0][0].json['data'],
    }
  } else if (
    resultData.runData[finalNodeType][0].data.main[0][0].json['response'] &&
    Object.keys(resultData.runData[finalNodeType][0].data.main[0][0].json)
      .length === 1
  ) {
    // If there's ONLY 'response' key, return that
    toolOutput = {
      text: resultData.runData[finalNodeType][0].data.main[0][0].json[
        'response'
      ],
    }
  } else {
    // Fallback to JSON output
    toolOutput = {
      data: resultData.runData[finalNodeType][0].data.main[0][0].json,
    }
  }

  // Check for images, add that field (can be used in combination with all other outputs)
  if (
    resultData.runData[finalNodeType][0].data.main[0][0].json['image_urls'] &&
    Object.keys(resultData.runData[finalNodeType][0].data.main[0][0].json)
      .length === 1
  ) {
    // If there's ONLY 'img_urls' key, return that
    toolOutput = {
      imageUrls:
        resultData.runData[finalNodeType][0].data.main[0][0].json['image_urls'],
    }
  } else if (
    resultData.runData[finalNodeType][0].data.main[0][0].json['image_urls']
  ) {
    // There's Image URLs AND other data. Keep both.
    toolOutput = {
      ...toolOutput,
      imageUrls:
        resultData.runData[finalNodeType][0].data.main[0][0].json['image_urls'],
    }
  }

  posthog.capture('tool_invoked', {
    course_name: projectName,
    readableToolName: tool.readableName,
    toolDescription: tool.description,
    secondsToRunTool: (timeEnd - timeStart) / 1000,
    toolInputs: tool.inputParameters,
    toolOutput: toolOutput,
  })
  return toolOutput
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

    extractedObjects.push({
      id: workflow.id,
      name: workflow.name.replace(/[^a-zA-Z0-9_-]/g, '_'),
      readableName: workflow.name,
      description: formTriggerNode.parameters.formDescription,
      updatedAt: workflow.updatedAt,
      createdAt: workflow.createdAt,
      enabled: workflow.active,
      // @ts-ignore -- can't get the 'only add if non-zero' to work nicely. It's fine.
      inputParameters:
        Object.keys(parameters).length > 0 ? parameters : undefined,
    })
  }

  return extractedObjects
}

export async function fetchTools(
  course_name: string,
  api_key: string,
  limit: number,
  pagination: string,
  full_details: boolean,
  base_url?: string,
) {
  if (isNaN(limit) || limit <= 0) {
    limit = 10
  }

  if (!api_key) {
    const response = await fetch(
      `${base_url ? base_url : ''}/api/UIUC-api/tools/getN8nKeyFromProject?course_name=${course_name}`,
      {
        method: 'GET',
      },
    )
    if (!response.ok) {
      throw new Error('Network response was not ok')
    }
    api_key = await response.json()
  }

  const parsedPagination = pagination.toLowerCase() === 'true'

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
  return uiucTools
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
    queryFn: async (): Promise<UIUCTool[]> =>
      fetchTools(course_name!, api_key!, limit, pagination, full_details),
  })
}
