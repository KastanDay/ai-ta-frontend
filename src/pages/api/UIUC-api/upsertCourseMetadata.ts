import { kv } from '@vercel/kv'
import { NextResponse } from 'next/server'
import {
  type CourseMetadata,
  type CourseMetadataOptionalForUpsert,
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
  const banner_image_s3 = req.nextUrl.searchParams.get('banner_image_s3') || ''
  const course_intro_message =
    req.nextUrl.searchParams.get('course_intro_message') || ''

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
      banner_image_s3: banner_image_s3,
      course_intro_message: course_intro_message,
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
      course_intro_message = '',
      banner_image_s3 = '',
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
    url.searchParams.append('banner_image_s3', banner_image_s3)
    url.searchParams.append('course_intro_message', course_intro_message)
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
