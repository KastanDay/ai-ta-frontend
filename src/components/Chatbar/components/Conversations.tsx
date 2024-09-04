import { Conversation } from '@/types/chat'
import { ConversationComponent } from './Conversation'
import { motion } from 'framer-motion'

interface Props {
  conversations: Conversation[]
}

export const Conversations = ({ conversations }: Props) => {
  return (
    <div className="flex w-full flex-col gap-1">
      {conversations
        .filter((conversation) => !conversation.folderId)
        .slice()
        .map((conversation, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <ConversationComponent conversation={conversation} />
          </motion.div>
        ))}
    </div>
  )
}
