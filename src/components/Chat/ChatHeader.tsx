// src/components/Chat/ChatHeader.tsx
import React from 'react'
import ChatNavbar from '../UIUC-Components/navbars/ChatNavbar'
import { Montserrat } from 'next/font/google'

interface ChatHeaderProps {
  bannerUrl: string
}

const montserrat_heading = Montserrat({
  weight: '500',
  subsets: ['latin'],
})

const ChatHeader: React.FC<ChatHeaderProps> = ({ bannerUrl }) => {
  return (
    <div className="justify-center" style={{ height: '40px' }}>
      <ChatNavbar bannerUrl={bannerUrl} isgpt4={true} />
    </div>
  )
}

export default React.memo(ChatHeader)
