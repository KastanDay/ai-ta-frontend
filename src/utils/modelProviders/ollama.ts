export interface OllamaModel {
  name: string
  parameterSize: string
}

export const getOllamaModels = async () => {
  console.log('In ollama GET endpoint')
  const response = await fetch('https://ollama.ncsa.ai/api/ps')
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const data = await response.json()
  const ollamaModels: OllamaModel[] = data.models.map((model: any) => {
    return {
      name: model.name,
      parameterSize: model.parameter_size,
    } as OllamaModel
  })

  return ollamaModels
}
