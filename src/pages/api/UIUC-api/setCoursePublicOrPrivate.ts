import { kv } from '@vercel/kv'
import { NextResponse } from 'next/server'
import { CourseMetadata } from '~/types/courseMetadata'
import { redisClient } from '~/utils/redisClient'

export const runtime = 'edge'

const setCoursePublicOrPrivate = async (req: any, res: any) => {
  const course_name = req.nextUrl.searchParams.get('course_name')
  const is_private = req.nextUrl.searchParams.get('is_private')

  try {
    const course_metadata_string = await redisClient.hGet(
      'course_metadatas',
      course_name,
    )

    if (!course_metadata_string) throw new Error('Course metadata not found')
    const course_metadata: CourseMetadata = JSON.parse(course_metadata_string)

    if (!course_metadata) {
      res.status(500).json({ success: false })
      return
    }

    const updated_course_metadata: CourseMetadata = {
      ...course_metadata,
      is_private, // ONLY CHANGE
    }

    await redisClient.hSet('course_metadatas', {
      [course_name]: JSON.stringify(updated_course_metadata),
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.log(error)
    console.log('removeUserFromCourse FAILURE')
    return NextResponse.json({ success: false })
  }
}
export default setCoursePublicOrPrivate
