// pages/api/deleteDocuments.ts
import { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'
import { CourseDocument } from 'src/types/courseMaterials'

const flask_url = process.env.FLASK_URL

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // console.log("made it to new delete");
  if (req.method === 'POST') {
    const recordsToDelete = req.body as CourseDocument[]

    try {
      const deletePromises = recordsToDelete.map((record) =>
        axios.delete(`${flask_url}/delete`, {
          params: {
            course_name: record.course_name,
            s3_path: record.s3_path,
            url: record.url,
          },
        }),
      )
      await Promise.all(deletePromises)
      // console.log("new delete worked")
      res.status(200).json({ message: 'Documents deleted successfully' })
    } catch (error) {
      console.error('Error deleting documents:', error)
      res.status(500).json({ message: 'Error deleting documents' })
    }
  } else {
    res.setHeader('Allow', ['POST'])
    res.status(405).json({ message: `Method ${req.method} not allowed` })
  }
}