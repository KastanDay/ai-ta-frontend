import { type NextPage } from 'next'
import MakeOldCoursePage from '~/components/UIUC-Components/MakeOldCoursePage'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useUser } from '@clerk/nextjs'
import { CannotEditGPT4Page } from '~/components/UIUC-Components/CannotEditGPT4'
import { LoadingSpinner } from '~/components/UIUC-Components/LoadingSpinner'
import { MainPageBackground } from '~/components/UIUC-Components/MainPageBackground'
import { AuthComponent } from '~/components/UIUC-Components/AuthToEditCourse'
import { Title } from '@mantine/core'
import { extractEmailsFromClerk } from '~/components/UIUC-Components/clerkHelpers'
import { montserrat_heading } from 'fonts'
import { CourseMetadata } from '~/types/courseMetadata'
import { fetchCourseMetadata } from '~/utils/apiUtils'

const CourseMain: NextPage = () => {
  const router = useRouter()

  const getCurrentPageName = () => {
    return router.query.course_name as string
  }

  // const course_name = GetCurrentPageName() as string
  const { user, isLoaded, isSignedIn } = useUser()
  const [courseName, setCourseName] = useState<string | null>(null)
  const [courseData, setCourseData] = useState()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!router.isReady) return
    const fetchCourseData = async () => {
      const course_name = getCurrentPageName()

      // check exists
      const metadata: CourseMetadata = await fetchCourseMetadata(course_name)
      if (metadata === null) {
        await router.push('/new?course_name=' + course_name)
        return
      }

      // Get all data
      const response = await fetch(
        `https://flask-production-751b.up.railway.app/getAll?course_name=${course_name}`,
      )
      const data = await response.json()
      setCourseData(data.distinct_files)
      setCourseName(course_name)
      setIsLoading(false)
    }
    fetchCourseData()
  }, [router.isReady])

  // Check auth - https://clerk.com/docs/nextjs/read-session-and-user-data
  if (!isLoaded || isLoading || courseName == null) {
    return (
      <MainPageBackground>
        <LoadingSpinner />
      </MainPageBackground>
    )
  }

  if (!isSignedIn && courseName) {
    console.log('User not logged in', isSignedIn, isLoaded, courseName)
    return <AuthComponent course_name={courseName} />
  }

  const user_emails = extractEmailsFromClerk(user)

  // if their account is somehow broken (with no email address)
  if (user_emails.length == 0) {
    return (
      <MainPageBackground>
        <Title
          className={`${montserrat_heading.variable} font-montserratHeading`}
          variant="gradient"
          gradient={{ from: 'gold', to: 'white', deg: 50 }}
          order={3}
          p="xl"
          style={{ marginTop: '4rem' }}
        >
          You&apos;ve encountered a software bug!<br></br>Your account has no
          email address. Please shoot me an email so I can fix it for you:{' '}
          <a className="goldUnderline" href="mailto:kvday2@illinois.edu">
            kvday2@illinois.edu
          </a>
        </Title>
      </MainPageBackground>
    )
  }

  if (!courseName) {
    return (
      <MainPageBackground>
        <LoadingSpinner />
      </MainPageBackground>
    )
  }

  if (isLoaded) {
    if (
      courseName.toLowerCase() == 'gpt4' ||
      courseName.toLowerCase() == 'global' ||
      courseName.toLowerCase() == 'extreme'
    ) {
      // Don't edit certain special pages (no context allowed)
      return <CannotEditGPT4Page course_name={courseName as string} />
    }

    return (
      <>
        <MakeOldCoursePage
          course_name={courseName as string}
          course_data={courseData as any}
        />
      </>
    )
  } else {
    return (
      <MainPageBackground>
        <LoadingSpinner />
      </MainPageBackground>
    )
  }
}
export default CourseMain
