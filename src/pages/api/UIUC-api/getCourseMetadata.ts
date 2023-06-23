import { kv } from '@vercel/kv'

export const runtime = 'edge'

const getCourseMetadata = async (req: any, res: any) => {
  const { course_name } = req.query

  try {
    const course_metadata = await kv.get(course_name + '_metadata')
    res.status(200).json(course_metadata as JSON)
  } catch (error) {
    console.log(error)
    res.status(500).json({})
  }
}

export default getCourseMetadata
