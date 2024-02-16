// src/pages/api/UIUC-api/fetchRoutingResponse.ts

import { ChatBody, Content, Conversation, Message } from '@/types/chat'

export const config = {
  runtime: 'edge',
}

/**
 * Asynchronously fetches routing response for images and user questions contained within a message.
 * @param {Message} message - The message object containing potential image content.
 * @param {string} course_name - The name of the course for context.
 * @param {string} endpoint - The API endpoint to which the POST request is sent.
 * @param {Conversation} updatedConversation - The updated conversation object.
 * @param {string} apiKey - The API key for authorization.
 * @param {AbortController} controller - The controller to abort the fetch request if necessary.
 * @returns {Promise<string>} A promise that resolves to the image description.
 */
export const fetchRoutingResponse = async (
  message: Message,
  course_name: string,
  endpoint: string,
  updatedConversation: Conversation,
  apiKey: string,
  controller: AbortController,
): Promise<string> => {
  // Filter out the image content from the message
  const imageContent = (message.content as Content[]).filter(
    (content) => content.type === 'image_url',
  )
  // Filter out user question from the message
  const question = (message.content as Content[])
    .filter((content) => content.type === 'text')
    .map((q) => q.text)
    .join(' ')

  // If there are no images, return an empty string
  if (imageContent.length === 0) {
    return ''
  }

  // For future use to add more tools/classes, we can make a DB call to get the allowed tools/classes for the course and use them in the prompt

  // Construct the body for the chat API request
  const chatBody: ChatBody = {
    model: updatedConversation.model,
    messages: [
      {
        ...message,
        role: 'user',
        content: [
          ...imageContent,
          {
            type: 'text',
            text: `Given the user question and images, classify the request as either being about \`Pests\`, or \`Other\`.
						Do not respond with more than one word.
						These categories will be used to route the request to the appropriate tool. So, even if the user doesn't explicitly asks about a specific category but the intent is clear, please classify the request accordingly.
						<question>
						${question}
						</question>
						Classification:`,
          },
        ],
      },
    ],
    key: apiKey,
    prompt: '',
    temperature: 0.1,
    course_name: course_name,
    stream: false,
    isImage: true,
  }

  try {
    // Send the POST request to the API endpoint
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chatBody),
      signal: controller.signal,
    })

    // If the response is not ok, throw an error with the message from the response
    if (!response.ok) {
      const errorResponse = await response.json()
      throw new Error(errorResponse.message)
    }

    // Parse the JSON response and return the image description
    const data = await response.json()
    return data.choices[0].message.content || ''
  } catch (error) {
    // Log the error to the console and abort the fetch request
    console.error('Error fetching image description:', error)
    controller.abort()

    // Re-throw the error to be handled by the caller
    throw error
  }
}
