// all values are email addresses
export interface CourseMetadata {
  is_private: boolean
  course_owner: string
  course_admins: string[]
  approved_emails_list: string[]
}
