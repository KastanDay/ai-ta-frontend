import { OpenAIModel } from './openai'

// export interface Message {
//   role: Role;
//   content: string;
// }
// '@/types/chat'

// adding this for Sources
export interface Message {
  // id: string;
  role: Role
  content: string
  sources?: string[]
}

export type Role = 'assistant' | 'user'

export interface ChatBody {
  model: OpenAIModel
  messages: Message[]
  key: string
  prompt: string
  temperature: number
  // NO FOLDER ID
}

export interface Conversation {
  // NO KEY
  id: string
  name: string
  messages: Message[]
  model: OpenAIModel
  prompt: string
  temperature: number
  folderId: string | null
}
