import { OpenAIModel } from './openai'

export interface Message {
  // id: string;
  role: Role
  content: string | Content[]
  contexts?: ContextWithMetadata[] // todo: make sure things works.
  responseTimeSec?: number
}

export interface Content {
  type: string;
  text?: string;
  image_url?: {
    url: string;
  };
};

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

export type Role = 'assistant' | 'user'

export interface ChatBody {
  model: OpenAIModel
  messages: Message[]
  key: string
  prompt: string
  temperature: number
  course_name: string
  stream: boolean
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
  model: string;
  conversation: Conversation;
  openai_key?: string;
  prompt: string;
  temperature: number;
  course_name: string;
  stream: boolean;
  api_key: string;
}
