// ~/src/pages/api/UIUC-api/getAllCourseNames.ts
import { kv } from '@vercel/kv'
import { NextResponse } from 'next/server'
// import { performance } from 'perf_hooks'; // not available in Edge runtime
// it's taking a while 2134 ms (2.1 seconds!!) for just 150 to 200 courses.

export const runtime = 'edge'

const getAllCourseNames = async (req: any, res: any) => {
  try {
    // Use a Set to store unique course names
    const all_course_names: Set<string> = new Set()
    // "KEYS *" won't work... need to use scanIterator
    for await (const key of kv.scanIterator()) {
      // If the key ends with "_metadata", remove that part
      const courseName = key.endsWith('_metadata') ? key.slice(0, -9) : key
      all_course_names.add(courseName)
    }
    return NextResponse.json({ all_course_names: Array.from(all_course_names) })
  } catch (error) {
    console.log(error)
    return NextResponse.json({ success: false })
  }
}

export default getAllCourseNames
