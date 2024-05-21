import { OpenAIModel } from './openai'
import { CourseMetadata } from './courseMetadata'
import { N8NParameter } from './tools'

export interface Conversation {
  // NO KEY
  id: string
  name: string
  messages: Message[]
  model: OpenAIModel // ! consider allowing null models: | null
  prompt: string
  temperature: number
  folderId: string | null
  user_email?: string
}

export interface Message {
  // id: string;
  role: Role
  content: string | Content[]
  contexts?: ContextWithMetadata[]
  tools?: UIUCTool[]
  responseTimeSec?: number
}

export interface UIUCTool {
  id: string
  name: string
  readableName: string
  description: string
  parameters?: {
    type: 'object'
    properties: Record<string, N8NParameter>
    required: string[]
  }
  courseName?: string
  enabled?: boolean
  createdAt?: string
  updatedAt?: string
  output?: string
  loading?: boolean
  contexts?: ContextWithMetadata[]
}

// tool_image_url is for images returned by tools
export type MessageType = 'text' | 'image_url' | 'tool_image_url'

export interface Content {
  type: MessageType
  text?: string
  image_url?: {
    url: string
  }
}

export interface OpenAIChatMessage {
  role: Role
  content: Content[]
}

export interface ContextWithMetadata {
  id: number
  text: string
  readable_filename: string
  course_name: string
  'course_name ': string
  s3_path: string
  pagenumber: string
  url: string
  base_url: string
}

// These are only internal
export type Role = 'assistant' | 'user' | 'system'

export interface ChatBody {
  conversation: Conversation
  key: string
  course_name: string
  stream: boolean
  isImage: boolean
  courseMetadata?: CourseMetadata
  // NO FOLDER ID
}

export interface ChatApiBody {
  model: string
  messages: Message[]
  openai_key?: string
  temperature?: number
  course_name: string
  stream?: boolean
  api_key: string
}

export interface Action {
  id: string
  name: string
  checked: boolean
}
