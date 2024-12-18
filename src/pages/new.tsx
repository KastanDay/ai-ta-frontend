import { useRouter } from 'next/router'
import React, { useEffect } from 'react'
import MakeNewCoursePage from '~/components/UIUC-Components/MakeNewCoursePage'
import { MainPageBackground } from '~/components/UIUC-Components/MainPageBackground'
import { LoadingSpinner } from '~/components/UIUC-Components/LoadingSpinner'
import { AuthComponent } from '~/components/UIUC-Components/AuthToEditCourse'
import { useSession } from '~/lib/auth-client'
import { extractUserEmails } from '~/components/UIUC-Components/AuthHelpers'

const NewCoursePage = () => {
  const router = useRouter()
  const { data: session, isPending} = useSession()
  const { course_name } = router.query

  useEffect(() => {
    // You can add any additional logic you need here, such as fetching data based on the course_name
  }, [course_name])

  if (isPending) {
    return (
      <MainPageBackground>
        <LoadingSpinner />
      </MainPageBackground>
    )
  }

  if (!session?.session) {
    console.log('User not logged in', session?.session, !isPending, 'NewCoursePage')
    return (
      <AuthComponent
        course_name={course_name ? (course_name as string) : 'new'}
      />
    )
  }

  const user_emails = extractUserEmails()

  return (
    <MakeNewCoursePage
      project_name={course_name as string}
      current_user_email={user_emails[0] as string}
      is_new_course={true}
    />
  )
}

export default NewCoursePage
