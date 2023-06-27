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

  console.log('in not_authorized.tsx -- props: ', props)

  const getCurrentPageName = () => {
    // /CS-125/materials --> CS-125
    console.log('in not_auth router: ', router)
    console.log('in not_auth router.asPath: ', router.asPath)
    return router.asPath.slice(1).split('/')[0] as string
  }

  const [courseMetadata, setCourseMetadata] = useState<CourseMetadata>()
  const [loading, setLoading] = useState<boolean>(true) // Add loading state
  const course_name = getCurrentPageName()
  // const course_name = router.query.course_name as string

  console.log('not_authorized.tsx -- Course name?? ', course_name)

  // Get CourseMetadata
  useEffect(() => {
    async function fetchCourseMetadata(course_name: string) {
      try {
        console.log('course_name in fetchmetadta: ', course_name)
        const response = await fetch(
          `/api/UIUC-api/getCourseMetadata?course_name=${course_name}`,
        )

        if (response.ok) {
          const data = await response.json()
          if (data.success === false) {
            console.error('An error occurred while fetching course metadata')
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
      console.log('in not_authorized.tsx -- metadata: ', courseMetadata)
      setCourseMetadata(metadata)
      setLoading(false) // Update loading state when metadata is fetched
    })
  }, [course_name])

  if (courseMetadata != null) {
    console.log('in NOT_AUTHED -- Course meatadata', courseMetadata)

    const user_permission = get_user_permission(
      courseMetadata,
      clerk_user,
      router,
    )
    console.log('in NOT_AUTHED -- user_permission: ', user_permission)
    if (user_permission === 'edit') {
      // You are the course owner or an admin
      // Can edit and view.
      console.log('CAN view course, AND EDIT course')
      // console.log('curr_user_email: ', curr_user_email_addresses)
      console.log('courseMetadata.course_owner: ', courseMetadata.course_owner)
      console.log(
        'courseMetadata.course_admins: ',
        courseMetadata.course_admins,
      )

      // redirect to course
      router.push(`/${course_name}/gpt4`)
    } else if (user_permission === 'view') {
      // Not owner or admin, can't edit. But is USER so CAN VIEW
      // console.log('CAN view course, cannot EDIT course')
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
      console.log('in NOT_AUTHED -- Cannot view course')
      return (
        <>
          <CannotViewCourse course_name={course_name} />
        </>
      )
    }
  }

  // if (loading) {
  //   return (
  //     <>
  //       <LoadingSpinner />
  //     </>
  //   );
  // }

  return (
    <>
      <MainPageBackground>
        <LoadingSpinner />
      </MainPageBackground>
    </>
  )
}
export default NotAuthorizedPage
