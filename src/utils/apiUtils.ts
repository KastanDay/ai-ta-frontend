// utils/apiUtils.ts
import {
  CourseMetadataOptionalForUpsert,
  type CourseMetadata,
} from '~/types/courseMetadata'
import { log } from 'next-axiom'
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios'
import { NextApiRequest } from 'next';

export const config = {
  runtime: 'edge',
}

export const callSetCourseMetadata = async (
  courseName: string,
  courseMetadata: CourseMetadata | CourseMetadataOptionalForUpsert,
) => {
  try {
    const response = await fetch('/api/UIUC-api/upsertCourseMetadata', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        courseName: courseName,
        courseMetadata: courseMetadata,
      }),
    })
    const data = await response.json()
    if (data.success) {
      console.log('Course metadata updated successfully')
      console.debug('Course metadata updated successfully')
      log.debug('Course metadata updated successfully', {
        course_name: courseName,
        course_metadata: courseMetadata,
      })

      return true
    } else {
      console.error('Error setting course metadata:', data.error)
      log.error('Error setting course metadata', {
        course_name: courseName,
        error: data.error,
      })
      return false
    }
  } catch (error) {
    console.error('Error setting course metadata:', error)
    log.error('Error setting course metadata', {
      course_name: courseName,
      error: error,
    })
    return false
  }
}

export const uploadToS3 = async (file: File | null, course_name: string) => {
  if (!file) return

  const uniqueFileName = `${uuidv4()}.${file.name.split('.').pop()}`;

  const requestObject = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type,
      courseName: course_name,
      uniqueFileName: uniqueFileName,
    }),
  }

  try {
    interface PresignedPostResponse {
      post: {
        url: string
        fields: { [key: string]: string }
      }
    }

    // Then, update the lines where you fetch the response and parse the JSON
    const response = await fetch('/api/UIUC-api/uploadToS3', requestObject)
    const data = (await response.json()) as PresignedPostResponse

    const { url, fields } = data.post as {
      url: string
      fields: { [key: string]: string }
    }
    const formData = new FormData()

    Object.entries(fields).forEach(([key, value]) => {
      formData.append(key, value)
    })

    formData.append('file', file)

    await fetch(url, {
      method: 'POST',
      body: formData,
    })

    console.log(file.name + 'uploaded to S3 successfully!!')
    return data.post.fields.key
  } catch (error) {
    console.error('Error uploading file:', error)
  }
}

export async function fetchPresignedUrl(filePath: string, page?: string) {
  try {
    const response = await axios.post('/api/download', {
      filePath,
      page,
    })
    if (response.status >= 400) {
      throw new Error(`Server responded with status code ${response.status}`);
    }
    return response.data.url
  } catch (error) {
    console.error('Error fetching presigned URL:', error)
    return null
  }
}

export async function fetchCourseMetadata(course_name: string) {
  try {

    const baseUrl = process.env.VERCEL_URL || 'http://localhost:3000';
    console.log('baseUrl:', baseUrl);
    const response = await fetch(
      `${baseUrl}/api/UIUC-api/getCourseMetadata?course_name=${course_name}`,
    )
    if (response.ok) {
      const data = await response.json();
      if (data.success === false) {
        throw new Error(
          data.message || 'An error occurred while fetching course metadata',
        );
      }
      if (
        data.course_metadata &&
        typeof data.course_metadata.is_private === 'string'
      ) {
        data.course_metadata.is_private =
          data.course_metadata.is_private.toLowerCase() === 'true';
      }
      return data.course_metadata;
    } else {
      throw new Error(
        `Error fetching course metadata: ${response.statusText || response.status}`,
      );
    }
  } catch (error) {
    console.error('Error fetching course metadata:', error);
    throw error;
  }
}