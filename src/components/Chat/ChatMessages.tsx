// src/components/Chat/ChatMessages.tsx
import React, { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Message, Conversation, UIUCTool } from '@/types/chat'
import { useContext } from 'react'
import HomeContext from '~/pages/api/home/home.context'
import { MemoizedChatMessage } from './MemoizedChatMessage'
import { ChatLoader } from './ChatLoader'
import { throttle } from '@/utils/data/throttle'
import { useCallback } from 'react'
import ErrorDisplay from './ErrorDisplay'

interface ChatMessagesProps {
  selectedConversation: Conversation | null
  loading: boolean
  modelError: string | null
  renderIntroductoryStatements: () => JSX.Element
  handleSend: (
    message: Message,
    deleteCount: number,
    plugin: Plugin | null,
    tools: UIUCTool[],
    enabledDocumentGroups: string[],
  ) => void
  onImageUrlsUpdate: (updatedMessage: Message, messageIndex: number) => void
  tools: UIUCTool[]
  enabledDocumentGroups: string[]
}

const ChatMessages: React.FC<ChatMessagesProps> = ({
  selectedConversation,
  loading,
  modelError,
  renderIntroductoryStatements,
  handleSend,
  onImageUrlsUpdate,
  tools,
  enabledDocumentGroups,
}) => {
  const {
    state: { conversations },
    handleUpdateConversation,
    dispatch: homeDispatch,
  } = useContext(HomeContext)

  const throttledScrollDown = throttle(() => {
    if (selectedConversation) {
      const messages = selectedConversation.messages
      if (messages.length > 1) {
        if (messages[messages.length - 1]?.role === 'assistant') {
          // Handle accordingly
        }
      }
    }
  }, 250)

  useEffect(() => {
    throttledScrollDown()
    // Additional logic if needed
  }, [selectedConversation, throttledScrollDown])

  if (modelError) {
    return <ErrorDisplay error={modelError} />
  }

  return (
    <motion.div
      key={selectedConversation?.id}
      className="mt-4 max-h-full"
      // Add other necessary props like ref, onScroll if managed here
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
    >
      {selectedConversation?.messages.length === 0 ? (
        <div className="mt-16">{renderIntroductoryStatements()}</div>
      ) : (
        <>
          {selectedConversation?.messages.map((message, index) => (
            <MemoizedChatMessage
              key={index}
              message={message}
              messageIndex={index}
              onEdit={(editedMessage) => {
                handleSend(
                  editedMessage,
                  selectedConversation?.messages.length - index,
                  null,
                  tools,
                  enabledDocumentGroups,
                )
              }}
              onImageUrlsUpdate={onImageUrlsUpdate}
            />
          ))}
          {loading && <ChatLoader />}
          <div
            className="h-[162px] bg-gradient-to-t from-transparent to-[rgba(14,14,21,0.4)]"
            // Ref can be managed here or passed as prop if needed
          />
        </>
      )}
    </motion.div>
  )
}

export default React.memo(ChatMessages)
