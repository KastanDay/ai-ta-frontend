export interface WorkflowRecord {
  key: string
  // id: string
  name: string
  active: boolean
  tags: toolRecord[]
  createdAt: Date
  updatedAt: Date
}

interface toolRecord {
  createdAt: Date
  id: string
  name: string
  updatedAt: Date
}
