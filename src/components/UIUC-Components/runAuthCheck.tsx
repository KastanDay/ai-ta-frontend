import { CourseMetadata } from '~/types/courseMetadata'
import { extractUserEmails } from './AuthHelpers'

export const get_user_permission = (
  course_metadata: CourseMetadata,
  user: any,
  router: any,
) => {
  // const router = useRouter()
  // TODO: will definitely need to refactor this a bunch
  if (course_metadata && Object.keys(course_metadata).length > 0) {
    // if private && not signed in, redirect
    if (course_metadata.is_private && !user.isSignedIn) {
      console.log('private && not signed in, redirect ', user)
      return 'no_permission'
    }

    // GET ALL ASSOCIATED EMAIL ADDRESSES (could have multiple from different socials.)
    const curr_user_email_addresses = extractUserEmails()

    if (course_metadata.is_private == false) {
      // Course is public
      if (!user.isSignedIn) {
        return 'view'
      }

      if (
        // user must be be signed in now.
        curr_user_email_addresses.includes(course_metadata.course_owner) ||
        course_metadata.course_admins.some((email) =>
          curr_user_email_addresses.includes(email),
        )
      ) {
        // owner or admin
        return 'edit'
      } else {
        // course is public, so return view to non-admins.
        return 'view'
      }
    } else {
      // Course is Private
      if (!user.isSignedIn) {
        console.log(
          'User is not signed in. Course is private. Auth: no_permission.',
        )
        return 'no_permission'
      }

      if (
        curr_user_email_addresses.includes(course_metadata.course_owner) ||
        course_metadata.course_admins.some((email) =>
          curr_user_email_addresses.includes(email),
        )
      ) {
        // You are the course owner or an admin
        // Can edit and view.
        return 'edit'
      } else if (
        course_metadata.approved_emails_list.some((email) =>
          curr_user_email_addresses.includes(email),
        )
      ) {
        // Not owner or admin, can't edit. But is USER so CAN VIEW
        return 'view'
      } else {
        // Cannot edit or view
        console.log(
          'User is not an admin, owner, or approved user. Course is private. Auth: no_permission.',
        )
        return 'no_permission'
      }
    }
  } else {
    // no course_metadata
    throw new Error(
      `No course metadata provided. Course_metadata: ${course_metadata}`,
    )
  }
}
