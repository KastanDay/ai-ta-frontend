import { FolderInterface } from '@/types/folder'

export const saveFolders = (folders: FolderInterface[]) => {
  localStorage.setItem('folders', JSON.stringify(folders))
}

export const saveFolderToServer = async (
  folder: FolderInterface,
  user_email: string,
) => {
  try {
    console.log('Saving conversation to server:', folder, user_email)
    const response = await fetch('/api/folder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ folder, email: user_email }),
    })

    if (!response.ok) {
      throw new Error(`Error saving folder: ` + response.statusText)
    }
  } catch (error) {
    console.error('Error saving folder:', error)
  }
}
