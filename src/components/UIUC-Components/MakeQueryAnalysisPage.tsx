import Head from 'next/head'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import {
  Button,
  Title,
  Text,
  Flex,
  createStyles,
  MantineTheme,
} from '@mantine/core'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { LoadingSpinner } from './LoadingSpinner'
import { downloadConversationHistory } from '../../pages/api/UIUC-api/downloadConvoHistory'
import { MainPageBackground } from './MainPageBackground'
import { extractEmailsFromClerk } from './clerkHelpers'
import { notifications } from '@mantine/notifications'
import GlobalFooter from './GlobalFooter'
import Navbar from './navbars/Navbar'
import Link from 'next/link'
import {
  IconCheck,
  IconCloudDownload,
} from '@tabler/icons-react'
import { CannotEditCourse } from './CannotEditCourse'
import { type CourseMetadata } from '~/types/courseMetadata'
import { useAuth, useUser } from '@clerk/nextjs'

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

export const GetCurrentPageName = () => {
  // /CS-125/materials --> CS-125
  return useRouter().asPath.slice(1).split('/')[0] as string
}

const MakeQueryAnalysisPage = ({ course_name }: { course_name: string }) => {
  // Check auth - https://clerk.com/docs/nextjs/read-session-and-user-data
  const { classes, theme } = useStyles()
  const { isLoaded, userId, sessionId, getToken } = useAuth() // Clerk Auth
  const clerk_user = useUser()
  const [courseMetadata, setCourseMetadata] = useState<CourseMetadata | null>(
    null,
  )
  const [currentEmail, setCurrentEmail] = useState('')

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

  const handleDownload = async (courseName: string) => {
    setIsLoading(true)
    try {
      const result = await downloadConversationHistory(courseName)
      showToastOnUpdate(theme, false, false, result.message)
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
                    What questions are people asking?
                  </Title>
                </div>
                <div className="me-6 flex flex-row items-center justify-end">
                  {/* Can add more buttons here */}
                  <Button
                    className={`${montserrat_paragraph.variable} font-montserratParagraph ${classes.downloadButton}`}
                    rightIcon={
                      isLoading ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <IconCloudDownload />
                      )
                    }
                    onClick={() => handleDownload(course_name)}
                  >
                    Download Conversation History
                  </Button>
                </div>
              </Flex>
            </div>
            <div className="pt-5"></div>
            {/* NOMIC VISUALIZATION  */}
            {/* {false ? ( */}
            {/* {true ? ( */}
            {nomicIsLoading ? (
              <>
                <span className="nomic-iframe skeleton-box pl-7 pr-7 pt-4"></span>
              </>
            ) : nomicMapData && nomicMapData.map_id ? (
              <>
                <iframe
                  className="nomic-iframe pl-7 pr-7 pt-4 pt-4"
                  id={nomicMapData.map_id}
                  allow="clipboard-read; clipboard-write"
                  src={nomicMapData.map_link}
                />
                <Title
                  order={6}
                  className={`w-full text-center ${montserrat_heading.variable} mt-2 font-montserratHeading`}
                >
                  A conceptual map of the questions asked by users on this page.
                  <br></br>
                  Read more about{' '}
                  <a
                    className={'text-purple-600'}
                    href="https://atlas.nomic.ai/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'underline', paddingRight: '5px' }}
                  >
                    semantic similarity visualizations
                  </a>
                </Title>
              </>
            ) : (
              <>
                <Title
                  order={6}
                  className={`w-full text-center ${montserrat_heading.variable} mt-2 font-montserratHeading`}
                >
                  Query visualization requires at least 20 queries to be made...
                  go ask some questions and check back later :)
                  <br></br>
                  Read more about{' '}
                  <a
                    className={'text-purple-600'}
                    href="https://atlas.nomic.ai/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'underline', paddingRight: '5px' }}
                  >
                    semantic similarity visualizations
                  </a>
                </Title>
              </>
            )}
          </Flex>
        </div>
        <GlobalFooter />
      </main>
    </>
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

export default MakeQueryAnalysisPage

export const showToastOnUpdate = (
  theme: MantineTheme,
  was_error = false,
  isReset = false,
  message: string,
) => {
  return notifications.show({
    id: 'convo-or-documents-export',
    withCloseButton: true,
    closeButtonProps: { color: 'green' },
    onClose: () => console.log('error unmounted'),
    onOpen: () => console.log('error mounted'),
    autoClose: 30000,
    title: (
      <Text size={'lg'} className={`${montserrat_heading.className}`}>
        {message}
      </Text>
    ),
    message: (
      <Text className={`${montserrat_paragraph.className}`}>
        Check{' '}
        <Link
          href={
            'https://docs.uiuc.chat/features/bulk-export-documents-or-conversation-history'
          }
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: 'underline', color: 'lightpurple' }}
        >
          our docs
        </Link>{' '}
        for example code to process this data.
      </Text>
    ),
    color: 'green',
    radius: 'lg',
    icon: <IconCheck />,
    className: 'my-notification-class',
    style: {
      backgroundColor: 'rgba(42,42,64,0.6)',
      backdropFilter: 'blur(10px)',
      borderLeft: '5px solid green',
    },
    withBorder: true,
    loading: false,
  })
}
