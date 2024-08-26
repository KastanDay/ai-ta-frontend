import { Conversation } from './chat'

export interface FolderInterface {
  id: string
  name: string
  type: FolderType
}

export interface FolderWithConversation extends FolderInterface {
  conversations?: Conversation[]
}

export type FolderType = 'chat' | 'prompt'
