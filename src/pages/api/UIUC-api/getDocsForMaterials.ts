// ~/src/pages/api/UIUC-api/getCourseMetadata.ts
import { kv } from '@vercel/kv'
import { NextResponse } from 'next/server'
import { CourseMetadata } from '~/types/courseMetadata'
import { log } from 'next-axiom'

export const runtime = 'edge'


import { createClient } from '@supabase/supabase-js'

// TODO:
// Create a single supabase client for interacting with your database
const supabase = createClient('https://twzwfuydgnnjcaopyfdv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3endmdXlkZ25uamNhb3B5ZmR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTIxMzA1MDYsImV4cCI6MjAwNzcwNjUwNn0.Wuz8ToRJliaYHyqvnE8L9uc-qcwIkeSpvtHnt0cpYxo')

interface CourseDocuments {
  readable_filename: string;
  url: string;
  s3_path: string;
  created_at: string;
}

export const getCourseDocuments = async (
  course_name: string,
  // page_size: int,
  // page_num: int,
  // sort_status: int,
): Promise<CourseDocuments[] | null> => {
  try {


    // recordsPerPage: PAGE_SIZE, page, sortStatus
    // const start_idx = page_size * page_num
    // const end_idx = page_size * (page_num + 1)


    let { data: documents, error } = await supabase
      .from('documents')
      .select('readable_filename,url,s3_path,created_at')
      .eq('course_name', course_name)
    // .range(start_idx, end_idx)
    if (error) {
      console.error('Error fetching course documents:', error);
      return null;
    }

    return documents;
  } catch (error) {
    console.error('Unexpected error occurred while fetching course documents:', error);
    return null;
  }
}

// export default async (req: any, res: any) => {
//   const course_name = req.nextUrl.searchParams.get('course_name')
//   const course_metadata = await getCourseDocuments(course_name)

//   try {
//     if (course_metadata == null) {
//       return NextResponse.json({
//         success: true,
//         course_metadata: null,
//         course_exists: false,
//       })
//     }

//     // Only parse is_private if it exists
//     if (course_metadata.hasOwnProperty('is_private')) {
//       course_metadata.is_private = JSON.parse(
//         course_metadata.is_private as unknown as string,
//       )
//     }
//     log.debug('getCourseMetadata() success', {
//       course_metadata: course_metadata,
//     })
//     return NextResponse.json({ course_metadata: course_metadata })
//   } catch (error) {
//     console.log('Error occurred while fetching courseMetadata', error)
//     log.error('Error occurred while fetching courseMetadata', { error: error })
//     return NextResponse.json({ success: false, error: error })
//   }
// }

// const getCourseMetadata = async (req: any, res: any) => {
//   const course_name = req.nextUrl.searchParams.get('course_name')
//   log.debug('getCourseMetadata() request', { course_name: course_name })
//   try {
//     const course_metadata = (await kv.hget(
//       'course_metadatas',
//       course_name,
//     )) as CourseMetadata
//     // console.log('in api getCourseMetadata: course_metadata', course_metadata)

//     if (course_metadata == null) {
//       return NextResponse.json({
//         success: true,
//         course_metadata: null,
//         course_exists: false,
//       })
//     }

//     // Only parse is_private if it exists
//     if (course_metadata.hasOwnProperty('is_private')) {
//       course_metadata.is_private = JSON.parse(
//         course_metadata.is_private as unknown as string,
//       )
//     }
//     log.debug('getCourseMetadata() success', {
//       course_metadata: course_metadata,
//     })
//     return NextResponse.json({ course_metadata: course_metadata })
//   } catch (error) {
//     console.log('Error occurred while fetching courseMetadata', error)
//     log.error('Error occurred while fetching courseMetadata', { error: error })
//     return NextResponse.json({ success: false, error: error })
//   }
// }

// export default getCourseMetadata
