// src/app/api/allNewRoutingChat/route.ts

import { ChatBody } from '@/types/chat'
import { routeModelRequest } from '~/utils/streamProcessing'
import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { buildPrompt } from '~/app/utils/buildPromptUtils'
import { OpenAIError } from '~/utils/server'

export async function POST(req: NextRequest, res: NextResponse) {
  const startTime = Date.now()
  const { searchParams } = new URL(req.url)
  const summary = searchParams.get('summary') === 'true'

  const body = await req.json()

  const {
    conversation,
    // key,
    course_name,
    courseMetadata,
    // stream,
    // llmProviders,
  } = body as ChatBody

  let result;
  
  if (summary) {
    // Create a new conversation object for summarization of the latest assistant message
    const summaryConversation: Conversation = {
      ...conversation,
      messages: [
        {
          id: uuidv4(),
          role: 'system',
          latestSystemMessage: 'You are a helpful assistant that summarizes answers to questions. Summarize the answer within 3 sentences',
          content: conversation.messages
            .filter(msg => msg.role === 'assistant')
            .map(msg => msg.content)
            .join('\n\n'),
        },
      ],
    }
    result = await routeModelRequest(body as ChatBody)
  } else {
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

  try {
    const result = await routeModelRequest(body as ChatBody)

    const endTime = Date.now()
    const duration = endTime - startTime
    console.log(`Total duration: ${duration}ms`)

    return result
  } catch (error) {
    console.error('Error in chat route:', error)

    let errorMessage = 'An unexpected error occurred'
    let statusCode = 500

    if (error instanceof OpenAIError) {
      statusCode = parseInt(error.code || '500')
      errorMessage = error.message
    } else if (error instanceof Error) {
      errorMessage = error.message
    }

    return new Response(
      JSON.stringify({
        error: errorMessage,
        code: statusCode,
      }),
      {
        status: statusCode,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )
  }
}
