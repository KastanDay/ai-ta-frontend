// ~/src/pages/api/UIUC-api/getAllCourseMetadata.ts
import { kv } from '@vercel/kv'
import { NextResponse } from 'next/server'
import { CourseMetadata } from '~/types/courseMetadata'
import { log } from 'next-axiom'
import { redisClient } from '~/utils/redisClient'

export const runtime = 'edge'

export const getCoursesByOwnerOrAdmin = async (
  currUserEmail: string,
): Promise<{ [key: string]: CourseMetadata }[]> => {
  try {
    const all_course_metadata_raw =
      await redisClient.hGetAll('course_metadatas')
    if (!all_course_metadata_raw) {
      console.error('No course metadata found for ANY course!')
      return []
    }

    const course_metadatas = Object.entries(all_course_metadata_raw).reduce(
      (acc, [key, value]) => {
        try {
          const courseMetadata = JSON.parse(value) as CourseMetadata
          if (
            courseMetadata.course_owner &&
            courseMetadata.course_admins &&
            (courseMetadata.course_owner === currUserEmail ||
              courseMetadata.course_admins.includes(currUserEmail))
          ) {
            acc.push({ [key]: courseMetadata })
          }
        } catch (parseError) {
          console.error('Invalid course metadata:', value, parseError)
        }
        return acc
      },
      [] as { [key: string]: CourseMetadata }[],
    )

    return course_metadatas
  } catch (error) {
    console.error('Error occurred while fetching courseMetadata', error)
    return []
  }
}

export const getAllCourseMetadata = async (): Promise<
  { [key: string]: CourseMetadata }[]
> => {
  try {
    const all_course_metadata_raw =
      await redisClient.hGetAll('course_metadatas')
    if (!all_course_metadata_raw) {
      console.error('No course metadata found for ANY course!')
      return []
    }

    const all_course_metadata = Object.entries(all_course_metadata_raw).reduce(
      (acc, [key, value]) => {
        try {
          const courseMetadata = JSON.parse(value) as CourseMetadata
          acc.push({ [key]: courseMetadata })
        } catch (parseError) {
          console.error('Invalid course metadata:', value, parseError)
        }
        return acc
      },
      [] as { [key: string]: CourseMetadata }[],
    )

    return all_course_metadata
  } catch (error) {
    console.error('Error occurred while fetching courseMetadata', error)
    return []
  }
}

export default async (req: any, res: any) => {
  try {
    const currUserEmail = req.nextUrl.searchParams.get('currUserEmail')
    const all_course_metadata = await getCoursesByOwnerOrAdmin(currUserEmail)
    return NextResponse.json(all_course_metadata)
  } catch (error) {
    console.error('Error occurred while fetching courseMetadata', error)
    log.error('Error occurred while fetching courseMetadata', { error: error })
    return NextResponse.json({ success: false, error: error })
  }
}
