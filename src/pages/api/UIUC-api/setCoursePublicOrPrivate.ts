import { kv } from '@vercel/kv'
import { NextResponse } from 'next/server'
import { CourseMetadata } from '~/types/courseMetadata'

export const runtime = 'edge'

const setCoursePublicOrPrivate = async (req: any, res: any) => {
  const course_name = req.nextUrl.searchParams.get('course_name')
  const is_private = req.nextUrl.searchParams.get('is_private')

  try {
    const course_metadata = (await kv.get(
      course_name + '_metadata',
    )) as CourseMetadata

    if (!course_metadata) {
      res.status(500).json({ success: false })
      return
    }

    const updated_course_metadata: CourseMetadata = {
      ...course_metadata,
      is_private, // ONLY CHANGE
    }

    await kv.set(course_name + '_metadata', updated_course_metadata)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.log(error)
    console.log('removeUserFromCourse FAILURE')
    return NextResponse.json({ success: false })
  }
}
export default setCoursePublicOrPrivate
