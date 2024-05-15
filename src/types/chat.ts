import { UIUCTool } from '~/utils/functionCalling/handleFunctionCalling'
import { OpenAIModel } from './openai'
import { CourseMetadata } from './courseMetadata'

export interface Message {
  // id: string;
  role: Role
  content: string | Content[]
  contexts?: ContextWithMetadata[]
  tools?: ToolResult[]
  responseTimeSec?: number
}

export interface ToolResult {
  tool?: UIUCTool
  toolResult?: string
  toolContexts?: ContextWithMetadata[]
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
