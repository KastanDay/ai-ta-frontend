import Head from 'next/head'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
// import { DropzoneS3Upload } from '~/components/UIUC-Components/Upload_S3'
import { fetchPresignedUrl } from '~/utils/apiUtils'
import {
  // Badge,
  // MantineProvider,
  Button,
  // Group,
  // Stack,
  // createStyles,
  // FileInput,
  // rem,
  Title,
  Flex,
  createStyles,
  // Divider,
  MantineTheme,
  List,
  Text,
  TextInput,
  // TextInput,
  // Tooltip,
} from '@mantine/core'
// const rubik_puddles = Rubik_Puddles({ weight: '400', subsets: ['latin'] })
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/router'
import { LoadingSpinner } from './LoadingSpinner'
import { supabase } from '@/utils/supabaseClient'
import { Accordion } from '@mantine/core'

const useStyles = createStyles((theme: MantineTheme) => ({
  downloadButton: {
    fontFamily: 'var(--font-montserratHeading)',
    outline: 'none',
    border: 'solid 1.5px',
    borderColor: theme.colors.grape[8],
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    borderRadius: theme.radius.xl,
    cursor: 'pointer',
    transition: 'background-color 0.2s ease-in-out',
    height: '48px',
    backgroundColor: '#0E1116',

    '&:hover': {
      backgroundColor: theme.colors.grape[8],
    },
    '@media (max-width: 768px)': {
      fontSize: theme.fontSizes.xs,
      padding: '10px',
      width: '70%',
    },
    '@media (min-width: 769px) and (max-width: 1024px)': {
      fontSize: theme.fontSizes.xs,
      padding: '12px',
      width: '90%',
    },
    '@media (min-width: 1025px)': {
      fontSize: theme.fontSizes.sm,
      padding: '15px',
      width: '100%',
    },
  },
}))

import { useAuth, useUser } from '@clerk/nextjs'

export const GetCurrentPageName = () => {
  // /CS-125/materials --> CS-125
  return useRouter().asPath.slice(1).split('/')[0] as string
}

const MakeToolsPage = ({ course_name }: { course_name: string }) => {
  // Check auth - https://clerk.com/docs/nextjs/read-session-and-user-data
  const { isLoaded, userId, sessionId, getToken } = useAuth() // Clerk Auth
  // const { isSignedIn, user } = useUser()
  const clerk_user = useUser()
  const [courseMetadata, setCourseMetadata] = useState<CourseMetadata | null>(
    null,
  )
  const [currentEmail, setCurrentEmail] = useState('')
  const [n8nApiKey, setN8nApiKey] = useState('')

  const handleSaveApiKey = async () => {
    console.log('Saving n8n API Key:', n8nApiKey)
    const response = await fetch(`/api/UIUC-api/upsertN8nAPIKey`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        course_name: currentPageName,
        n8n_api_key: n8nApiKey,
      }),
    })
    if (response.ok) {
      notifications.show({
        id: 'n8n-api-key-saved',
        title: 'Success',
        message: 'n8n API Key saved successfully!',
        autoClose: 10000,
        color: 'green',
        radius: 'lg',
        icon: <IconCheck />,
        className: 'my-notification-class',
        style: { backgroundColor: '#15162c' },
        loading: false,
      })
    } else {
      notifications.show({
        id: 'error-notification',
        title: 'Error',
        message: 'Failed to save n8n API Key. Please try again later.',
        autoClose: 10000,
        color: 'red',
        radius: 'lg',
        icon: <IconAlertCircle />,
        className: 'my-notification-class',
        style: { backgroundColor: '#15162c' },
        loading: false,
      })
    }
    setIsLoading(false)
  }
  const router = useRouter()

  const currentPageName = GetCurrentPageName()

  const [isLoading, setIsLoading] = useState(false)

  // TODO: remove this hook... we should already have this from the /materials props???
  useEffect(() => {
    const fetchData = async () => {
      const userEmail = extractEmailsFromClerk(clerk_user.user)
      setCurrentEmail(userEmail[0] as string)

      try {
        const metadata: CourseMetadata = (await fetchCourseMetadata(
          currentPageName,
        )) as CourseMetadata

        if (metadata && metadata.is_private) {
          metadata.is_private = JSON.parse(
            metadata.is_private as unknown as string,
          )
        }
        setCourseMetadata(metadata)
      } catch (error) {
        console.error(error)
        // alert('An error occurred while fetching course metadata. Please try again later.')
      }
    }

    fetchData()
  }, [currentPageName, clerk_user.isLoaded])

  const [nomicMapData, setNomicMapData] = useState<NomicMapData | null>(null)
  const [nomicIsLoading, setNomicIsLoading] = useState(true)

  // fetch nomicMapData
  useEffect(() => {
    const fetchNomicMapData = async () => {
      try {
        console.log('Trying to fetch nomic!!')
        const response = await fetch(
          `/api/getNomicMapForQueries?course_name=${course_name}`,
        )
        const data = await response.json()
        const parsedData: NomicMapData = {
          map_id: data.map_id,
          map_link: data.map_link,
        }
        setNomicMapData(parsedData)
        setNomicIsLoading(false)
      } catch (error) {
        console.error('Error fetching nomic map:', error)
        setNomicIsLoading(false) // Set nomicIsLoading to false even if there is an error
      }
    }

    fetchNomicMapData()
  }, [course_name])

  if (!isLoaded || !courseMetadata) {
    return (
      <MainPageBackground>
        <LoadingSpinner />
      </MainPageBackground>
    )
  }

  // TODO: update this check to consider Admins & participants.
  if (
    courseMetadata &&
    currentEmail !== (courseMetadata.course_owner as string) &&
    courseMetadata.course_admins.indexOf(currentEmail) === -1
  ) {
    router.replace(`/${course_name}/not_authorized`)

    return (
      <CannotEditCourse
        course_name={currentPageName as string}
        // current_email={currentEmail as string}
      />
    )
  }

  // const upsertN8nApiKey = async (newN8nApiKey: string) => {

  // }

  // Remember to call logApiToSupabase() where it's needed in your component

  const downloadConversationHistory = async (courseName: string) => {
    try {
      setIsLoading(true)
      const response = await axios.get(
        `https://flask-production-751b.up.railway.app/export-convo-history-csv?course_name=${courseName}`,
        { responseType: 'blob' },
      )
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', courseName + '_conversation_history.csv')
      document.body.appendChild(link)
      link.click()
    } catch (error) {
      console.error('Error fetching conversation history:', error)
      notifications.show({
        id: 'error-notification',
        title: 'Error',
        message:
          'Failed to fetch conversation history. Please try again later.',
        color: 'red',
        radius: 'lg',
        icon: <IconAlertCircle />,
        className: 'my-notification-class',
        style: { backgroundColor: '#15162c' },
        loading: false,
      })
    } finally {
      setIsLoading(false)
    }
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
                    Create custom functions for your project
                  </Title>
                </div>
                <div className="me-6 flex flex-row items-center justify-end">
                  {/* Can add more buttons here */}
                  {/* <Button className={`${montserrat_paragraph.variable} font-montserratParagraph ${classes.downloadButton}`} rightIcon={isLoading ? <LoadingSpinner size="sm" /> : <IconCloudDownload />}
                    onClick={() => downloadConversationHistory(course_name)}>
                    Download Conversation History
                  </Button> */}
                </div>
              </Flex>
            </div>

            <div className="pt-5"></div>

            <Title
              order={4}
              w={'80%'}
              style={{ margin: '0 auto', textAlign: 'center' }}
            >
              Use{' '}
              <a
                href="https://n8n.io"
                target="_blank"
                rel="noopener noreferrer"
                className={`text-purple-500 hover:underline ${montserrat_heading.variable} font-montserratHeading`}
              >
                n8n.io&apos;{' '}
                <IconExternalLink
                  className="mr-2 inline-block"
                  style={{ position: 'relative', top: '-3px' }}
                />
              </a>
              beautiful visual workflow editor to create custom functions for
              your project.
            </Title>

            <div style={{ width: '60%', margin: '0 auto' }}>
              <Title
                style={{ margin: '0 auto', textAlign: 'center' }}
                order={4}
                w={'80%'}
                size={'xl'}
                className={`pt-3 ${montserrat_paragraph.variable} font-montserratParagraph`}
              >
                Setup Instructions 🤠
              </Title>
              <List
                w={'80%'}
                type="ordered"
                withPadding
                className={`${montserrat_paragraph.variable} font-montserratParagraph`}
              >
                <List.Item>
                  First email us to get access to n8n. We will send you an
                  invite.
                </List.Item>
                <List.Item>
                  Create an account and store your password safely through{' '}
                  <a
                    href="https://primary-production-1817.up.railway.app/setup"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: '#8B5CF6',
                      textDecoration: 'underline',
                    }}
                  >
                    this link
                  </a>
                </List.Item>
                <List.Item>
                  Inside n8n, create an n8n API key and input it in the textbox
                  below.
                </List.Item>
                <List.Item>
                  Any workflow you create will be enabled by default in this
                  project.
                  <br />
                </List.Item>
                <List.Item>Check out your workflows below!</List.Item>
              </List>
            </div>
            <N8nWorkflowsTable n8nApiKey={n8nApiKey} isLoading={isLoading} />

            <div style={{ width: '40%' }}>
              <TextInput
                label="n8n API Key"
                description="We use this to run your workflows. You can find your n8n API Key in your n8n account settings."
                placeholder="Enter your n8n API Key here"
                value={n8nApiKey}
                onChange={(event) => setN8nApiKey(event.currentTarget.value)}
                className={`${montserrat_paragraph.variable} font-montserratParagraph`}
              />
              <div className="pt-2" />
              <Button
                onClick={(event) => handleSaveApiKey()}
                className="bg-purple-800 hover:border-indigo-600 hover:bg-indigo-600"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save'}
              </Button>
            </div>

            <div className="pt-5"></div>
            {/* NOMIC VISUALIZATION  */}
            {/* {false ? ( */}
            {/* {true ? ( */}
            {/* {nomicIsLoading ? (
              <>
                <span className="nomic-iframe skeleton-box pl-7 pr-7 pt-4"></span>
              </>
            ) : (
              <>
                <iframe
                  className="nomic-iframe pl-7 pr-7 pt-4 pt-4"
                  // id={nomicMapData.map_id}
                  allow="clipboard-read; clipboard-write"
                  src={'https://primary-production-60d0.up.railway.app/setup'}
                />
                <Title
                  order={6}
                  className={`w-full text-center ${montserrat_heading.variable} mt-2 font-montserratHeading`}
                >
                  A conceptual flow chart of the pre and post processing of
                  context for the LLM.
                  <br></br>
                  Read more about{' '}
                  <a
                    className={'text-purple-600'}
                    href="https://docs.n8n.io/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'underline', paddingRight: '5px' }}
                  >
                    n8n
                  </a>
                </Title>
              </>
            )} */}
          </Flex>
        </div>
        <GlobalFooter />
      </main>
    </>
  )
}

import {
  IconAlertCircle,
  IconCheck,
  IconCloudDownload,
  IconDownload,
  IconExternalLink,
} from '@tabler/icons-react'

import { CannotEditCourse } from './CannotEditCourse'
import { type CourseMetadata } from '~/types/courseMetadata'
// import { CannotViewCourse } from './CannotViewCourse'

interface CourseFile {
  name: string
  s3_path: string
  course_name: string
  readable_filename: string
  type: string
  url: string
  base_url: string
}

interface CourseFilesListProps {
  files: CourseFile[]
}
import { IconTrash } from '@tabler/icons-react'
import { MainPageBackground } from './MainPageBackground'
import { extractEmailsFromClerk } from './clerkHelpers'
import { notifications } from '@mantine/notifications'
import GlobalFooter from './GlobalFooter'
import Navbar from './navbars/Navbar'
import { N8nWorkflowsTable } from './N8nWorkflowsTable'

const CourseFilesList = ({ files }: CourseFilesListProps) => {
  const router = useRouter()
  const { classes, theme } = useStyles()
  const handleDelete = async (s3_path: string, course_name: string) => {
    try {
      const response = await axios.delete(
        `https://flask-production-751b.up.railway.app/delete`,
        {
          params: { s3_path, course_name },
        },
      )
      // Handle successful deletion, show a success message
      showToastOnFileDeleted(theme)
      // Refresh the page
      await router.push(router.asPath)
    } catch (error) {
      console.error(error)
      // Show error message
      showToastOnFileDeleted(theme, true)
    }
  }

  return (
    <div
      className="mx-auto w-full justify-center rounded-md  bg-violet-100 p-5 shadow-md" // bg-violet-100
      style={{ marginTop: '-1rem', backgroundColor: '#0F1116' }}
    >
      <ul role="list" className="grid grid-cols-2 gap-4">
        {files.map((file, index) => (
          <li
            key={file.s3_path}
            className="hover:shadow-xs flex items-center justify-between gap-x-6 rounded-xl bg-violet-300 py-4 pl-4 pr-1 transition duration-200 ease-in-out hover:bg-violet-200 hover:shadow-violet-200"
            onMouseEnter={(e) => {
              // Removed this because it causes the UI to jump around on mouse enter.
              // e.currentTarget.style.border = 'solid 1.5px'
              e.currentTarget.style.borderColor = theme.colors.violet[8]
            }}
            onMouseLeave={(e) => {
              // e.currentTarget.style.border = 'solid 1.5px'
            }}
          >
            {/* Conditionally show link in small text if exists */}
            {file.url ? (
              <div
                className="min-w-0 flex-auto"
                style={{
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                <a href={file.url} target="_blank" rel="noopener noreferrer">
                  <p className="truncate text-xl font-semibold leading-6 text-gray-800">
                    {file.readable_filename}
                  </p>
                  <p className="mt-1 truncate text-xs leading-5 text-gray-600">
                    {file.url || ''}
                  </p>
                </a>
              </div>
            ) : (
              <div
                className="min-w-0 flex-auto"
                style={{
                  maxWidth: '80%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                <p className="text-xl font-semibold leading-6 text-gray-800">
                  {file.readable_filename}
                </p>
                {/* SMALL LOWER TEXT FOR FILES IN LIST */}
                {/* <p className="mt-1 truncate text-xs leading-5 text-gray-600">
                  {file.course_name}
                </p> */}
              </div>
            )}
            <div className="me-4 flex justify-end space-x-2">
              {/* Download button */}
              <button
                onClick={() =>
                  fetchPresignedUrl(file.s3_path).then((url) => {
                    if (url) {
                      window.open(url, '_blank')
                    }
                  })
                }
                className="btn-circle btn cursor-pointer items-center justify-center border-0 bg-transparent transition duration-200 ease-in-out"
                // style={{ outline: 'solid 1px', outlineColor: 'white' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.grape[8]
                  ;(e.currentTarget.children[0] as HTMLElement).style.color =
                    theme.colorScheme === 'dark'
                      ? theme.colors.gray[2]
                      : theme.colors.gray[1]
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  ;(e.currentTarget.children[0] as HTMLElement).style.color =
                    theme.colors.gray[8]
                }}
              >
                <IconDownload className="h-5 w-5 text-gray-800" />
              </button>
              {/* Delete button */}
              <button
                onClick={() =>
                  handleDelete(
                    file.s3_path as string,
                    file.course_name as string,
                  )
                }
                className="btn-circle btn cursor-pointer items-center justify-center border-0 bg-transparent transition duration-200 ease-in-out"
                // style={{ outline: 'solid 1px', outlineColor: theme.white }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.grape[8]
                  ;(e.currentTarget.children[0] as HTMLElement).style.color =
                    theme.colorScheme === 'dark'
                      ? theme.colors.gray[2]
                      : theme.colors.gray[1]
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  ;(e.currentTarget.children[0] as HTMLElement).style.color =
                    theme.colors.red[6]
                }}
              >
                <IconTrash className="h-5 w-5 text-red-600" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

async function fetchCourseMetadata(course_name: string) {
  try {
    const response = await fetch(
      `/api/UIUC-api/getCourseMetadata?course_name=${course_name}`,
    )
    console.log('REsponse received while fetching metadata:', response)
    if (response.ok) {
      const data = await response.json()
      if (data.success === false) {
        throw new Error(
          data.message || 'An error occurred while fetching course metadata',
        )
      }
      // Parse is_private field from string to boolean
      if (
        data.course_metadata &&
        typeof data.course_metadata.is_private === 'string'
      ) {
        data.course_metadata.is_private =
          data.course_metadata.is_private.toLowerCase() === 'true'
      }
      return data.course_metadata
    } else {
      throw new Error(
        `Error fetching course metadata: ${
          response.statusText || response.status
        }`,
      )
    }
  } catch (error) {
    console.error('Error fetching course metadata:', error)
    throw error
  }
}

const showToastOnFileDeleted = (theme: MantineTheme, was_error = false) => {
  return (
    // docs: https://mantine.dev/others/notifications/

    notifications.show({
      id: 'file-deleted-from-materials',
      withCloseButton: true,
      onClose: () => console.log('unmounted'),
      onOpen: () => console.log('mounted'),
      autoClose: 6000,
      // position="top-center",
      title: was_error ? 'Error deleting file' : 'Deleting file...',
      message: was_error
        ? "An error occurred while deleting the file. Please try again and I'd be so grateful if you email kvday2@illinois.edu to report this bug."
        : 'The file will be delted in the background. After about 10 seconds, it will be 100% purged from our servers and, of course, will no longer be used by the chatbot.',
      icon: <IconCheck />,
      // className: 'my-notification-class',
      styles: {
        root: {
          backgroundColor: was_error
            ? theme.colors.errorBackground
            : theme.colors.nearlyWhite,
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
      },
      loading: false,
    })
  )
}

export default MakeToolsPage
