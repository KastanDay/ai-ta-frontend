import { type NextPage } from 'next'
import MakeNewCoursePage from '~/components/UIUC-Components/MakeNewCoursePage'
import MakeNomicVisualizationPage from '~/components/UIUC-Components/MakeQueryAnalysisPage'
import React, { useEffect, useState } from 'react'
import { Montserrat } from 'next/font/google'
import { useRouter } from 'next/router'
import { useUser } from '@clerk/nextjs'
import { CannotEditGPT4Page } from '~/components/UIUC-Components/CannotEditGPT4'
import { LoadingSpinner } from '~/components/UIUC-Components/LoadingSpinner'
import { MainPageBackground } from '~/components/UIUC-Components/MainPageBackground'
import { AuthComponent } from '~/components/UIUC-Components/AuthToEditCourse'
import { Button, Flex, Text, Textarea, Title } from '@mantine/core'
import { extractEmailsFromClerk } from '~/components/UIUC-Components/clerkHelpers'
import { DEFAULT_SYSTEM_PROMPT } from '~/utils/app/const'
import { type CourseMetadata } from '~/types/courseMetadata'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import { callSetCourseMetadata } from '~/utils/apiUtils'
import Navbar from '~/components/UIUC-Components/navbars/Navbar'
import Head from 'next/head'

const montserrat = Montserrat({
  weight: '700',
  subsets: ['latin'],
})

const montserrat_light = Montserrat({
  weight: '400',
  subsets: ['latin'],
})

const CourseMain: NextPage = () => {
  const router = useRouter()

  const GetCurrentPageName = () => {
    // return router.asPath.slice(1).split('/')[0]
    // Possible improvement.
    return router.query.course_name as string // Change this line
  }

  const course_name = GetCurrentPageName() as string
  const { user, isLoaded, isSignedIn } = useUser()
  const [courseData, setCourseData] = useState(null)
  const [courseExists, setCourseExists] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [courseMetadata, setCourseMetadata] = useState<CourseMetadata | null>(null);
  const clerk_user = useUser()
  const emails = extractEmailsFromClerk(clerk_user.user)
  const currUserEmail = emails[0]


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
      const response_metadata = await fetch(`/api/UIUC-api/getAllCourseMetadata?currUserEmail=${currUserEmail}`);
      const allMetadata = await response_metadata.json();
      console.log(allMetadata);
      const metadataObj = allMetadata?.find((meta: { [key: string]: CourseMetadata }) => Object.keys(meta)[0] === course_name) || null;
      const metadata = metadataObj ? Object.values(metadataObj)[0] as CourseMetadata : null;
      setCourseMetadata(metadata);
      if (metadata) {
        setSystemPrompt(metadata.system_prompt || DEFAULT_SYSTEM_PROMPT);
      }
      setIsLoading(false)

    }
    fetchCourseData()

  }, [router.isReady])

  const handleSystemPromptSubmit = async () => {
    const courseName = course_name;
    if (courseMetadata && courseName) {
      courseMetadata.system_prompt = systemPrompt;
      const success = await callSetCourseMetadata(courseName, courseMetadata);
      if (!success) {
        console.log('Error updating course metadata');
      }
    }
  }

  // Check auth - https://clerk.com/docs/nextjs/read-session-and-user-data
  if (!isLoaded || isLoading) {
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
          className={montserrat.className}
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
        <LoadingSpinner />
      </MainPageBackground>
    )
  }

  if (courseExists === false) {
    return (
      <MakeNewCoursePage
        course_name={course_name as string}
        current_user_email={user_emails[0] as string}
      />
    )
  }

  return (
    <>
      <Navbar course_name={course_name} />

      <Head>
        <title>{course_name}</title>
        <meta
          name="description"
          content="The AI teaching assistant built for students at UIUC."
        />
        <link rel="icon" href="/favicon.ico" />
        {/* <Header /> */}
      </Head>
      <main className="course-page-main min-w-screen flex min-h-screen flex-col items-center">
        <div className="items-left flex w-full flex-col justify-center py-0">
          <Flex direction="column" align="center" w="100%">
            <div
              // Course files header/background
              className="mx-auto mt-[2%] w-[90%] items-start rounded-2xl shadow-md shadow-purple-600"
              style={{ zIndex: 1, background: '#15162c' }}
            >
              <Flex direction="row" justify="space-between">
                <div className="flex flex-row items-start justify-start">
                  <Title
                    className={`${montserrat_heading.variable} font-montserratHeading`}
                    variant="gradient"
                    gradient={{
                      from: 'hsl(280,100%,70%)',
                      to: 'white',
                      deg: 185,
                    }}
                    order={3}
                    p="xl"
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    {' '}
                    Customize the system prompt for your project: {course_name}
                  </Title>
                </div>

              </Flex>
            </div>
            <div className="pt-5"></div>
            <div style={{ width: '60%' }}>
              <Textarea
                autosize
                minRows={2}
                maxRows={4}
                placeholder="Enter a system prompt"
                className={`${montserrat_paragraph.variable} font-montserratParagraph`}
                value={systemPrompt}
                onChange={(e) => {
                  setSystemPrompt(e.target.value)
                }}
              />
              <div style={{ paddingTop: '10px', width: '100%' }}>

                <Button
                  className="relative m-1 w-[20%] self-end bg-purple-800 text-white hover:border-indigo-600 hover:bg-indigo-600"
                  type="submit"
                  onClick={handleSystemPromptSubmit}
                >
                  Update System Prompt
                </Button>
              </div>
            </div>

          </Flex>
        </div>
      </main>
    </>
  )
}
export default CourseMain
