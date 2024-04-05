import { type NextPage } from 'next'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useUser } from '@clerk/nextjs'
import { CannotEditGPT4Page } from '~/components/UIUC-Components/CannotEditGPT4'
import { LoadingSpinner } from '~/components/UIUC-Components/LoadingSpinner'
import { MainPageBackground } from '~/components/UIUC-Components/MainPageBackground'
import { AuthComponent } from '~/components/UIUC-Components/AuthToEditCourse'
import { Button, Flex, Text, Textarea, Title } from '@mantine/core'
import { DEFAULT_SYSTEM_PROMPT } from '~/utils/app/const'
import { type CourseMetadata } from '~/types/courseMetadata'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import { callSetCourseMetadata, fetchCourseMetadata } from '~/utils/apiUtils'
import Navbar from '~/components/UIUC-Components/navbars/Navbar'
import Head from 'next/head'

const CourseMain: NextPage = () => {
  const router = useRouter()

  const getCurrentPageName = () => {
    return router.query.course_name as string
  }

  const { user, isLoaded, isSignedIn } = useUser()
  const [isLoading, setIsLoading] = useState(true)
  const [systemPrompt, setSystemPrompt] = useState('')
  const [courseName, setCourseName] = useState<string | null>(null)
  const [courseMetadata, setCourseMetadata] = useState<CourseMetadata | null>(
    null,
  )

  useEffect(() => {
    const fetchCourseData = async () => {
      const local_course_name = getCurrentPageName()

      // Check exists
      const metadata: CourseMetadata =
        await fetchCourseMetadata(local_course_name)
      if (metadata === null) {
        await router.push('/new?course_name=' + local_course_name)
        return
      }

      setCourseName(local_course_name)
      setCourseMetadata(metadata)
      setSystemPrompt(metadata.system_prompt || DEFAULT_SYSTEM_PROMPT)
      setIsLoading(false)
    }
    fetchCourseData()
  }, [router.isReady])

  const handleSystemPromptSubmit = async () => {
    if (courseMetadata && courseName && systemPrompt) {
      courseMetadata.system_prompt = systemPrompt
      const success = await callSetCourseMetadata(courseName, courseMetadata)
      if (!success) {
        console.log('Error updating course metadata')
      }
    }
  }

  const resetSystemPrompt = async () => {
    if (courseMetadata && courseName) {
      courseMetadata.system_prompt = DEFAULT_SYSTEM_PROMPT
      const success = await callSetCourseMetadata(courseName, courseMetadata)
      if (!success) {
        alert('Error resetting system prompt')
      }
    } else {
      alert('Error resetting system prompt')
    }
  }

  // Check auth - https://clerk.com/docs/nextjs/read-session-and-user-data
  if (!isLoaded || isLoading || courseName == null) {
    return (
      <MainPageBackground>
        <LoadingSpinner />
      </MainPageBackground>
    )
  }

  if (!isSignedIn) {
    console.log('User not logged in', isSignedIn, isLoaded, courseName)
    return <AuthComponent course_name={courseName} />
  }

  // Don't edit certain special pages (no context allowed)
  if (
    courseName.toLowerCase() == 'gpt4' ||
    courseName.toLowerCase() == 'global' ||
    courseName.toLowerCase() == 'extreme'
  ) {
    return <CannotEditGPT4Page course_name={courseName} />
  }

  return (
    <>
      <Navbar course_name={courseName} />

      <Head>
        <title>{courseName}</title>
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
                    Customize your project&apos;s system prompt
                  </Title>
                </div>
              </Flex>
            </div>
            <div className="pt-5"></div>
            <div style={{ width: '60%' }}>
              <Text
                className={`label ${montserrat_heading.variable} font-montserratHeading`}
                size={'sm'}
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  userSelect: 'text',
                  whiteSpace: 'nowrap',
                }}
              >
                <span>
                  For guidance on crafting prompts, consult the
                  <a
                    className={'pl-1 text-purple-600'}
                    href="https://platform.openai.com/docs/guides/prompt-engineering"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    official OpenAI documentation
                  </a>
                  .
                </span>
              </Text>
              <Text
                className={`label ${montserrat_paragraph.variable} font-montserratParagraph`}
                size={'sm'}
                style={{ userSelect: 'text' }}
              >
                Modify with caution. Unnecessary alterations might reduce
                effectiveness, similar to overly restrictive coding. Changes
                affect all project users.
              </Text>
              <Textarea
                label={<strong>System Prompt</strong>}
                autosize
                minRows={2}
                maxRows={10}
                placeholder="Enter a system prompt"
                className={`pt-3 ${montserrat_paragraph.variable} font-montserratParagraph`}
                value={systemPrompt}
                onChange={(e) => {
                  setSystemPrompt(e.target.value)
                }}
              />
              <div style={{ paddingTop: '10px', width: '100%' }}>
                <div
                  style={{
                    paddingTop: '10px',
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <Button
                    className="relative m-1 self-end bg-purple-800 text-white hover:border-indigo-600 hover:bg-indigo-600"
                    type="submit"
                    onClick={handleSystemPromptSubmit}
                    style={{ minWidth: 'fit-content' }}
                  >
                    Update System Prompt
                  </Button>
                  <Button
                    className="relative m-1 self-end bg-red-500 text-white hover:border-red-600 hover:bg-red-600"
                    onClick={() => {
                      setSystemPrompt(DEFAULT_SYSTEM_PROMPT)
                      resetSystemPrompt()
                    }}
                    style={{ minWidth: 'fit-content' }}
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </div>
          </Flex>
        </div>
      </main>
    </>
  )
}
export default CourseMain
