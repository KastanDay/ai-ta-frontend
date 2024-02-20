import { kv } from '@vercel/kv'
import type { NextApiRequest, NextApiResponse } from 'next'
import { CourseMetadata } from '~/types/courseMetadata'
import { OpenAIModel } from '~/types/openai'

// export const runtime = 'edge'

type ResponseData = {
  message: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
) {
  console.log('in top of setDisabledModels')
  if (req.method !== 'POST') {
    return res.status(405)
  }

  const { course_name, disabled_models } = req.body

  if (!course_name || !disabled_models) {
    return res.status(400).json({ message: 'Invalid request' })
  }

  try {
    let course_metadata = (await kv.hget(
      'course_metadatas',
      course_name,
    )) as CourseMetadata

    if (!course_metadata) {
      return res.status(500).json({ message: 'Course not found' })
    }

    // Set disabled models
    course_metadata.disabled_models = disabled_models
    console.log('course_metadata before hset', course_metadata)

    await kv.hset('course_metadatas', {
      [course_name]: course_metadata,
    })
    return res.json({ message: 'success' })
  } catch (error) {
    console.error('Failure in setDisabledModels:', error)
    return res.status(500).json({ message: 'Server encountered an error' })
  }
}
