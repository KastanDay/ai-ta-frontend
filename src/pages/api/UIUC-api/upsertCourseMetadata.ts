// upsertCourseMetadata.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { kv } from '@vercel/kv'
import {
  type CourseMetadata,
  type CourseMetadataOptionalForUpsert,
} from '~/types/courseMetadata'

export const runtime = 'edge'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { courseName, courseMetadata }: { courseName: string, courseMetadata: CourseMetadataOptionalForUpsert } = req.body

  console.log('API Request:', req.body);
  

  // Check if courseName is not null or undefined
  if (!courseName) {
    console.error('Error: courseName is null or undefined');
    res.status(400).json({ success: false });
    return;
  }

  try {
    const existing_metadata: CourseMetadata | object = (await kv.hget('course_metadatas', courseName)) || {};
    const updated_metadata = { ...existing_metadata, ...courseMetadata };
    await kv.hset('course_metadatas', { [courseName]: updated_metadata });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error setting course metadata:', error);
    res.status(500).json({ success: false });
  }
};