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

  saveConversation(updatedConversation)
  saveConversations(updatedConversations)

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
          conversation.messages.length > 0 &&
          conversation.messages[0].contexts.length > 0
            ? conversation.messages[0].contexts[0].course_name
            : 'Unknown Course',
        user_email: conversation.user_email,
        inSaveConversation: true,
      })

      clearSingleOldestConversation() // Attempt to clear a bit of storage and try again
    }
  }
}

const clearSingleOldestConversation = () => {
  console.debug('CLEARING OLDEST CONVERSATIONS to free space in local storage.')

  let existingConversations = JSON.parse(
    localStorage.getItem('conversationHistory') || '[]',
  )

  // let existingConversations = JSON.parse(localStorage.getItem('conversationHistory') || '[]');
  while (existingConversations.length > 0) {
    console.debug('INSIDE WHILE LOOP')
    existingConversations.shift() // Remove the oldest conversation
    try {
      localStorage.setItem(
        'conversationHistory',
        JSON.stringify(existingConversations),
      )
      console.debug(
        'SUCCESSFULLY SAVED CONVERSATION HISTORY AFTER FREEING SPACE',
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
        conversations.length > 0 &&
        conversations[conversations.length - 1].messages.length > 0 &&
        conversations[conversations.length - 1].messages[0].contexts.length > 0
          ? conversations[conversations.length - 1].messages[0].contexts[0]
              .course_name
          : 'Unknown Course',
      user_email: conversations[conversations.length - 1].user_email,
      inSaveConversations: true,
    })

    let existingConversations = JSON.parse(
      localStorage.getItem('conversationHistory') || '[]',
    )
    while (
      existingConversations.length > 0 &&
      e instanceof DOMException &&
      e.code === 22
    ) {
      console.debug('INSIDE WHILE LOOP')
      existingConversations.shift() // Remove the oldest conversation
      try {
        localStorage.setItem(
          'conversationHistory',
          JSON.stringify(existingConversations),
        )
        e = null // Clear the error since space has been freed
        console.debug(
          'SUCCESSFULLY SAVED CONVERSATION HISTORY AFTER FREEING SPACE',
        )
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
