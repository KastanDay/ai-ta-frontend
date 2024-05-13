
// src/pages/[course_name]/api.tsx
'use client'
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
import {
  Alert,
  Button,
  Card,
  Checkbox,
  CheckboxProps,
  Flex,
  Group,
  Input,
  MantineTheme,
  Modal,
  Paper,
  Select,
  Table,
  Text,
  Textarea,
  Title,
  Tooltip,
  useMantineTheme,
} from '@mantine/core'
import { extractEmailsFromClerk } from '~/components/UIUC-Components/clerkHelpers'
import { DEFAULT_SYSTEM_PROMPT } from '~/utils/app/const'
import { type CourseMetadata } from '~/types/courseMetadata'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import { callSetCourseMetadata } from '~/utils/apiUtils'
import Navbar from '~/components/UIUC-Components/navbars/Navbar'
import Head from 'next/head'
import { useDisclosure, useMediaQuery } from '@mantine/hooks'
import {
  IconAlertCircle,
  IconAlertTriangle,
  IconCheck,
  IconExternalLink,
  IconLayoutSidebarLeftExpand,
  IconLayoutSidebarRight,
  IconLayoutSidebarRightExpand,
  IconSparkles,
} from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { useChat } from 'ai/react'

const montserrat = Montserrat({
  weight: '700',
  subsets: ['latin'],
})

const montserrat_light = Montserrat({
  weight: '400',
  subsets: ['latin'],
})

const CourseMain: NextPage = () => {

  const [checked1, setChecked1] = useState(false)
  const [checked2, setChecked2] = useState(false)
  const [checked3, setChecked3] = useState(false)

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
  const [baseSystemPrompt, setBaseSystemPrompt] = useState('')
  const [thingsToDo, setThingsToDo] = useState('')
  const [thingsNotToDo, setThingsNotToDo] = useState('')
  const [originalSystemPrompt, setOriginalSystemPrompt] = useState('')
  const [opened, { close, open }] = useDisclosure(false);
  const [apiKey, setApiKey] = useState<string | undefined>(undefined);
  const { messages, input, handleInputChange, reload, setMessages, setInput } = useChat({
    api: '/api/chat/openAI', headers: {
      'Authorization': `Bearer ${apiKey}`
    },
  })
  const [optimizedSystemPrompt, setOptimizedSystemPrompt] = useState('');
  const [isSystemPromptSaved, setIsSystemPromptSaved] = useState(false);
  const [isRightSideVisible, setIsRightSideVisible] = useState(false);


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
      setBaseSystemPrompt(courseMetadata.system_prompt || DEFAULT_SYSTEM_PROMPT)
      setIsLoading(false)

    }
    fetchCourseData()
  }, [router.isReady])

  useEffect(() => {
    let newApiKey;
    if (courseMetadata?.openai_api_key) {
      newApiKey = courseMetadata.openai_api_key;
    } else {
      newApiKey = process.env.VLADS_OPENAI_KEY;
    }
    setApiKey(newApiKey);
  }, [courseMetadata, process.env.VLADS_OPENAI_KEY]);

  useEffect(() => {
    // Just for testing
    if (systemPrompt) {
      setInput(systemPrompt)
      console.log('system prompt in ueseffected', systemPrompt)
      console.log('input in useeffect', input)
    }
  }, [systemPrompt])

  useEffect(() => {
    let newSystemPrompt = baseSystemPrompt

    if (checked1) {
      newSystemPrompt +=
        '\nContent includes equations; LaTeX notation preferred.'
    }

    if (checked2) {
      newSystemPrompt +=
        '\nFocus exclusively on document-based references—avoid incorporating knowledge from outside sources. Essential for legal and similar fields to maintain response quality.'
    }

    if (checked3 && courseMetadata?.course_intro_message) {
      newSystemPrompt += `\n${courseMetadata.course_intro_message} If the user asks an introductory question or greeting along the lines of 'hello' or 'what can you do?' or 'What's in here ?' or 'what is ${course_name}?' or similar, then please respond with a warm welcome to ${course_name}, the AI ${course_name} assistant chatbot. Tell them that you can answer questions using the entire knowledge base of Extension. Feel free to ask!`
    } else if (checked3) {
      newSystemPrompt += `\nIf the user asks an introductory question or greeting along the lines of 'hello' or 'what can you do?' or 'What's in here ?' or 'what is ${course_name}?' or similar, then please respond with a warm welcome to ${course_name}, the AI ${course_name} assistant chatbot. Tell them that you can answer questions using the entire knowledge base of Extension. Feel free to ask!`
    }

    if (thingsToDo) {
      newSystemPrompt += '\nThings to do: ' + thingsToDo
    }
    if (thingsNotToDo) {
      newSystemPrompt += '\nThings NOT to do: ' + thingsNotToDo
    }

    setSystemPrompt(newSystemPrompt)
  }, [checked1, checked2, checked3, thingsToDo, thingsNotToDo, courseMetadata])

  const handleSystemPromptSubmit = async (newSystemPrompt: string) => {
    let success = false;
    if (courseMetadata && course_name && newSystemPrompt) {
      courseMetadata.system_prompt = newSystemPrompt;
      success = await callSetCourseMetadata(course_name, courseMetadata);
    }
    if (!success) {
      console.log('Error updating course metadata');
      showToastOnPromptUpdate(theme, true);
    } else {
      showToastOnPromptUpdate(theme);
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



  const handleSubmitPromptOptimization = async (
    e: any,
    reload: any,
    setMessages: any,

  ) => {
    // let newApiKey;
    // let the_key;
    // if (courseMetadata?.openai_api_key) {
    //   newApiKey = courseMetadata.openai_api_key;
    //   the_key = newApiKey;

    // } else {
    //   newApiKey = process.env.VLADS_OPENAI_KEY
    //   the_key = newApiKey;

    // }
    // setApiKey(newApiKey);

    // console.log('apikey set to', apiKey);
    e.preventDefault()

    const finalMessage = `
    Today, you will be writing instructions for an eager, helpful, but inexperienced and unworldly AI assistant. This assistant requires careful instruction and clear examples to understand how to behave effectively. Follow the steps below to write precise and thorough instructions that will guide the assistant to accomplish tasks consistently, accurately, and correctly. If the question is related to the subject in ANY WAY then always answer the question even if the documents are not helpful. Give the users the most helpful response possible as best you can. Remember this: always give a reasonable answer to the users question and never refuse to answer even if you have little information to go on; give an array of helpful answers if necessary. ALWAYS respond with something helpful to answer their questions and propose solutions. ALWAYS provide citations when relevant but don't stack too many citations together.:
    
    ${e.target[0].value}

    Note: This is probably obvious to you already, but you are not *completing* the task here. You are writing instructions for an AI to complete the task.
`

    setMessages([
      { role: 'system', content: 'Hi Im system prompt' },
      { role: 'user', content: finalMessage },
    ])
    // setFinalSystemPrompt(finalMessage)
    reload()
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
                        width: '90%',
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
                        className={`label ${montserrat_heading.variable} font - montserratHeading`}
                      >
                        Customize System Prompt
                      </Title>


                      <div
                        style={{
                          width: isRightSideVisible ? '100%' : '80%',
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
                            width: '100%',
                            // display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: '#15162c',
                            padding: '1rem 4rem',

                          }}
                        >

                          <Flex justify="space-between" align="center">
                            <Title
                              className={`label ${montserrat_heading.variable} font - montserratHeading`}
                              variant="gradient"
                              gradient={{ from: 'gold', to: 'white', deg: 170 }}
                              order={4}
                            >
                              System Prompt Optimization
                            </Title>
                            {isRightSideVisible ? (
                              <Tooltip label="Close Prompt Builder">
                                <div className="hover:opacity-75 cursor-pointer">
                                  <IconLayoutSidebarRight stroke={2} onClick={() => setIsRightSideVisible(!isRightSideVisible)} />
                                </div>
                              </Tooltip>
                            ) : (
                              <Tooltip label="Open Prompt Builder">
                                <div className="hover:opacity-75 cursor-pointer">
                                  <IconLayoutSidebarRightExpand stroke={2} onClick={() => setIsRightSideVisible(!isRightSideVisible)} />
                                </div>
                              </Tooltip>
                            )}                          </Flex>
                          <form
                            onSubmit={(e) =>
                              handleSubmitPromptOptimization(
                                e,
                                reload,
                                setMessages,
                              )
                            }
                          >
                            {/* <Title
                              className={`label ${montserrat_heading.variable} font - montserratHeading`}
                              variant="gradient"
                              gradient={{ from: 'gold', to: 'white', deg: 170 }}
                              order={4}
                            >
                              System Prompt
                            </Title>
                            <p>This system prompt is used on ALL messages in this project. Read more...</p> */}
                            <Textarea
                              autosize
                              minRows={3}
                              maxRows={20}
                              placeholder="Enter the system prompt..."
                              className={`pt-3 ${montserrat_paragraph.variable} font-montserratParagraph`}
                              value={input}
                              onChange={(e) => {
                                setBaseSystemPrompt(e.target.value)
                                setSystemPrompt(e.target.value)
                                handleInputChange(e)
                              }}
                              style={{ width: '100%' }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>

                              <Button type="submit" onClick={open}
                                style={{ minWidth: 'fit-content', marginTop: '15px', paddingLeft: '8px' }}

                                className="relative m-1 self-end bg-purple-800 text-white hover:border-indigo-600 hover:bg-indigo-600">
                                <IconSparkles stroke={1} />
                                Optimize System Prompt
                              </Button>

                              <Button
                                className="relative m-1 self-end bg-purple-800 text-white hover:border-indigo-600 hover:bg-indigo-600"
                                type="submit"
                                onClick={() => { handleSystemPromptSubmit(systemPrompt) }}
                                style={{ minWidth: 'fit-content' }}
                              >
                                Update System Prompt
                              </Button>
                            </div>

                            <Modal opened={opened} onClose={close} size='lg' title="Optimized System Prompt"
                              centered>
                              <Group mt="xl">
                                {messages.map((message, i, { length }) => {
                                  if (length - 1 === i && message.role === 'assistant') {
                                    return <div
                                      key={i}
                                      style={{
                                        border: '1px solid #6D28D9',
                                        padding: '10px',
                                        borderRadius: '5px'
                                      }}>
                                      {message.content}
                                    </div>
                                  }
                                }, null)}

                                {/* TODO: add the return value if there is no message found
                                  double confirm the handleSystemPromptSubmit */}
                                <Button
                                  className="relative m-1 self-end bg-purple-800 text-white hover:border-indigo-600 hover:bg-indigo-600"
                                  type="submit"
                                  onClick={() => {
                                    const lastMessage = messages[messages.length - 1];
                                    if (lastMessage && lastMessage.role === 'assistant') {
                                      const newSystemPrompt = lastMessage.content;
                                      setOptimizedSystemPrompt(newSystemPrompt);
                                      setBaseSystemPrompt(newSystemPrompt);
                                      setSystemPrompt(newSystemPrompt);
                                      handleSystemPromptSubmit(newSystemPrompt);
                                      console.log('system prompt', newSystemPrompt)
                                    }
                                    close();
                                  }}
                                  style={{ minWidth: 'fit-content' }}
                                >
                                  Update System Prompt
                                </Button>
                                <Button variant="outline" className="relative m-1 self-end bg-red-500 text-white hover:border-red-600 hover:bg-red-600"
                                  onClick={close}>
                                  Cancel
                                </Button>
                              </Group>
                            </Modal>


                          </form>


                        </div>
                      </div>
                    </Group>
                    {/* <Alert icon={<IconAlertCircle size="1rem" />} title="Attention!" color="pink" style={{ width: isRightSideVisible ? '90%' : '73%', margin: 'auto', marginTop: '0px', color: 'pink' }}>
                      <span style={{ color: 'pink' }}>Remember to save and update the system prompt before you leave this page.</span>
                    </Alert> */}
                    <Paper shadow="xs" radius="md" p="md" style={{ width: isRightSideVisible ? '90%' : '73%', margin: 'auto', marginTop: '8px', backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
                      <Title order={6} w={'100%'}>
                        For guidance on crafting prompts, consult the
                        <br />
                        <a
                          className={'pl-1 text-purple-600 text-sm'}
                          href="https://platform.openai.com/docs/guides/prompt-engineering"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          official OpenAI documentation
                          <IconExternalLink size={12}
                            className="mr-2 inline-block"
                            style={{ position: 'relative', top: '-3px', fontSize: '0.5em' }}
                          />
                        </a>
                        <br />
                        <a
                          className={'pl-1 text-purple-600 text-sm'}
                          href="https://docs.anthropic.com/claude/prompt-library"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          official Anthropic Prompt Library
                          <IconExternalLink size={12}
                            className="mr-2 inline-block"
                            style={{ position: 'relative', top: '-3px' }}
                          />
                        </a>
                      </Title>
                    </Paper>
                  </div>
                </div>
                {/* RIGHT SIDE OF CARD */}
                {isRightSideVisible && (
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
                          className={`label ${montserrat_heading.variable} font - montserratHeading`}
                          variant="gradient"
                          gradient={{ from: 'gold', to: 'white', deg: 170 }}
                          order={3}
                          style={{ paddingTop: '18px' }}
                        >
                          Add Instructions to System Prompt
                        </Title>
                        <Checkbox
                          label={`Add greetings at the beginning of the conversation.`}
                          // wrapperProps={{}}
                          // description="Course is private by default."
                          className={`${montserrat_paragraph.variable} font - montserratParagraph`}
                          // style={{ marginTop: '4rem' }}
                          size="md"
                          // bg='#020307'
                          color="grape"
                          // icon={CheckboxIcon}
                          checked={checked3}
                          onChange={(event) =>
                            setChecked3(event.currentTarget.checked)
                          }
                        />
                        <Checkbox
                          label={`Content includes equations; LaTeX notation preferred.`}
                          // wrapperProps={{}}
                          // description="Course is private by default."
                          className={`${montserrat_paragraph.variable} font - montserratParagraph`}
                          // style={{ marginTop: '4rem' }}
                          size="md"
                          // bg='#020307'
                          color="grape"
                          // icon={CheckboxIcon}
                          checked={checked1}
                          onChange={(event) =>
                            setChecked1(event.currentTarget.checked)
                          }
                        />
                        <Checkbox
                          label={`Focus exclusively on document - based references—avoid incorporating knowledge from outside sources.Essential for legal and similar fields to maintain response quality.`}
                          // wrapperProps={{}}
                          // description="Course is private by default."
                          className={`${montserrat_paragraph.variable} font - montserratParagraph`}
                          // style={{ marginTop: '4rem' }}
                          size="md"
                          // bg='#020307'
                          color="grape"
                          // icon={CheckboxIcon}
                          checked={checked2}
                          onChange={(event) =>
                            setChecked2(event.currentTarget.checked)
                          }
                        />
                        <Title
                          className={`label ${montserrat_heading.variable} font - montserratHeading`}
                          variant="gradient"
                          gradient={{ from: 'gold', to: 'white', deg: 170 }}
                          order={4}
                        >
                          Things to do
                        </Title>
                        <Textarea
                          // label={<strong>Things to do</strong>}
                          autosize
                          minRows={3}
                          maxRows={20}
                          style={{ width: '100%', paddingTop: '0px' }}
                          placeholder="Enter guidelines that the chat response should adhere to..."
                          className={`pt - 3 ${montserrat_paragraph.variable} font - montserratParagraph`}
                          value={thingsToDo}
                          onChange={(e) => {
                            setThingsToDo(e.target.value)
                          }}
                        />
                        <Title
                          className={`label ${montserrat_heading.variable} font - montserratHeading`}
                          variant="gradient"
                          gradient={{ from: 'gold', to: 'white', deg: 170 }}
                          order={4}
                        >
                          Things NOT to do
                        </Title>
                        <Textarea
                          // label={<strong>Things NOT to do</strong>}
                          autosize
                          minRows={3}
                          maxRows={20}
                          style={{ width: '100%', paddingTop: '0px' }}
                          placeholder="Edit the guidelines that the chat response should not adhere to..."
                          className={`pt - 3 ${montserrat_paragraph.variable} font - montserratParagraph`}
                          value={thingsNotToDo}
                          onChange={(e) => {
                            setThingsNotToDo(e.target.value)
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
                )}
                {/* End of right side of Card */}
              </Flex>
            </Card>
          </Flex>
        </div >
      </main >
    </>
  )
}
export const showToastOnPromptUpdate = (
  theme: MantineTheme,
  was_error = false,
  isReset = false,
) => {
  return notifications.show({
    id: 'prompt-updated',
    withCloseButton: true,
    onClose: () => console.log('unmounted'),
    onOpen: () => console.log('mounted'),
    autoClose: 12000,
    title: was_error
      ? 'Error updating prompt'
      : isReset
        ? 'Resetting prompt...'
        : 'Updating prompt...',
    message: was_error
      ? 'An error occurred while updating the prompt. Please try again.'
      : isReset
        ? 'The prompt has been reset to default.'
        : 'The prompt has been updated successfully.',
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
}
export default CourseMain



