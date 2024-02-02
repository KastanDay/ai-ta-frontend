// src/pages/[course_name]/courseMetadata.tsx
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useUser } from '@clerk/nextjs'
import { LoadingSpinner } from '~/components/UIUC-Components/LoadingSpinner'
import { MainPageBackground } from '~/components/UIUC-Components/MainPageBackground'
import { extractEmailsFromClerk } from '~/components/UIUC-Components/clerkHelpers'
import { Text } from '@mantine/core'
import { get_user_permission } from '~/components/UIUC-Components/runAuthCheck'
import { CourseMetadata } from '~/types/courseMetadata'
import MakeNewCoursePage from '~/components/UIUC-Components/MakeNewCoursePage'

const CourseMetadataPage: React.FC = () => {
  const router = useRouter()
  const course_name = router.query.course_name as string
  const clerk_user = useUser()
  const [courseMetadataIsLoaded, setCourseMetadataIsLoaded] = useState(false)
  const [course_metadata, setCourseMetadata] = useState<CourseMetadata | null>(null)

  useEffect(() => {
    const fetchCourseMetadata = async () => {
      const response = await fetch(`/api/UIUC-api/getCourseMetadata?course_name=${course_name}`)
      const data = await response.json()
      setCourseMetadata(data.course_metadata)
      setCourseMetadataIsLoaded(true)
    }

    fetchCourseMetadata()
  }, [course_name])

  useEffect(() => {
    if (courseMetadataIsLoaded && course_metadata != null) {
      if (!course_metadata.is_private) {
        router.replace(`/${course_name}/chat`)
      }
    }

    if (!clerk_user.isLoaded || !courseMetadataIsLoaded) {
      return
    }

    if (course_metadata == null) {
      router.replace(`/new?course_name=${course_name}`)
      return
    }

    if (course_metadata.is_private && !clerk_user.isSignedIn) {
      // router.replace(`/sign-in?${course_name}`)
      return
    }

    if (clerk_user.isLoaded) {
      if (course_metadata != null) {
        const permission_str = get_user_permission(course_metadata, clerk_user, router)

        if (permission_str == 'edit' || permission_str == 'view') {
          router.replace(`/${course_name}/chat`)
        } else {
          router.replace(`/${course_name}/not_authorized`)
        }
      } else {
        router.push(`/${course_name}/materials`)
      }
    } else {
      console.log('clerk_user NOT LOADED yet...')
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

  const curr_user_emails = extractEmailsFromClerk(clerk_user.user)

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

export default CourseMetadataPage
