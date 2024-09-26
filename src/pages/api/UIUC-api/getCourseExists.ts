import { kv } from '@vercel/kv'
import { NextResponse } from 'next/server'
import { redisClient } from '~/utils/redisClient'

export const runtime = 'edge'

const getCourseExists = async (req: any, res: any) => {
  const course_name = req.nextUrl.searchParams.get('course_name')

  try {
    const courseExists = await redisClient.hExists(
      'course_metadatas',
      course_name,
    )
    return NextResponse.json(courseExists)
  } catch (error) {
    console.log(error)
    return NextResponse.json(false)
  }
}

export default getCourseExists
