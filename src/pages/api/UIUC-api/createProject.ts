import { ContextWithMetadata } from "~/types/chat";




export const createProject = async (
  project_name: string,
  project_description: string | undefined,
): Promise<boolean> => {
  const requestBody = {
    project_name: project_name,
    project_description: project_description,
  }
  const url = 'https://flask-pr-291.up.railway.app/createProject'

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })
    if (!response.ok) {
      console.error('Failed to create the project. Err status:', response.status)
      throw new Error('Failed to create the project. Err status:' + response.status)
    }
    const data = await response.json()
    return true
  } catch (error) {
    console.error(error)
    return false
  }
}

export default createProject
