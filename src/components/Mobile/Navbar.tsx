import { IconPlus } from '@tabler/icons-react'
import { FC } from 'react'

import { Conversation } from '@/types/chat'

interface Props {
  selectedConversation: Conversation
  onNewConversation: () => void
}

export const Navbar: FC<Props> = ({
  selectedConversation,
  onNewConversation,
}) => {
  return (
    <nav className="flex w-full justify-between bg-[#202123] px-4 py-3">
      <div className="mr-4"></div>

      <div className="max-w-[240px] overflow-hidden text-ellipsis whitespace-nowrap">
        {selectedConversation.name}
      </div>

      <IconPlus
        className="mr-8 cursor-pointer hover:text-neutral-400"
        onClick={onNewConversation}
      />
    </nav>
  )
}
