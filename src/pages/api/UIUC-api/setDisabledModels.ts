import { kv } from '@vercel/kv'
import { NextResponse, NextRequest } from 'next/server'
import { CourseMetadata } from '~/types/courseMetadata'

export const runtime = 'edge'

const setDisabledModels = async (req: any, res: any) => {
  const course_name = req.nextUrl.searchParams.get('course_name') as string
  const disabled_models = req.nextUrl.searchParams.get(
    'disabled_models',
  ) as string[]

  try {
    let course_metadata = (await kv.hget(
      'course_metadatas',
      course_name,
    )) as CourseMetadata

    if (!course_metadata) {
      res.status(500).json({ success: false })
      return
    }

    // Set disabled models
    course_metadata.disabled_models = disabled_models

    await kv.hset('course_metadatas', {
      [course_name]: course_metadata,
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.log(error)
    console.log('setDisabledModels FAILURE')
    return NextResponse.json({ success: false })
  }
}
export default setDisabledModels
