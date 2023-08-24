// ~/src/pages/api/UIUC-api/getCourseMetadata.ts
import { kv } from '@vercel/kv'
import { NextResponse } from 'next/server'
import { CourseMetadata } from '~/types/courseMetadata'

export const runtime = 'edge'

const getCourseMetadata = async (req: any, res: any) => {
  const course_name = req.nextUrl.searchParams.get('course_name')
  try {
    const course_metadata = (await kv.hget(
      'course_metadatas',
      course_name,
    )) as CourseMetadata
    console.log('in api getCourseMetadata: course_metadata', course_metadata)

    if (course_metadata == null) {
      return NextResponse.json({
        success: true,
        course_metadata: null,
        course_exists: false,
      })
    }

    // Only parse is_private if it exists
    if (course_metadata.hasOwnProperty('is_private')) {
      course_metadata.is_private = JSON.parse(
        course_metadata.is_private as unknown as string,
      )
    }
    return NextResponse.json({ course_metadata: course_metadata })
  } catch (error) {
    console.log('Error occured while fetching courseMetadata', error)
    return NextResponse.json({ success: false, error: error })
  }
}

export default getCourseMetadata
