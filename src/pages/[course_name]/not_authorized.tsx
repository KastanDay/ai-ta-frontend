import { useUser } from '@clerk/nextjs'
import { NextPage } from 'next'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { CanViewOnlyCourse } from '~/components/UIUC-Components/CanViewOnlyCourse'
import { CannotEditCourse } from '~/components/UIUC-Components/CannotEditCourse'
import { CannotViewCourse } from '~/components/UIUC-Components/CannotViewCourse'
import { LoadingSpinner } from '~/components/UIUC-Components/LoadingSpinner'
import { MainPageBackground } from '~/components/UIUC-Components/MainPageBackground'
import { get_user_permission } from '~/components/UIUC-Components/runAuthCheck'
import { CourseMetadata } from '~/types/courseMetadata'

const NotAuthorizedPage: NextPage = (props) => {
  const router = useRouter()
  const clerk_user = useUser()

  const getCurrentPageName = () => {
    // /CS-125/materials --> CS-125
    return router.asPath.slice(1).split('/')[0] as string
  }

  const [courseMetadata, setCourseMetadata] = useState<CourseMetadata>()
  const course_name = getCurrentPageName()

  // Get CourseMetadata
  useEffect(() => {
    async function fetchCourseMetadata(course_name: string) {
      try {
        const response = await fetch(
          `/api/UIUC-api/getCourseMetadata?course_name=${course_name}`,
        )

        if (response.ok) {
          const data = await response.json()
          if (data.success === false) {
            console.error(
              'not_authorized.tsx -- An error occurred while fetching course metadata',
            )
            return null
          }
          return data.course_metadata
        } else {
          console.error(`Error fetching course metadata: ${response.status}`)
          return null
        }
      } catch (error) {
        console.error('Error fetching course metadata:', error)
        return null
      }
    }
    fetchCourseMetadata(course_name).then((metadata) => {
      setCourseMetadata(metadata)
    })
  }, [course_name])

  if (courseMetadata != null && clerk_user.isLoaded) {
    const user_permission = get_user_permission(
      courseMetadata,
      clerk_user,
      router,
    )
    if (user_permission === 'edit') {
      // Can edit and view. You are the course owner or an admin
      // redirect to course
      router.push(`/${course_name}/gpt4`)
    } else if (user_permission === 'view') {
      // Not owner or admin, can't edit. But is USER so CAN VIEW
      return (
        <>
          <CanViewOnlyCourse
            course_name={course_name}
            course_metadata={courseMetadata}
          />
        </>
      )
    } else {
      // Cannot edit or view
      return (
        <>
          <CannotViewCourse course_name={course_name} />
        </>
      )
    }
  }

  return (
    <>
      <MainPageBackground>
        <LoadingSpinner />
      </MainPageBackground>
    </>
  )
}
export default NotAuthorizedPage
