// upsertCourseMetadata.ts
import { kv } from '@vercel/kv'
import {
  type CourseMetadata,
  type CourseMetadataOptionalForUpsert,
} from '~/types/courseMetadata'
import { type NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export default async function handler(req: NextRequest, res: NextResponse) {
  const requestBody = await req.text()
  const {
    courseName,
    courseMetadata,
  }: { courseName: string; courseMetadata: CourseMetadataOptionalForUpsert } =
    JSON.parse(requestBody)

  console.log('API Request:', requestBody)
  console.log('courseName:', courseName)
  console.log('courseMetadata:', courseMetadata)

  // Check if courseName is not null or undefined
  if (!courseName) {
    console.error('Error: courseName is null or undefined')
    return
  }

  try {
    // Check if courseMetadata doesn't have anything in the field course_admins
    if (
      !courseMetadata.course_admins ||
      courseMetadata.course_admins.length === 0
    ) {
      courseMetadata.course_admins = ['kvday2@illinois.edu']
      console.log('course_admins field was empty. Added default admin email.')
    }

    // Check if courseMetadata doesn't have anything in the field is_private
    if (!courseMetadata.is_private) {
      courseMetadata.is_private = false
      console.log('is_private field was empty. Set to false.')
    }

    const existing_metadata: CourseMetadata | object =
      (await kv.hget('course_metadatas', courseName)) || {}
    const updated_metadata = { ...existing_metadata, ...courseMetadata }
    await kv.hset('course_metadatas', { [courseName]: updated_metadata })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error setting course metadata:', error)
    return NextResponse.json({ success: false })
  }
}
