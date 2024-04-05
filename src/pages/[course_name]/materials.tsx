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
import Navbar from '~/components/UIUC-Components/navbars/Navbar'
import { CourseMetadata } from '~/types/courseMetadata'
import { fetchCourseMetadata } from '~/utils/apiUtils'

const CourseMain: NextPage = () => {
  const router = useRouter()

  const getCurrentPageName = () => {
    return router.query.course_name as string
  }

  const courseName = getCurrentPageName() as string
  const { user, isLoaded, isSignedIn } = useUser()
  const [currentEmail, setCurrentEmail] = useState('')
  const [metadata, setMetadata] = useState<CourseMetadata | null>()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!router.isReady) return
    const fetchCourseData = async () => {
      const userEmail = extractEmailsFromClerk(user)
      setCurrentEmail(userEmail[0] as string)

      try {
        const metadata: CourseMetadata = (await fetchCourseMetadata(
          courseName,
        )) as CourseMetadata

        if (metadata === null) {
          await router.push('/new?course_name=' + courseName)
          return
        }

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
  }, [router.isReady, courseName, isLoaded])

  // Check auth - https://clerk.com/docs/nextjs/read-session-and-user-data
  if (!isLoaded || isLoading || !metadata || courseName == null) {
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
        metadata={metadata}
        current_email={currentEmail}
      />
    </>
  )
}
export default CourseMain
