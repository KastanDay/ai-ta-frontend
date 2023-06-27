import { redirect } from 'next/dist/server/api-utils'
import { useRouter } from 'next/router'
import { CourseMetadata } from '~/types/courseMetadata'

export const get_user_permission = (
  course_metadata: CourseMetadata,
  clerk_user: any,
  router: any,
) => {
  // const router = useRouter()

  if (course_metadata && Object.keys(course_metadata).length > 0) {
    console.log('in runAuthCheck -- Course metadata', course_metadata)
    console.log('in runAuthCheck -- USER', clerk_user)

    // if private && not signed in, redirect
    if (course_metadata.is_private && !clerk_user.isSignedIn) {
      console.log('private && not signed in, redirect ', clerk_user)
      // todo: I think this is causing problems!!
      // router.push(`/sign-in`)
      return 'no_permission'
    }

    const curr_user_email_addresses = clerk_user.user?.emailAddresses?.map(
      (email: { emailAddress: any }) => email.emailAddress,
    ) as string[]

    // prints
    console.log('runAuthCheck -- CAN view course, cannot EDIT course')
    console.log('runAuthCheck -- curr_user_email: ', curr_user_email_addresses)
    console.log(
      'runAuthCheck -- courseMetadata.course_owner: ',
      course_metadata.course_owner,
    )
    console.log(
      'runAuthCheck -- courseMetadata.course_admins: ',
      course_metadata.course_admins,
    )

    if (course_metadata.is_private == false) {
      // Course is public
      console.log('runAuthCheck -- COURSE IS PUBLIC')
      if (
        curr_user_email_addresses.includes(course_metadata.course_owner) ||
        course_metadata.course_admins.some((email) =>
          curr_user_email_addresses.includes(email),
        )
      ) {
        // owner or admin
        console.log("runAuthCheck -- returning: 'edit'")
        return 'edit'
      } else {
        // course is public, so return view to non-admins.
        console.log("returning: 'edit'")
        return 'view'
      }
    } else {
      // Course is Private
      console.log('runAuthCheck -- COURSE IS PRIVATE')
      if (
        curr_user_email_addresses.includes(course_metadata.course_owner) ||
        course_metadata.course_admins.some((email) =>
          curr_user_email_addresses.includes(email),
        )
      ) {
        // You are the course owner or an admin
        // Can edit and view.
        console.log("runAuthCheck -- returning: 'edit'")
        return 'edit'
      } else if (
        course_metadata.approved_emails_list.some((email) =>
          curr_user_email_addresses.includes(email),
        )
      ) {
        // Not owner or admin, can't edit. But is USER so CAN VIEW
        // console.log('in runAuthCheck -- CAN view course, cannot EDIT course')
        console.log("runAuthCheck -- returning: 'view'")
        return 'view'
      } else {
        // Cannot edit or view
        console.log("runAuthCheck -- returning: 'no_permission'")
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
