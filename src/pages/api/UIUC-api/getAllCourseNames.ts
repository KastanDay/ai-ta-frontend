// ~/src/pages/api/UIUC-api/getAllCourseNames.ts
import { kv } from '@vercel/kv'
import { NextResponse } from 'next/server'
// import { performance } from 'perf_hooks'; // not available in Edge runtime
// it's taking a while 2134 ms (2.1 seconds!!) for just 150 to 200 courses.

export const runtime = 'edge'

const getAllCourseNames = async (req: any, res: any) => {
  try {
    const all_course_names = await kv.hkeys('course_metadatas')
    return NextResponse.json({ all_course_names })
  } catch (error) {
    console.log(error)
    return NextResponse.json({ success: false })
  }
}

export default getAllCourseNames
