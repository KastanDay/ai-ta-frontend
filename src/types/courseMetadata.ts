// all values are email addresses

// courseMetadata.ts
export interface CourseMetadata {
  is_private: boolean
  course_owner: string
  course_admins: string[]
  approved_emails_list: string[]
}

export interface CourseMetadataOptionalForUpsert {
  is_private: boolean | undefined
  course_owner: string | undefined
  course_admins: string[] | undefined
  approved_emails_list: string[] | undefined
}
