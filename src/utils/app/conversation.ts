// @utils/app/conversation
import { Conversation } from '@/types/chat'
import posthog from 'posthog-js'

export const updateConversation = (
  updatedConversation: Conversation,
  allConversations: Conversation[],
) => {
  const updatedConversations = allConversations.map((c) => {
    if (c.id === updatedConversation.id) {
      return updatedConversation
    }

    return c
  })

  // Save conversations to server instead of local storage
  saveConversationToServer(updatedConversation).catch((error) => {
    console.error('Error saving updated conversation to server:', error)
  })

  return {
    single: updatedConversation,
    all: updatedConversations,
  }
}

export const saveConversation = (conversation: Conversation) => {
  /*
  Save convo to local storage. If storage is full, clear the oldest conversation and try again.
  */
  let successful = false
  while (!successful) {
    try {
      localStorage.setItem('selectedConversation', JSON.stringify(conversation))
      successful = true // Set to false if setItem succeeds
    } catch (e) {
      console.debug(
        'Error saving conversation history. Clearing storage, then trying again. Error:',
        e,
      )
      posthog.capture('local_storage_full', {
        course_name:
          conversation.messages?.[0]?.contexts?.[0]?.course_name ||
          'Unknown Course',
        user_email: conversation.userEmail,
        inSaveConversation: true,
      })

      clearSingleOldestConversation() // Attempt to clear a bit of storage and try again
    }
  }
}

const clearSingleOldestConversation = () => {
  console.debug('CLEARING OLDEST CONVERSATIONS to free space in local storage.')

  const existingConversations = JSON.parse(
    localStorage.getItem('conversationHistory') || '[]',
  )

  // let existingConversations = JSON.parse(localStorage.getItem('conversationHistory') || '[]');
  while (existingConversations.length > 0) {
    existingConversations.shift() // Remove the oldest conversation
    try {
      localStorage.setItem(
        'conversationHistory',
        JSON.stringify(existingConversations),
      )
      break // Exit loop if setItem succeeds
    } catch (error) {
      continue // Try removing another conversation
    }
  }
}

export const saveConversations = (conversations: Conversation[]) => {
  /*
  Note: This function is a workaround for the issue where localStorage is full and cannot save new conversation history.
  TODO: show a modal/pop-up asking user to export them before it gets deleted?
  */

  try {
    localStorage.setItem('conversationHistory', JSON.stringify(conversations))
  } catch (e) {
    posthog.capture('local_storage_full', {
      course_name:
        conversations?.slice(-1)[0]?.messages?.[0]?.contexts?.[0]
          ?.course_name || 'Unknown Course',
      user_email: conversations?.slice(-1)[0]?.userEmail || 'Unknown Email',
      inSaveConversations: true,
    })

    const existingConversations = JSON.parse(
      localStorage.getItem('conversationHistory') || '[]',
    )
    while (
      existingConversations.length > 0 &&
      e instanceof DOMException &&
      e.code === 22
    ) {
      existingConversations.shift() // Remove the oldest conversation
      try {
        localStorage.setItem(
          'conversationHistory',
          JSON.stringify(existingConversations),
        )
        e = null // Clear the error since space has been freed
      } catch (error) {
        e = error // Update the error if it fails again
        continue // Try removing another conversation
      }
    }
    if (
      existingConversations.length === 0 &&
      e instanceof DOMException &&
      e.code === 22
    ) {
      console.error(
        'Failed to free enough space to save new conversation history.',
      )
    }
  }
}

// Old method without error handling
// export const saveConversations = (conversations: Conversation[]) => {
//   try {
//     localStorage.setItem('conversationHistory', JSON.stringify(conversations))
//   } catch (e) {
//     console.error(
//       'Error saving conversation history. Clearing storage, then setting convo. Error:',
//       e,
//     )
//     localStorage.setItem('conversationHistory', JSON.stringify(conversations))
//   }
// }

export const saveConversationToServer = async (conversation: Conversation) => {
  try {
    console.log('Saving conversation to server:', conversation)
    const response = await fetch('/api/conversation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ conversation }),
    })

    if (!response.ok) {
      throw new Error('Error saving conversation')
    }
  } catch (error) {
    console.error('Error saving conversation:', error)
  }
}
