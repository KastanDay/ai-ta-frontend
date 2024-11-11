import { initializeEncoding } from '@/utils/encoding'
import { OpenAIError, OpenAIStream } from '@/utils/server'
import { ChatBody, Message } from '@/types/chat'
import { NextApiRequest, NextApiResponse } from 'next'

export const maxDuration = 60

export const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  // OpenAI's main chat endpoint
  try {
    // Ensure encoding is initialized before usage
    await initializeEncoding()

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' })
    }

    const {
      conversation,
      key,
      course_name,
      courseMetadata,
      stream,
      llmProviders,
    } = req.body as ChatBody

    if (!conversation) {
      console.error(
        'No conversation provided. It seems the `messages` array was empty.',
      )
      return res.status(400).json({
        error:
          'No conversation provided. It seems the `messages` array was empty.',
      })
    }

    const messagesToSend = convertConversationToOpenAIMessages(
      conversation.messages,
    )

    // Get the latest system message
    const latestSystemMessage =
      conversation.messages[conversation.messages.length - 1]
        ?.latestSystemMessage

    if (!latestSystemMessage) {
      console.error('No system message found in the conversation.')
      return res.status(400).json({
        error: 'No system message found in the conversation.',
      })
    }

    const apiStream = await OpenAIStream(
      conversation.model,
      latestSystemMessage,
      conversation.temperature,
      llmProviders!,
      // openAIKey,
      // @ts-ignore -- I think the types are fine.
      messagesToSend, //old: conversation.messages
      stream,
    )

    if (stream) {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      })

      for await (const chunk of apiStream) {
        res.write(chunk)
      }

      res.end()
    } else {
      return new Response(JSON.stringify(apiStream))
    }
  } catch (error) {
    if (error instanceof OpenAIError) {
      const { name, message } = error
      console.error('OpenAI Completion Error', message)
      res.status(400).json({
        statusCode: 400,
        name: name,
        message: message,
      })
    } else {
      console.error('Unexpected Error', error)
      res
        .status(500)
        .json({ name: 'Error', message: 'An unexpected error occurred' })
    }
  }
}

const convertConversationToOpenAIMessages = (
  messages: Message[],
): Message[] => {
  return messages.map((message, messageIndex) => {
    const strippedMessage = { ...message }
    // When content is an array
    if (Array.isArray(strippedMessage.content)) {
      strippedMessage.content.map((content, contentIndex) => {
        // Convert tool_image_url to image_url for OpenAI
        if (content.type === 'tool_image_url') {
          content.type = 'image_url'
        }
        // Add final prompt to last message
        if (
          content.type === 'text' &&
          messageIndex === messages.length - 1 &&
          !content.text?.startsWith('Image description:')
        ) {
          console.debug('Replacing the text: ', content.text)
          content.text = strippedMessage.finalPromtEngineeredMessage
        }
        return content
      })
    } else {
      // When content is a string
      // Add final prompt to last message
      if (messageIndex === messages.length - 1) {
        if (strippedMessage.role === 'user') {
          strippedMessage.content = [
            {
              type: 'text',
              text: strippedMessage.finalPromtEngineeredMessage,
            },
          ]
        } else if (strippedMessage.role === 'system') {
          strippedMessage.content = [
            {
              type: 'text',
              text: strippedMessage.latestSystemMessage,
            },
          ]
        }
      }
    }
    delete strippedMessage.finalPromtEngineeredMessage
    delete strippedMessage.latestSystemMessage
    delete strippedMessage.contexts
    delete strippedMessage.tools
    delete strippedMessage.feedback
    return strippedMessage
  })
}

export default handler
