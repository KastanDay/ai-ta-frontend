// all values are email addresses

// courseMetadata.ts
export interface CourseMetadata {
  is_private: boolean
  course_owner: string
  course_admins: string[]
  approved_emails_list: string[]
  example_questions: string[] | undefined
  banner_image_s3: string | undefined
  course_intro_message: string | undefined
  openai_api_key: string | undefined
  system_prompt: string | undefined
}

export interface CourseMetadataOptionalForUpsert {
  is_private: boolean | undefined
  course_owner: string | undefined
  course_admins: string[] | undefined
  approved_emails_list: string[] | undefined
  example_questions: string[] | undefined
  banner_image_s3: string | undefined
  course_intro_message: string | undefined
  openai_api_key: string | undefined
}
