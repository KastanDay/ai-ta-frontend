import { type NextPage } from 'next'
import MakeNewCoursePage from '~/components/UIUC-Components/MakeNewCoursePage'
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
import Navbar from '~/components/UIUC-Components/navbars/Navbar'
import { CourseMetadata } from '~/types/courseMetadata'
import { fetchCourseMetadata } from '~/utils/apiUtils'

const CourseMain: NextPage = () => {
  const router = useRouter()

  const GetCurrentPageName = () => {
    // return router.asPath.slice(1).split('/')[0]
    // Possible improvement.
    return router.query.course_name as string // Change this line
  }

  const course_name = GetCurrentPageName() as string
  const { user, isLoaded, isSignedIn } = useUser()
  const [currentEmail, setCurrentEmail] = useState('')
  const [metadata, setMetadata] = useState<CourseMetadata | null>(null)
  const [courseExists, setCourseExists] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchCourseData = async () => {
      if (course_name == undefined) {
        return
      }
      const response = await fetch(
        `/api/UIUC-api/getCourseExists?course_name=${course_name}`,
      )
      const data = await response.json()
      setCourseExists(data)

      const userEmail = extractEmailsFromClerk(user)
      setCurrentEmail(userEmail[0] as string)

      try {
        const metadata: CourseMetadata = (await fetchCourseMetadata(
          course_name,
        )) as CourseMetadata

        if (metadata && metadata.is_private) {
          metadata.is_private = JSON.parse(
            metadata.is_private as unknown as string,
          )
        }
        setMetadata(metadata)
      } catch (error) {
        console.error(error)
        // alert('An error occurred while fetching course metadata. Please try again later.')
      }
      setIsLoading(false)
    }
    fetchCourseData()
  }, [router.isReady, course_name, isLoaded])

  // Check auth - https://clerk.com/docs/nextjs/read-session-and-user-data
  if (!isLoaded || isLoading || !metadata) {
    return (
      <MainPageBackground>
        <LoadingSpinner />
      </MainPageBackground>
    )
  }

  if (!isSignedIn) {
    console.log('User not logged in', isSignedIn, isLoaded, course_name)
    return <AuthComponent course_name={course_name} />
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

  // Don't edit certain special pages (no context allowed)
  if (
    course_name.toLowerCase() == 'gpt4' ||
    course_name.toLowerCase() == 'global' ||
    course_name.toLowerCase() == 'extreme'
  ) {
    return <CannotEditGPT4Page course_name={course_name as string} />
  }

  if (courseExists === null) {
    return (
      <MainPageBackground>
        {/* add the navbar if have access */}
        <Navbar />
        <LoadingSpinner />
      </MainPageBackground>
    )
  }

  if (metadata === null && !isLoading) {
    return (
      <MakeNewCoursePage
        course_name={course_name as string}
        current_user_email={user_emails[0] as string}
      />
    )
  }

  return (
    <>
      <MakeOldCoursePage
        course_name={course_name as string}
        metadata={metadata}
        current_email={currentEmail}
      />
    </>
  )
}
export default CourseMain
