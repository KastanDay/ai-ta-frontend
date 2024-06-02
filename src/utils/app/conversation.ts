// @utils/app/conversation
import { Conversation } from '@/types/chat'

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
  try {
    localStorage.setItem('selectedConversation', JSON.stringify(conversation))
  } catch (e) {
    console.error(
      'Error saving conversation history. Clearing storage, then setting convo. Error:',
      e,
    )
    localStorage.clear()
    localStorage.setItem('selectedConversation', JSON.stringify(conversation))
  }
}

export const saveConversations = (conversations: Conversation[]) => {
  try {
    localStorage.setItem('conversationHistory', JSON.stringify(conversations))
  } catch (e) {
    console.error(
      'Error saving conversation history. Clearing storage, then setting convo. Error:',
      e,
    )
    localStorage.clear()
    localStorage.setItem('conversationHistory', JSON.stringify(conversations))
  }
}
