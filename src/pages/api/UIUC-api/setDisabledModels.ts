import { kv } from '@vercel/kv'
import { CourseMetadata } from '~/types/courseMetadata'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

// GREAT EXAMPLE OF A POST REQUEST ON EDGE
// const { course_name, disabled_models } = await req.json()

export default async function handler(req: NextRequest) {
  if (req.method === 'GET') {
  } else if (req.method == 'POST') {
    // Parse body
    const { course_name, disabled_models } = await req.json()

    if (!course_name || !disabled_models) {
      return NextResponse.json(
        {
          message:
            'Invalid request, missing one of course_name or disabled_models.',
        },
        { status: 400 },
      )
    }

    try {
      // FYI Redis itself doesn't provide direct commands to manipulate JSON data within a hash field, so this workaround is necessary.
      let course_metadata = (await kv.hget(
        'course_metadatas',
        course_name,
      )) as CourseMetadata

      if (!course_metadata) {
        return NextResponse.json(
          { message: 'Existing course not found.' },
          { status: 500 },
        )
      }

      // Set disabled models
      course_metadata.disabled_models = disabled_models

      await kv.hset('course_metadatas', {
        [course_name]: course_metadata,
      })
      return NextResponse.json({ message: 'Success' }, { status: 200 })
    } catch (error) {
      console.error('Failure in setDisabledModels:', error)
      return NextResponse.json(
        { message: 'Internal server error' },
        { status: 500 },
      )
    }
  } else {
    return NextResponse.json(
      { message: 'Invalid request method' },
      { status: 400 },
    )
  }
}
