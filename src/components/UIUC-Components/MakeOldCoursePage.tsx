import Head from 'next/head'
import { DropzoneS3Upload } from '~/components/UIUC-Components/Upload_S3'
import {
  Montserrat,
  // Inter,
  // Rubik_Puddles,
  // Audiowide,
} from 'next/font/google'
import {
  // Card,
  // Image,
  Text,
  // Badge,
  // MantineProvider,
  // Button,
  // Group,
  // Stack,
  // createStyles,
  // FileInput,
  // rem,
  Title,
  Flex,
  Group,
  createStyles,
  Divider,
  // TextInput,
  // Tooltip,
} from '@mantine/core'
// const rubik_puddles = Rubik_Puddles({ weight: '400', subsets: ['latin'] })
const montserrat = Montserrat({ weight: '700', subsets: ['latin'] })
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/router'
const useStyles = createStyles((theme) => ({}))

// import Header from '~/components/UIUC-Components/GlobalHeader'
// import { ClerkProvider, SignedIn } from '@clerk/nextjs'
// import { auth } from '@clerk/nextjs';

import { useAuth, useUser } from '@clerk/nextjs'

export const GetCurrentPageName = () => {
  // /CS-125/materials --> CS-125
  return useRouter().asPath.slice(1).split('/')[0] as string
}

const MakeOldCoursePage = ({
  course_name,
  course_data,
}: {
  course_name: string
  course_data: any
}) => {
  // Check auth - https://clerk.com/docs/nextjs/read-session-and-user-data
  const { isLoaded, userId, sessionId, getToken } = useAuth() // Clerk Auth
  // const { isSignedIn, user } = useUser()
  const clerk_user = useUser()
  const [courseMetadata, setCourseMetadata] = useState<CourseMetadata | null>(
    null,
  )
  const { classes, theme } = useStyles()
  const [currentEmail, setCurrentEmail] = useState('')

  const router = useRouter()

  const currentPageName = GetCurrentPageName()

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
    router.push(`/${course_name}/not_authorized`)

    return (
      <CannotEditCourse
        course_name={currentPageName as string}
        // current_email={currentEmail as string}
      />
    )
  }

  return (
    <>
      <div className="flex flex-col items-center bg-[#2e026d]">
        <div className="mt-4 w-full max-w-[95%]">
          <div className="navbar rounded-badge h-24 min-h-fit bg-[#15162c] shadow-lg shadow-purple-800">
            <div className="flex-1">
              <Link href="/">
                <h2 className="ms-8 cursor-pointer text-3xl font-extrabold tracking-tight text-white sm:text-[2rem] ">
                  UIUC Course{' '}
                  <span className="text-[hsl(280,100%,70%)]">AI</span>
                </h2>
              </Link>
            </div>
            <Flex direction="row" align="center" justify="center">
              <div className="ms-4 mt-4 flex flex-row items-center justify-center gap-2">
                <ResumeToChat course_name={course_name} />
              </div>
            </Flex>

            {/* THIS BUTTON IS FOR "GPT4" CHAT */}
            {/* <button
              className={`btn-circle btn mb-1 ms-4`}
              style={{
                position: 'relative',
                boxSizing: 'border-box',
                display: 'flex',
                color: theme.colors.grape[8],
                fontSize: '11px',
                alignItems: 'center',
                justifyContent: 'center',
                transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
                transition: 'background-color 0.2s ease-in-out',
                height: '52px', // Adjusted icon size to match ResumeToChat button
                width: '52px', // Adjusted icon size to match ResumeToChat button
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.grape[9]
                e.currentTarget.style.width = '48px'
                e.currentTarget.style.height = '40px'
                e.currentTarget.style.marginBottom = '0px'
                ;(e.currentTarget.children[0] as HTMLElement).style.display =
                  'none'
                ;(e.currentTarget.children[1] as HTMLElement).style.display =
                  'none'
                ;(e.currentTarget.children[2] as HTMLElement).style.display =
                  'block'
                ;(
                  (e.currentTarget.children[2] as HTMLElement)
                    .children[0] as HTMLElement
                ).style.stroke = theme.white
                ;(
                  (e.currentTarget.children[2] as HTMLElement)
                    .children[0] as HTMLElement
                ).style.color = theme.white
                // ((e.currentTarget.children[2] as HTMLElement).children[0] as HTMLElement).style. = theme.white;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.width = '52px'
                e.currentTarget.style.height = '52px'
                e.currentTarget.style.backgroundColor = 'transparent'
                ;(e.currentTarget.children[0] as HTMLElement).style.display =
                  'block'
                ;(e.currentTarget.children[1] as HTMLElement).style.display =
                  'block'
                ;(e.currentTarget.children[2] as HTMLElement).style.display =
                  'none'
                ;(
                  (e.currentTarget.children[2] as HTMLElement)
                    .children[0] as HTMLElement
                ).style.stroke = 'currentColor'
              }}
              onClick={() => router.push(`/${course_name}/gpt4`)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="icon icon-tabler icon-tabler-message-circle-2"
                width="48" // Adjusted icon size to match ResumeToChat button
                height="48" // Adjusted icon size to match ResumeToChat button
                viewBox="0 0 22 22"
                strokeWidth="1.5"
                stroke="currentColor"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                <path d="M3 20l1.3 -3.9a9 8 0 1 1 3.4 2.9l-4.7 1"></path>
              </svg>
              <span
                style={{
                  position: 'absolute',
                  color: 'white',
                  top: '54%',
                  left: '54%',
                  transform: 'translate(-50%, -50%)',
                }}
              >
                GPT4
              </span>{' '}
              {/* Adjusted the vertical position of the text */}
            {/* <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                stroke="currentColor"
                style={{
                  width: '16px',
                  height: '16px',
                  position: 'absolute',
                  display: 'none',
                }} // Adjusted size
              >
                <path
                  fillRule="evenodd"
                  d="M8.25 3.75H19.5a.75.75 0 01.75.75v11.25a.75.75 0 01-1.5 0V6.31L5.03 20.03a.75.75 0 01-1.06-1.06L17.69 5.25H8.25a.75.75 0 010-1.5z"
                  clipRule="evenodd"
                />
              </svg>
            </button> */}
            <Header isNavbar={true} />
          </div>
        </div>
      </div>

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
            <div className="flex flex-col items-center justify-center">
              <PrivateOrPublicCourse
                course_name={course_name}
                course_metadata={courseMetadata as CourseMetadata}
              />
            </div>

            {/* <Divider my="sm" style={{width: '35%', backgroundColor: 'grey', height: '1.5px'}} /> */}
            <br></br>

            <Title
              className={montserrat.className}
              variant="gradient"
              gradient={{ from: 'gold', to: 'white', deg: 50 }}
              order={2}
              // p="xl"
              style={{ marginTop: '1rem' }}
            >
              {' '}
              Upload new materials
            </Title>

            <LargeDropzone
              course_name={course_name}
              current_user_email={currentEmail}
              redirect_to_gpt_4={false}
            />
            <br></br>

            <div
              className="mx-auto mt-6 w-[90%] items-start rounded-2xl shadow-md shadow-purple-600"
              style={{ zIndex: 1, background: '#15162c' }}
            >
              <Flex direction="row" justify="space-between">
                <div className="flex flex-row items-start justify-start">
                  <Title
                    className={montserrat.className}
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
                    Course Files
                  </Title>
                </div>
                <div className="me-6 mt-4 flex flex-row items-end justify-end">
                  <DropzoneS3Upload
                    course_name={course_name}
                    redirect_to_gpt_4={false}
                  />
                </div>
              </Flex>
            </div>
            <div className="mt-2 flex w-[80%] flex-col items-center justify-center">
              <CourseFilesList files={course_data} />
            </div>
          </Flex>
        </div>
      </main>
    </>
  )
}

import { Checkbox, CheckboxProps } from '@mantine/core'
import { IconDownload, IconLock } from '@tabler/icons-react'

import EmailChipsComponent from './EmailChipsComponent'
import { AuthComponent } from './AuthToEditCourse'
import { CannotEditCourse } from './CannotEditCourse'
import { CourseMetadata } from '~/types/courseMetadata'
// import { CannotViewCourse } from './CannotViewCourse'
import { ResumeToChat } from '~/components/UIUC-Components/ResumeToChat'
import Header from '~/components/UIUC-Components/GlobalHeader'

const PrivateOrPublicCourse = ({
  course_name,
  course_metadata,
}: {
  course_name: string
  course_metadata: CourseMetadata
}) => {
  const [isPrivate, setIsPrivate] = useState(
    course_metadata.is_private as boolean,
  )

  const { isSignedIn, user } = useUser()
  const owner_email = user?.primaryEmailAddress?.emailAddress as string

  const CheckboxIcon: CheckboxProps['icon'] = ({ indeterminate, className }) =>
    indeterminate ? (
      <IconLock className={className} />
    ) : (
      <IconLock className={className} />
    )

  const handleCheckboxChange = () => {
    const callSetCoursePublicOrPrivate = async (
      course_name: string,
      is_private: boolean,
    ) => {
      try {
        const url = new URL(
          '/api/UIUC-api/setCoursePublicOrPrivate',
          window.location.origin,
        )
        url.searchParams.append('course_name', course_name)
        url.searchParams.append('is_private', String(is_private))

        const response = await fetch(url.toString(), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        const data = await response.json()
        return data.success
      } catch (error) {
        console.error('Error removing user from course:', error)
        return false
      }
    }

    setIsPrivate(!isPrivate) // gui
    callSetCoursePublicOrPrivate(course_name, !isPrivate) // db
  }

  return (
    <>
      {/* className="mt-6 w-[90%] mx-auto flex flex-col rounded-2xl shadow-md shadow-purple-600" */}
      <Title
        className={montserrat.className}
        variant="gradient"
        gradient={{ from: 'gold', to: 'white', deg: 50 }}
        order={2}
        p="xl"
        style={{ marginTop: '1rem' }}
      >
        {' '}
        Course Visibility{' '}
      </Title>
      <Group className="p-3">
        <Checkbox
          label={`Course is ${
            isPrivate ? 'private' : 'public'
          }. Click to change.`}
          // description="Course is private by default."
          aria-label="Checkbox to toggle Course being public or private. Private requires a list of allowed email addresses."
          className={montserrat.className}
          // style={{ marginTop: '4rem' }}
          size="xl"
          // bg='#020307'
          color="grape"
          icon={CheckboxIcon}
          defaultChecked={isPrivate}
          onChange={handleCheckboxChange}
        />
      </Group>
      {isPrivate && (
        <>
          <Text>
            Only the below email address are able to access the content. Read
            our strict security policy (in progress).
          </Text>
          <EmailChipsComponent
            course_owner={owner_email}
            course_admins={[]} // todo enable this feature
            course_name={course_name}
            is_private={isPrivate}
          />
        </>
      )}
    </>
  )
}

interface CourseFile {
  name: string
  s3_path: string
  course_name: string
  readable_filename: string
  type: string
  url: string
}

interface CourseFilesListProps {
  files: CourseFile[]
}
import { IconTrash } from '@tabler/icons-react'
import LargeDropzone from './LargeDropzone'
import { MainPageBackground } from './MainPageBackground'
import { LoadingSpinner } from './LoadingSpinner'
import { extractEmailsFromClerk } from './clerkHelpers'

const CourseFilesList = ({ files }: CourseFilesListProps) => {
  const router = useRouter()
  const { classes, theme } = useStyles()
  const handleDelete = async (s3_path: string, course_name: string) => {
    try {
      const API_URL = 'https://flask-production-751b.up.railway.app'
      const response = await axios.delete(`${API_URL}/delete`, {
        params: { s3_path, course_name },
      })
      // Handle successful deletion, e.g., remove the item from the list or show a success message
      // Refresh the page
      await router.push(router.asPath)
    } catch (error) {
      console.error(error)
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
            className="hover:shadow-xs flex cursor-pointer items-center justify-between gap-x-6 rounded-xl bg-violet-300 py-4 pl-4 pr-1 transition duration-200 ease-in-out hover:bg-violet-200 hover:shadow-violet-200"
            onMouseEnter={(e) => {
              e.currentTarget.style.border = 'solid 1.5px'
              e.currentTarget.style.borderColor = theme.colors.violet[8]
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.border = 'solid 1.5px'
            }}
          >
            <div className="flex gap-x-4">
              <div className="min-w-0 flex-auto">
                <p className="text-xl font-semibold leading-6 text-gray-800">
                  {file.readable_filename}
                </p>
                <p className="mt-1 truncate text-xs leading-5 text-gray-600">
                  {file.course_name}
                </p>
              </div>
            </div>
            <div className="me-4 flex justify-end space-x-2">
              {/* Download button */}
              <button
                onClick={() =>
                  fetchPresignedUrl(file.s3_path).then((url) => {
                    window.open(url, '_blank')
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

    if (response.ok) {
      const data = await response.json()
      if (data.success === false) {
        throw new Error('An error occurred while fetching course metadata')
      }
      return data.course_metadata
    } else {
      throw new Error(`Error fetching course metadata: ${response.status}`)
    }
  } catch (error) {
    console.error('Error fetching course metadata:', error)
    throw error
  }
}

async function fetchPresignedUrl(
  filePath: string,
  // ResponseContentType: string,
) {
  try {
    console.log('filePath', filePath)
    // if filepath ends with .pdf, then ResponseContentType = 'application/pdf'

    const response = await axios.post('/api/download', {
      filePath,
      // ResponseContentType,
    })
    return response.data.url
  } catch (error) {
    console.error('Error fetching presigned URL:', error)
    return null
  }
}

export default MakeOldCoursePage
