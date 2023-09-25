// ~/src/pages/api/UIUC-api/getAllCourseMetadata.ts
import { kv } from '@vercel/kv'
import { NextResponse } from 'next/server'
import { CourseMetadata } from '~/types/courseMetadata'
import { log } from 'next-axiom'

export const runtime = 'edge'

// USAGE:
// useEffect(() => {
//   const fetchCourseMetadata = async () => {
//     const response = await fetch(
//       `/api/UIUC-api/getAllCourseMetadata`,
//     )
//     const all_course_metadata = await response.json()
//     console.log("All Course metadta: ", all_course_metadata)
//   }

//   fetchCourseMetadata()
// }, [])

export const getAllCourseMetadata = async (): Promise<CourseMetadata[] | null> => {
  try {
    // const all_course_metadata = await kv.hgetall(
    //   'course_metadatas',
    // ) as CourseMetadata[]

    const all_course_metadata_raw = await kv.hgetall('course_metadatas')

    if (all_course_metadata_raw) {
      const all_course_metadata = Object.values(all_course_metadata_raw).map(item => {
        const courseMetadata = item as CourseMetadata;
        if (!courseMetadata) {
          console.error('Invalid course metadata:', item);
          return null;
        }
        return courseMetadata;
      }).filter(item => item !== null) as CourseMetadata[];
      console.log('in direct course name', all_course_metadata)
      return all_course_metadata
    } else {
      console.error('Error occurred while fetching courseMetadata: No course metadata found for ANY course!')
      return null
    }

  } catch (error) {
    console.error('Error occurred while fetching courseMetadata', error)
    return null
  }
}

export default async (req: any, res: any) => {
  try {
    const all_course_metadata = await getAllCourseMetadata()
    log.debug('getCourseMetadata() success', {
      all_course_metadata: all_course_metadata,
    })
    return NextResponse.json({ course_metadata: all_course_metadata })

  } catch (error) {
    console.log('Error occurred while fetching courseMetadata', error)
    log.error('Error occurred while fetching courseMetadata', { error: error })
    return NextResponse.json({ success: false, error: error })
  }
}