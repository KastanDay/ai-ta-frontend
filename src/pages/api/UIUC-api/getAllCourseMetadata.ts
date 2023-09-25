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


export const getAllCourseMetadata = async (): Promise<{ [key: string]: CourseMetadata }[] | null> => {
  /*
  I return a list of dictionaries of course metadata
    The key is the courseName
    The value is the CourseMetadata object
  */

  try {
    const all_course_metadata_raw = await kv.hgetall('course_metadatas')
    console.log("Raw metadata")
    console.log(all_course_metadata_raw)

    if (all_course_metadata_raw) {
      const all_course_metadata = Object.entries(all_course_metadata_raw).map(([key, value]) => {
        const courseMetadata = value as CourseMetadata;
        if (!courseMetadata) {
          console.error('Invalid course metadata:', value);
          return null;
        }
        return { [key]: courseMetadata };
      }).filter(item => item !== null) as { [key: string]: CourseMetadata }[];
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