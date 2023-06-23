// all values are email addresses
export interface CourseMetadata {
  isPrivate: boolean
  course_owner: string
  course_admins: string[]
  approved_emails_list: string[]
}
