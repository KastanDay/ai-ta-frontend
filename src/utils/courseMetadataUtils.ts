import { CourseMetadataOptionalForUpsert } from '~/types/courseMetadata'

export async function setCourseMetadata(
  course_name: string,
  metadata: CourseMetadataOptionalForUpsert
) {
  // Assuming you're using a database like MongoDB
  const updatedMetadata = {
    ...metadata,
    project_name: metadata.project_name, // Add this line
  }

  // Update the database with the new metadata
  await db.collection('courses').updateOne(
    { course_name },
    { $set: updatedMetadata },
    { upsert: true }
  )
}

export async function getCourseMetadata(course_name: string): Promise<CourseMetadata | null> {
  try {
    // Assuming you're using a database like MongoDB
    const courseMetadata = await db.collection('courses').findOne({ course_name })

    if (courseMetadata) {
      return {
        ...courseMetadata,
        project_name: courseMetadata.project_name, // Add this line
      }
    }

    return null
  } catch (error) {
    console.error('Error fetching course metadata:', error)
    return null
  }
}
