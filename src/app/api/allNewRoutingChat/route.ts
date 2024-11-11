import { CourseMetadata } from '~/types/courseMetadata'
import { getCourseMetadata } from '~/pages/api/UIUC-api/getCourseMetadata'
import {
  ChatBody,
  Content,
  ContextWithMetadata,
  Conversation,
  MessageType,
  OpenAIChatMessage,
  UIUCTool,
} from '@/types/chat'
import { NextApiRequest, NextApiResponse } from 'next'
import { AnySupportedModel } from '~/utils/modelProviders/LLMProvider'
import { DEFAULT_SYSTEM_PROMPT } from '@/utils/app/const'
import { routeModelRequest } from '~/utils/streamProcessing'
import { NextRequest, NextResponse } from 'next/server'

import { encodingForModel } from 'js-tiktoken'
import { buildPrompt, getSystemPostPrompt } from '~/app/utils/buildPromptUtils'

const encoding = encodingForModel('gpt-4o')

export async function POST(req: NextRequest, res: NextResponse) {
  const startTime = Date.now()

  const body = await req.json()

  const {
    conversation,
    key,
    course_name,
    courseMetadata,
    stream,
    llmProviders,
  } = body as ChatBody
  console.log('body in /api/chat', body)

  const buildPromptStartTime = Date.now()
  const newConversation = await buildPrompt({
    conversation,
    projectName: course_name,
    courseMetadata,
  })
  const buildPromptEndTime = Date.now()
  const buildPromptDuration = buildPromptEndTime - buildPromptStartTime
  console.log(`buildPrompt duration: ${buildPromptDuration}ms`)

  body.conversation = newConversation

  const result = await routeModelRequest(body as ChatBody)
  console.log('Result in /api/chat', result)

  const endTime = Date.now()
  const duration = endTime - startTime
  console.log(`Total duration: ${duration}ms`)

  return result.toTextStreamResponse()
}
