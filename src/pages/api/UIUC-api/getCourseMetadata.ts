// ~/src/pages/api/UIUC-api/getCourseMetadata.ts
import { kv } from '@vercel/kv'
import { NextResponse } from 'next/server'
import { CourseMetadata } from '~/types/courseMetadata'

export const runtime = 'edge'

const getCourseMetadata = async (req: any, res: any) => {
  // console.log('in api getCourseMetadata: req', req)
  // const { course_name } = req.nextUrl.searchParams
  const course_name = req.nextUrl.searchParams.get('course_name')

  try {
    const course_metadata = (await kv.get(
      course_name + '_metadata',
    )) as CourseMetadata
    course_metadata.is_private = JSON.parse(
      course_metadata.is_private as unknown as string,
    )
    // res.status(200).json(course_metadata as JSON)
    return NextResponse.json({ course_metadata: course_metadata })
  } catch (error) {
    console.log(error)
    // res.status(500).json({})
    return NextResponse.json({ success: false })
  }
}

export default getCourseMetadata
