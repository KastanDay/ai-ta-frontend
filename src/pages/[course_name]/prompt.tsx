// src/pages/[course_name]/api.tsx
import { type NextPage } from 'next'
import MakeNewCoursePage from '~/components/UIUC-Components/MakeNewCoursePage'
import React, { useEffect, useState } from 'react'
import { Montserrat } from 'next/font/google'
import { useRouter } from 'next/router'
import { useUser } from '@clerk/nextjs'
import { CannotEditGPT4Page } from '~/components/UIUC-Components/CannotEditGPT4'
import { LoadingSpinner } from '~/components/UIUC-Components/LoadingSpinner'
import { MainPageBackground } from '~/components/UIUC-Components/MainPageBackground'
import { AuthComponent } from '~/components/UIUC-Components/AuthToEditCourse'
import { Button, Card, Checkbox, CheckboxProps, Flex, Group, Input, MantineTheme, Select, Text, Textarea, Title, useMantineTheme } from '@mantine/core'
import { extractEmailsFromClerk } from '~/components/UIUC-Components/clerkHelpers'
import { DEFAULT_SYSTEM_PROMPT } from '~/utils/app/const'
import { type CourseMetadata } from '~/types/courseMetadata'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import { callSetCourseMetadata } from '~/utils/apiUtils'
import Navbar from '~/components/UIUC-Components/navbars/Navbar'
import Head from 'next/head'
import { useMediaQuery } from '@mantine/hooks'
import { IconAlertTriangle, IconCheck, IconExternalLink } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'

const montserrat = Montserrat({
  weight: '700',
  subsets: ['latin'],
})

const montserrat_light = Montserrat({
  weight: '400',
  subsets: ['latin'],
})

const CourseMain: NextPage = () => {
  const [checked1, setChecked1] = useState(false);
  const [checked2, setChecked2] = useState(false);
  const theme = useMantineTheme()
  const router = useRouter()

  const GetCurrentPageName = () => {
    // return router.asPath.slice(1).split('/')[0]
    // Possible improvement.
    return router.query.course_name as string // Change this line
  }
  const isSmallScreen = useMediaQuery('(max-width: 960px)')
  const course_name = GetCurrentPageName() as string
  const { user, isLoaded, isSignedIn } = useUser()
  const [courseData, setCourseData] = useState(null)
  const [courseExists, setCourseExists] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [systemPrompt, setSystemPrompt] = useState('')
  const [courseMetadata, setCourseMetadata] = useState<CourseMetadata | null>(
    null,
  )
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
      const response_metadata = await fetch(
        `/api/UIUC-api/getCourseMetadata?course_name=${course_name}`,
      )
      const courseMetadata = (await response_metadata.json()).course_metadata
      setCourseMetadata(courseMetadata)
      setSystemPrompt(courseMetadata.system_prompt || DEFAULT_SYSTEM_PROMPT)

      setIsLoading(false)
    }
    fetchCourseData()
  }, [router.isReady])

  const handleSystemPromptSubmit = async () => {
    if (courseMetadata && course_name && systemPrompt) {
      courseMetadata.system_prompt = systemPrompt
      const success = await callSetCourseMetadata(course_name, courseMetadata)
      if (!success) {
        console.log('Error updating course metadata')
        showToastOnPromptUpdate(theme, true)
      } else {
        showToastOnPromptUpdate(theme)
      }
    }
  }

  const resetSystemPrompt = async () => {
    if (courseMetadata && course_name) {
      courseMetadata.system_prompt = DEFAULT_SYSTEM_PROMPT
      const success = await callSetCourseMetadata(course_name, courseMetadata)
      if (!success) {
        alert('Error resetting system prompt')
        showToastOnPromptUpdate(theme, true)
      } else {
        showToastOnPromptUpdate(theme, false, true)
      }
    } else {
      alert('Error resetting system prompt')
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
      <Navbar course_name={router.query.course_name as string} />
      <main className="course-page-main min-w-screen flex min-h-screen flex-col items-center">
        <div className="items-left flex w-full flex-col justify-center py-0">

          <Flex direction="column" align="center" w="100%">
            <Card
              shadow="xs"
              padding="none"
              radius="xl"
              style={{ maxWidth: '85%', width: '100%', marginTop: '4%' }}
            >
              <Flex
                direction={isSmallScreen ? 'column' : 'row'}
                style={{ height: '100%' }}
              >
                <div
                  style={{
                    flex: isSmallScreen ? '1 1 100%' : '1 1 60%',
                    padding: '1rem',
                    color: 'white',
                    alignItems: 'center',
                  }}
                  className="min-h-full justify-center bg-gradient-to-r from-purple-900 via-indigo-800 to-blue-800"
                >
                  <div className="card flex h-full flex-col">
                    <Group
                      // spacing="lg"
                      m="3rem"
                      align="center"
                      variant="column"
                      style={{
                        justifyContent: 'center',
                        width: '75%',
                        alignSelf: 'center',
                        overflow: 'hidden',
                      }}
                    >
                      <Title
                        order={2}
                        variant="gradient"
                        gradient={{ from: 'gold', to: 'white', deg: 50 }}
                        style={{ marginBottom: '0.5rem' }}
                        align="center"
                        className={`label ${montserrat_heading.variable} font-montserratHeading`}
                      >
                        Customize system prompt
                      </Title>
                      <Title order={4} w={'90%'}>
                        For guidance on crafting prompts, consult the
                        <a
                          className={'pl-1 text-purple-600'}
                          href="https://platform.openai.com/docs/guides/prompt-engineering"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          official OpenAI documentation

                          <IconExternalLink
                            className="mr-2 inline-block"
                            style={{ position: 'relative', top: '-3px' }}
                          />
                        </a>
                      </Title>
                      <Title order={4} w={'90%'}>
                        Modify with caution. Unnecessary alterations might reduce
                        effectiveness, similar to overly restrictive coding. Changes
                        affect all project users.
                      </Title>
                      <div
                        style={{
                          width: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          background: '#15162c',
                          paddingTop: '1rem',
                          borderRadius: '1rem',
                        }}
                      >
                        <div
                          style={{
                            width: '95%',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: '#15162c',
                            paddingBottom: '1rem',
                          }}
                        >
                          <Title
                            order={3}
                            align="left"
                            variant="gradient"
                            gradient={{ from: 'gold', to: 'white', deg: 50 }}
                            style={{ flexGrow: 2, marginLeft: '1rem' }}
                          >
                            Example
                          </Title>
                          {/* <Select
                            placeholder="Select an option"
                            data={languageOptions}
                            value={selectedLanguage}
                            style={{ width: '7rem' }} // Ensures the button is wide enough to show all text and does not shrink
                            onChange={(value: string | null) => {
                              if (
                                value === 'curl' ||
                                value === 'python' ||
                                value === 'node'
                              ) {
                                setSelectedLanguage(value)
                              }
                            }}
                          // style={{ width: '30%', minWidth: '20px' }}
                          /> */}
                          {/* <Button
                            onClick={() =>
                              handleCopyCodeSnippet(codeSnippets[selectedLanguage])
                            }
                            variant="subtle"
                            size="xs"
                            className="ms-2 min-h-[2.5rem] transform rounded-bl-xl rounded-br-md rounded-tl-md rounded-tr-xl bg-purple-800 text-white hover:border-indigo-600 hover:bg-indigo-600 hover:text-white focus:shadow-none focus:outline-none"
                          >
                            {copiedCodeSnippet ? <IconCheck /> : <IconCopy />}
                          </Button> */}
                        </div>
                        {/* <Textarea
                          value={codeSnippets[selectedLanguage] as string}
                          autosize
                          variant="unstyled"
                          wrapperProps={{ overflow: 'hidden' }}
                          className="relative w-[100%] min-w-[20rem] overflow-hidden rounded-b-xl border-t-2 border-gray-400 bg-[#0c0c27] pl-8 text-white"
                          readOnly
                        /> */}
                      </div>
                    </Group>
                  </div>
                </div>
                <div
                  style={{
                    flex: isSmallScreen ? '1 1 100%' : '1 1 40%',
                    padding: '1rem',
                    backgroundColor: '#15162c',
                    color: 'white',
                  }}
                >
                  <div className="card flex h-full flex-col">
                    <Group position="left" m="3rem" variant="column">
                      <Title
                        className={`label ${montserrat_heading.variable} font-montserratHeading`}
                        variant="gradient"
                        gradient={{ from: 'gold', to: 'white', deg: 170 }}
                        order={2}
                      >
                        {course_name}
                      </Title>
                      <Textarea
                        label={<strong>System Prompt</strong>}
                        autosize
                        minRows={3}
                        maxRows={20}
                        style={{ width: '100%' }}
                        placeholder="Enter a system prompt"
                        className={`pt-3 ${montserrat_paragraph.variable} font-montserratParagraph`}
                        value={systemPrompt}
                        onChange={(e) => {
                          setSystemPrompt(e.target.value)
                        }}
                      />
                      <Checkbox
                        label={`Content includes equations; LaTeX notation preferred.`}
                        // wrapperProps={{}}
                        // description="Course is private by default."
                        aria-label="Checkbox to toggle Course being public or private. Private requires a list of allowed email addresses."
                        className={`${montserrat_paragraph.variable} font-montserratParagraph`}
                        // style={{ marginTop: '4rem' }}
                        size="md"
                        // bg='#020307'
                        color="grape"
                        // icon={CheckboxIcon}
                        checked={checked1}
                        onChange={(event) => setChecked1(event.currentTarget.checked)}
                      // defaultChecked={isPrivate}
                      // onChange={handleCheckboxChange}
                      />
                      <Checkbox
                        label={`Focus exclusively on document-based references—avoid incorporating knowledge from outside sources. Essential for legal and similar fields to maintain response quality.`}
                        // wrapperProps={{}}
                        // description="Course is private by default."
                        aria-label="Checkbox to toggle Course being public or private. Private requires a list of allowed email addresses."
                        className={`${montserrat_paragraph.variable} font-montserratParagraph`}
                        // style={{ marginTop: '4rem' }}
                        size="md"
                        // bg='#020307'
                        color="grape"
                        // icon={CheckboxIcon}
                        checked={checked2}
                        onChange={(event) => setChecked2(event.currentTarget.checked)}
                      // defaultChecked={isPrivate}
                      // onChange={handleCheckboxChange}
                      />
                      <Textarea
                        label={<strong>Things to do</strong>}
                        autosize
                        minRows={3}
                        maxRows={20}
                        style={{ width: '100%' }}
                        placeholder="Enter a system prompt"
                        className={`pt-3 ${montserrat_paragraph.variable} font-montserratParagraph`}
                        value={systemPrompt}
                        onChange={(e) => {
                          setSystemPrompt(e.target.value)
                        }}
                      />
                      <Textarea
                        label={<strong>Things NOT to do</strong>}
                        autosize
                        minRows={3}
                        maxRows={20}
                        style={{ width: '100%' }}
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

                    </Group>


                  </div>
                </div>
              </Flex>
            </Card>
          </Flex>
        </div>
      </main>
    </>
  )
}
export const showToastOnPromptUpdate = (
  theme: MantineTheme,
  was_error = false,
  isReset = false,
) => {
  return (
    notifications.show({
      id: 'prompt-updated',
      withCloseButton: true,
      onClose: () => console.log('unmounted'),
      onOpen: () => console.log('mounted'),
      autoClose: 12000,
      title: was_error ? 'Error updating prompt' : (isReset ? 'Resetting prompt...' : 'Updating prompt...'),
      message: was_error
        ? "An error occurred while updating the prompt. Please try again."
        : (isReset ? 'The prompt has been reset to default.' : 'The prompt has been updated successfully.'),
      icon: was_error ? <IconAlertTriangle /> : <IconCheck />,
      styles: {
        root: {
          backgroundColor: theme.colors.nearlyWhite,
          borderColor: was_error
            ? theme.colors.errorBorder
            : theme.colors.aiPurple,
        },
        title: {
          color: theme.colors.nearlyBlack,
        },
        description: {
          color: theme.colors.nearlyBlack,
        },
        closeButton: {
          color: theme.colors.nearlyBlack,
          '&:hover': {
            backgroundColor: theme.colors.dark[1],
          },
        },
        icon: {
          backgroundColor: was_error
            ? theme.colors.errorBackground
            : theme.colors.successBackground,
          padding: '4px',
        },
      },
      loading: false,
    })
  )
}
export default CourseMain
