import {kv} from '@vercel/kv'
import {NextResponse} from 'next/server'

export const runtime = 'edge'

const getCourseExists = async (req: any, res: any) => {
  const course_name = req.nextUrl.searchParams.get('course_name')

  try {
    console.log('Request to check if course exists:', course_name)
    const courseExists = await kv.hexists('course_metadatas', course_name)
    return NextResponse.json(courseExists === 1)
  } catch (error) {
    console.log(error)
    return NextResponse.json(false)
  }
}

export default getCourseExists
