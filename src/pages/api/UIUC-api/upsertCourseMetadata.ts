import { kv } from '@vercel/kv'
import { NextResponse } from 'next/server'
import {
  CourseMetadata,
  CourseMetadataOptionalForUpsert,
} from '~/types/courseMetadata'

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
  const course_owner =
    req.nextUrl.searchParams.get('course_owner') || 'default_owner'
  const is_private = req.nextUrl.searchParams.get('is_private') || false
  const course_admins = JSON.parse(
    req.nextUrl.searchParams.get('course_admins') || '[]',
  )
  const approved_emails_list = JSON.parse(
    req.nextUrl.searchParams.get('approved_emails_list') || '[]',
  )

  try {
    // Fetch existing metadata
    const existing_metadata: CourseMetadata | object =
      (await kv.get(course_name + '_metadata')) || {}

    // Merge existing metadata with new values
    const course_metadata: CourseMetadata = {
      ...existing_metadata,
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

// import { CourseMetadata } from '~/types/courseMetadata'

export const callUpsertCourseMetadata = async (
  courseName: string,
  courseMetadata: CourseMetadataOptionalForUpsert,
) => {
  try {
    const {
      is_private = false,
      course_owner = '',
      course_admins = ['kvday2@illinois.edu'],
      approved_emails_list = [],
    } = courseMetadata

    const url = new URL(
      '/api/UIUC-api/setCourseMetadata',
      window.location.origin,
    )

    url.searchParams.append('is_private', String(is_private))
    url.searchParams.append('course_name', courseName)
    url.searchParams.append('course_owner', course_owner)
    url.searchParams.append('course_admins', JSON.stringify(course_admins))
    url.searchParams.append(
      'approved_emails_list',
      JSON.stringify(approved_emails_list),
    )

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error setting course metadata:', error)
    return false
  }
}

export default setCourseMetadata
