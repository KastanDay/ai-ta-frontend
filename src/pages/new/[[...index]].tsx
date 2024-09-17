import { useRouter } from 'next/router'
import React, { useEffect } from 'react'
import MakeNewCoursePage from '~/components/UIUC-Components/MakeNewCoursePage'
import { extractEmailsFromClerk } from '~/components/UIUC-Components/clerkHelpers'
import { SignedOut, SignIn, SignInButton, useUser } from '@clerk/nextjs'
import { MainPageBackground } from '~/components/UIUC-Components/MainPageBackground'
import { LoadingSpinner } from '~/components/UIUC-Components/LoadingSpinner'
import { AuthComponent } from '~/components/UIUC-Components/AuthToEditCourse'
import { montserrat_heading } from 'fonts'

const NewCoursePage = () => {
  const router = useRouter()
  const { user, isLoaded, isSignedIn } = useUser()
  const { course_name } = router.query

  useEffect(() => {
    // You can add any additional logic you need here, such as fetching data based on the course_name
  }, [course_name])

  if (!isLoaded) {
    return (
      <MainPageBackground>
        <LoadingSpinner />
      </MainPageBackground>
    )
  }

  if (!isSignedIn) {
    console.debug('User not logged in', isSignedIn, isLoaded, 'NewCoursePage')
    return (
      <MainPageBackground>
        {/* <SignIn /> */}
        <SignedOut>
          {/* Signed out users get sign in button */}
          <SignInButton
            forceRedirectUrl={'https://chat.illinois.edu/new'}
            fallbackRedirectUrl={'https://chat.illinois.edu/new'}
          >
            <button className="rounded-sm px-[14px] py-[10px] text-[13px] font-bold text-[#f1f5f9] transition-all duration-100 ease-in-out hover:rounded-[10px] hover:bg-[rgba(255,255,255,0.1)] hover:text-[hsl(280,100%,70%)] hover:no-underline data-[active=true]:rounded-[10px] data-[active=true]:border-b-2 data-[active=true]:border-[hsl(280,100%,70%)] data-[active=true]:bg-[rgba(255,255,255,0.1)] data-[active=true]:text-right data-[active=true]:text-[hsl(280,100%,70%)] data-[active=true]:no-underline">
              <span
                className={`${montserrat_heading.variable} font-montserratHeading`}
              >
                Sign in / Sign up
              </span>
            </button>
          </SignInButton>
        </SignedOut>
      </MainPageBackground>
      // <AuthComponent
      //   course_name={course_name ? (course_name as string) : 'new'}
      // />
    )
  }

  const user_emails = extractEmailsFromClerk(user)

  return (
    <MakeNewCoursePage
      project_name={course_name as string}
      current_user_email={user_emails[0] as string}
      is_new_course={true}
    />
  )
}

export default NewCoursePage
