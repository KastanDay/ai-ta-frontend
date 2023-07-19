import { OpenAIModel } from './openai'

export interface Message {
  // id: string;
  role: Role
  content: string
  contexts?: ContextWithMetadata[] // todo: make sure things works.
}

export interface OpenAIChatMessage {
  role: Role
  content: string
}

export interface ContextWithMetadata {
  id: number
  text: string
  readable_filename: string
  course_name: string
  s3_path: string
  pagenumber_or_timestamp: string
}

export type Role = 'assistant' | 'user'

export interface ChatBody {
  model: OpenAIModel
  messages: Message[]
  key: string
  prompt: string
  temperature: number
  course_name: string
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
