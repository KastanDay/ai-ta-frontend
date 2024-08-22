import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/utils/supabaseClient'
import { FolderInterface } from '@/types/folder'
import { Database } from 'database.types'

type Folder = Database['public']['Tables']['folders']['Row']

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  console.log(
    'Received request for folders API:',
    req.method,
    req.body,
    req.query,
  )
  const { method } = req

  switch (method) {
    case 'POST':
      const { folder, email }: { folder: FolderInterface; email: string } =
        req.body
      //   Convert folder to DB type
      const dbFolder: Folder = {
        id: folder.id,
        name: folder.name,
        type: folder.type.toString(),
        user_email: email,
        created_at: new Date().toISOString(),
      }

      try {
        const { data, error } = await supabase
          .from('folders')
          .upsert([dbFolder], { onConflict: 'id' })

        if (error) throw error

        res.status(200).json({ message: 'Folder saved successfully' })
      } catch (error) {
        res.status(500).json({ error: `Error saving folder: ` + error })
        console.error('Error saving folder:', error)
      }
      break

    case 'GET':
      const { user_email } = req.query
      try {
        if (!user_email || typeof user_email !== 'string') {
          res.status(400).json({ error: 'No valid email address provided' })
          return
        }

        const { data, error } = await supabase
          .from('folders')
          .select('*')
          .eq('user_email', user_email)
          .order('created_at', { ascending: false })

        if (error) throw error

        const folderResponse: FolderInterface[] = data.map(
          (folder: Folder) => ({
            id: folder.id,
            name: folder.name,
            type: folder.type as 'chat' | 'prompt',
          }),
        )
        res.status(200).json(folderResponse)
      } catch (error) {
        res.status(500).json({ error: 'Error fetching folders' })
      }
      break

    default:
      res.setHeader('Allow', ['GET', 'POST'])
      res.status(405).end(`Method ${method} Not Allowed`)
  }
}
