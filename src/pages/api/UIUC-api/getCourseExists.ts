import { kv } from '@vercel/kv'

export const runtime = 'edge'

const getCourseExists = async (req: any, res: any) => {
  const { course_name } = req.query

  try {
    const courseExists = await kv.hexists('course_metadatas', course_name)
    res.status(200).json(courseExists === 1)
  } catch (error) {
    console.log(error)
    res.status(500).json(false)
  }
}

export default getCourseExists
