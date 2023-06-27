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
  const is_private = req.nextUrl.searchParams.get('is_private')
  const course_admins = JSON.parse(
    req.nextUrl.searchParams.get('course_admins') || '[]',
  )
  const approved_emails_list = JSON.parse(
    req.nextUrl.searchParams.get('approved_emails_list') || '[]',
  )

  console.log('$$$$$$$$$$$$$$$ setCourseMetadata: course_name', course_name)
  console.log('$$$$$$$$$$$$$$$ setCourseMetadata: is_private', is_private)
  console.log(
    '$$$$$$$$$$$$$$$ setCourseMetadata: req.nextUrl.searchParams',
    req.nextUrl.searchParams,
  )

  try {
    const course_metadata: CourseMetadata = {
      is_private: is_private,
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
