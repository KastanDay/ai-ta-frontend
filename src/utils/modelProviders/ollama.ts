export interface OllamaModel {
  id: string
  name: string
  parameterSize: string
  tokenLimit: number
}

export const getOllamaModels = async () => {
  const response = await fetch('https://ollama.ncsa.ai/api/ps')
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  const data = await response.json()

  const ollamaModels: OllamaModel[] = data.models.map((model: any) => {
    return {
      id: model.name,
      name: model.name,
      parameterSize: model.details.parameter_size,
      tokenLimit: 4096,
    } as OllamaModel
  })

  return ollamaModels
}
