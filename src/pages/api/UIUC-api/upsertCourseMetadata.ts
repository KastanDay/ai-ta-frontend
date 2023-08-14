import { kv } from '@vercel/kv'
import { NextResponse } from 'next/server'
import {
  type CourseMetadata,
  type CourseMetadataOptionalForUpsert,
} from '~/types/courseMetadata'

export const runtime = 'edge'

export const callUpsertCourseMetadata = async (
  courseName: string,
  courseMetadata: CourseMetadataOptionalForUpsert,
) => {
  try {
    const existing_metadata: CourseMetadata | object = (await kv.hget('course_metadatas', courseName)) || {};
    const updated_metadata = { ...existing_metadata, ...courseMetadata };
    await kv.hset('course_metadatas', { [courseName]: updated_metadata });

    return { success: true };
  } catch (error) {
    console.error('Error setting course metadata:', error);
    return { success: false };
  }
};
