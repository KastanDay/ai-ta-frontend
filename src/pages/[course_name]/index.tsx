// src/pages/[course_name]/index.tsx
import { type NextPage } from 'next'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useUser } from '@clerk/nextjs'
import { CourseMetadata } from '~/types/courseMetadata'
import MakeNewCoursePage from '~/components/UIUC-Components/MakeNewCoursePage'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { Text } from '@mantine/core'
import { type CourseMetadata } from '~/types/courseMetadata'
import { useUser } from '@clerk/nextjs'
import { LoadingSpinner } from '~/components/UIUC-Components/LoadingSpinner'
import { get_user_permission } from '~/components/UIUC-Components/runAuthCheck'
import { MainPageBackground } from '~/components/UIUC-Components/MainPageBackground'
import { extractEmailsFromClerk } from '~/components/UIUC-Components/clerkHelpers'

const IfCourseExists: NextPage = () => {
  const router = useRouter()
  const course_name = router.query.course_name as string
  const clerk_user = useUser()
  const [courseMetadataIsLoaded, setCourseMetadataIsLoaded] = useState(false)
  const [course_metadata, setCourseMetadata] = useState<CourseMetadata | null>(
    null,
  )

  useEffect(() => {
    const fetchCourseMetadata = async () => {
      const response = await fetch(
        `/api/UIUC-api/getCourseMetadata?course_name=${course_name}`,
      )
      const data = await response.json()
      console.log('in [course_name]/index.tsx -- data: ', data.course_metadata)
      setCourseMetadata(data.course_metadata)
      setCourseMetadataIsLoaded(true)
    }

    fetchCourseMetadata()
}, [course_name])

const fetchCourseMetadata = async () => {
  const response = await fetch(`/api/UIUC-api/getCourseMetadata?course_name=${course_name}`)
  const data = await response.json()
  console.log("in [course_name]/index.tsx -- data: ", data.course_metadata)
  setCourseMetadata(data.course_metadata)
  setCourseMetadataIsLoaded(true)
}

fetchCourseMetadata()

  useEffect(() => {
    if (courseMetadataIsLoaded && course_metadata != null) {
      if (!course_metadata.is_private) {
        // Public
        console.log('Public course, redirecting to chat page')
        router.replace(`/${course_name}/chat`)
      }
    }

    if (!clerk_user.isLoaded || !courseMetadataIsLoaded) {
      return
    }
    if (course_metadata == null) {
      console.log('Course does not exist, redirecting to new course page')
      router.replace(`/new?course_name=${course_name}`)
      return
    }
    // course is private & not signed in, must sign in
    if (course_metadata.is_private && !clerk_user.isSignedIn) {
      console.log(
        'User not logged in',
        clerk_user.isSignedIn,
        clerk_user.isLoaded,
        course_name,
      )
      console.log(
        'in [course_name]/index.tsx -- course_metadata.is_private && !clerk_user.isSignedIn',
        course_metadata.is_private,
        clerk_user.isSignedIn,
      )
      // router.replace(`/sign-in?${course_name}`)
      return
    }
    if (clerk_user.isLoaded) {
      console.log(
        'in [course_name]/index.tsx -- clerk_user loaded and working :)',
      )
      if (course_metadata != null) {
        const permission_str = get_user_permission(
          course_metadata,
          clerk_user,
          router,
        )

        console.log(
          'in [course_name]/index.tsx -- permission_str',
          permission_str,
        )

        if (permission_str == 'edit' || permission_str == 'view') {
          // ✅ AUTHED
          console.log(
            'in [course_name]/index.tsx - Course exists & user is properly authed, redirecting to gpt4 page',
          )
          router.replace(`/${course_name}/chat`)
        } else {
          // 🚫 NOT AUTHED
          console.log(
            'NOT AUTHED: ',
            permission_str,
            clerk_user,
            course_metadata,
          )
          router.replace(`/${course_name}/not_authorized`)
        }
      } else {
        // 🆕 MAKE A NEW COURSE
        console.log('Course does not exist, redirecting to materials page')
        router.push(`/${course_name}/materials`)
      }
    } else {
      console.log('in [course_name]/index.tsx -- clerk_user NOT LOADED yet...')
    }
  }, [clerk_user.isLoaded, course_metadata, courseMetadataIsLoaded])

  if (
    !courseMetadataIsLoaded ||
    !clerk_user.isLoaded ||
    course_metadata == null ||
    (course_metadata.is_private && !clerk_user.isSignedIn)
  ) {
    return (
      <MainPageBackground>
        <LoadingSpinner />
      </MainPageBackground>
    )
  }
  // ------------------- 👆 MOST BASIC AUTH CHECK 👆 -------------------

  const curr_user_emails = extractEmailsFromClerk(clerk_user.user)

  // here we redirect depending on Auth.
  return (
    <>
      {course_metadata ? (
        <MainPageBackground>
          <LoadingSpinner />
          <br></br>
          <Text weight={800}>Checking if course exists...</Text>
        </MainPageBackground>
      ) : (
        <MakeNewCoursePage
          course_name={course_name}
          current_user_email={curr_user_emails[0] as string}
        />
      )}
    </>
  )
}
export default IfCourseExists
