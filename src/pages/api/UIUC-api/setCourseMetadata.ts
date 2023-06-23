import { kv } from '@vercel/kv'
import { NextResponse } from 'next/server'
import { CourseMetadata } from '~/types/courseMetadata'

export const runtime = 'edge'

const setCourseMetadata = async (req: any, res: any) => {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' })
    return NextResponse.json({
      success: false,
      message: 'Method not allowed, only POST requests.',
    })
  }

  const course_name = req.nextUrl.searchParams.get('course_name')
  const course_owner = req.nextUrl.searchParams.get('course_owner')
  const isPrivate = req.nextUrl.searchParams.get('isPrivate')
  const course_admins = JSON.parse(
    req.nextUrl.searchParams.get('course_admins') || '[]',
  )
  const approved_emails_list = JSON.parse(
    req.nextUrl.searchParams.get('approved_emails_list') || '[]',
  )

  try {
    const course_metadata: CourseMetadata = {
      isPrivate: isPrivate,
      course_owner: course_owner,
      course_admins: course_admins,
      approved_emails_list: approved_emails_list,
    }
    console.log('Right before setting course_metadata with: ', course_metadata)
    await kv.set(course_name + '_metadata', course_metadata)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.log(error)
    return NextResponse.json({ success: false })
  }
}

export default setCourseMetadata
