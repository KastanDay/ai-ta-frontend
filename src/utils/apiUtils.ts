// utils/apiUtils.ts
import {type CourseMetadata} from "~/types/courseMetadata";


export const callSetCourseMetadata = async (courseName: string, courseMetadata: CourseMetadata) => {
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
        return true
      } else {
        console.error('Error setting course metadata:', data.error)
        return false
      }
    } catch (error) {
      console.error('Error setting course metadata:', error)
      return false
    }
  }