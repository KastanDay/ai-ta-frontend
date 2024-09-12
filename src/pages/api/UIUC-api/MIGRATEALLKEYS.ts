import { kv } from '@vercel/kv'
import { type NextRequest, NextResponse } from 'next/server'
import { getAllCourseMetadata } from './getAllCourseMetadata'
import { CourseMetadata } from '~/types/courseMetadata'

export const runtime = 'edge'

export default async function handler(
  req: NextRequest,
  res: NextResponse,
): Promise<NextResponse> {
  // Ensure it's a POST request
  if (req.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
  }

  try {
    const result = await migrateAllKeys()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error during migration:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    )
  }
}

// WARNING
// Some disabled models are no longer supported. Keep in mind...
// "disabled_models": [
//   "gpt-4-vision-preview",
//   "gpt-4-1106-preview",
//   "gpt-4",
//   "gpt-3.5-turbo",
//   "gpt-3.5-turbo-16k"
// ],

export const migrateAllKeys = async () => {
  // Step 1: Grab all course_metadatas
  const allCourseMetadata = await getAllCourseMetadata()

  if (!allCourseMetadata) {
    throw new Error('No course metadata found')
  }

  // Step 2: Check conditions and print matching course_metadata objects
  const matchingCourses: { [key: string]: CourseMetadata }[] = []

  allCourseMetadata.forEach((courseObj) => {
    const [[courseName, metadata]] = Object.entries(courseObj) as [
      [string, CourseMetadata],
    ]
    if (
      metadata.openai_api_key &&
      metadata.openai_api_key !== '' &&
      metadata.disabled_models &&
      metadata.disabled_models.length > 0
    ) {
      matchingCourses.push({ [courseName]: metadata })
    }
  })

  console.log('Matching courses:', JSON.stringify(matchingCourses, null, 2))

  return {
    success: true,
    message: 'Migration check completed',
    matchingCoursesCount: matchingCourses.length,
  }
}
