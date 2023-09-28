// utils/apiUtils.ts
import {
  CourseMetadataOptionalForUpsert,
  type CourseMetadata,
} from '~/types/courseMetadata'
import { log } from 'next-axiom'

export const config = {
  runtime: 'edge',
}

export const callSetCourseMetadata = async (
  courseName: string,
  courseMetadata: CourseMetadata | CourseMetadataOptionalForUpsert,
) => {
  try {
    const response = await fetch('/api/UIUC-api/upsertCourseMetadata', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        courseName: courseName,
        courseMetadata: courseMetadata,
      }),
    })
    const data = await response.json()
    if (data.success) {
      console.log('Course metadata updated successfully')
      console.debug('Course metadata updated successfully')
      log.debug('Course metadata updated successfully', {
        course_name: courseName,
        course_metadata: courseMetadata,
      })

      return true
    } else {
      console.error('Error setting course metadata:', data.error)
      log.error('Error setting course metadata', {
        course_name: courseName,
        error: data.error,
      })
      return false
    }
  } catch (error) {
    console.error('Error setting course metadata:', error)
    log.error('Error setting course metadata', {
      course_name: courseName,
      error: error,
    })
    return false
  }
}
