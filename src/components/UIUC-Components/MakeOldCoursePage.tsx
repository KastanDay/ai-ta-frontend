import Head from 'next/head'
import { DropzoneS3Upload } from '~/components/Upload_S3'
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
  // TextInput,
  // Tooltip,
} from '@mantine/core'
// const rubik_puddles = Rubik_Puddles({ weight: '400', subsets: ['latin'] })
const montserrat = Montserrat({ weight: '700', subsets: ['latin'] })
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/router'

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
  const [currentEmail, setCurrentEmail] = useState('')

  const router = useRouter()

  const currentPageName = GetCurrentPageName()

  useEffect(() => {
    const fetchData = async () => {
      const userEmail = clerk_user.user?.primaryEmailAddress
        ?.emailAddress as string
      setCurrentEmail(userEmail)

      const metadata: CourseMetadata = (await fetchCourseMetadata(
        currentPageName,
      )) as CourseMetadata
      setCourseMetadata(metadata)
    }

    fetchData()
  }, [currentPageName, clerk_user.isLoaded])

  // if (!isLoaded || !userId) {
  //   return <AuthComponent course_name={currentPageName} />
  // }
  if (!isLoaded || !userId || !courseMetadata) {
    return <AuthComponent course_name={currentPageName} />
  }

  // TODO: update this check to consider Admins & participants.
  // If participant, say "You cannot edit this course (because you're not an admin) but you can view it.
  if (
    courseMetadata &&
    currentEmail !== (courseMetadata.course_owner as string) &&
    courseMetadata.course_admins.indexOf(currentEmail) === -1
  ) {
    router.push(`/${course_name}/not_authorized`)

    return (
      <>
        <CannotEditCourse
          course_name={currentPageName as string}
          // current_email={currentEmail as string}
        />
        {/* <CannotViewCourse
        course_name={currentPageName as string}
        // current_email={currentEmail as string}
        /> */}
      </>
    )
  }

  return (
    <>
      <Head>
        <title>{course_name}</title>
        <meta
          name="description"
          content="The AI teaching assistant built for students at UIUC."
        />
        <link rel="icon" href="/favicon.ico" />
        {/* <Header /> */}
      </Head>
      <main className="justify-center; course-page-main flex min-h-screen flex-col items-center">
        <div className="container flex flex-col items-center justify-center gap-8 px-4 py-8 ">
          <Link href="/">
            <h2 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
              {' '}
              UIUC Course{' '}
              <span className="${inter.style.fontFamily} text-[hsl(280,100%,70%)]">
                AI
              </span>{' '}
            </h2>
          </Link>
        </div>
        <div className="items-left container flex flex-col justify-center gap-2 py-0">
          <Flex direction="column" align="center" justify="center">
            <Title
              className={montserrat.className}
              variant="gradient"
              gradient={{ from: 'gold', to: 'white', deg: 50 }}
              order={2}
              p="xl"
            >
              {' '}
              Upload more materials{' '}
            </Title>
            <DropzoneS3Upload
              course_name={course_name}
              redirect_to_gpt_4={false}
            />
            <Title order={4}>
              Stay on page until loading is complete or ingest will fail.
            </Title>
            <Title order={4}>
              The page will auto-refresh when your AI Assistant is ready.
            </Title>
            <PrivateOrPublicCourse
              course_name={course_name}
              course_metadata={courseMetadata as CourseMetadata}
            />
            <Title
              className={montserrat.className}
              variant="gradient"
              gradient={{ from: 'gold', to: 'white', deg: 50 }}
              order={2}
              p="xl"
              style={{ marginTop: '4rem' }}
            >
              {' '}
              {course_name} Course Files{' '}
            </Title>
            <CourseFilesList files={course_data} />
          </Flex>
        </div>
      </main>
    </>
  )
}

import { Checkbox, CheckboxProps } from '@mantine/core'
import { IconLock } from '@tabler/icons-react'

import EmailChipsComponent from './EmailChipsComponent'
import { AuthComponent } from './AuthToEditCourse'
import { CannotEditCourse } from './CannotEditCourse'
import { CourseMetadata } from '~/types/courseMetadata'
import { CannotViewCourse } from './CannotViewCourse'

const PrivateOrPublicCourse = ({
  course_name,
  course_metadata,
}: {
  course_name: string
  course_metadata: CourseMetadata
}) => {
  // TODO: fix default state of this... get it from KV store.
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
      <Title
        className={montserrat.className}
        variant="gradient"
        gradient={{ from: 'gold', to: 'white', deg: 50 }}
        order={2}
        p="xl"
        style={{ marginTop: '4rem' }}
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
      {/* </Group>
      <Group className="p-3"> */}

      <Text>
        Only the below email address are able to access the content. Read our
        strict security policy (in progress).
      </Text>
      {isPrivate && (
        <EmailChipsComponent
          course_owner={owner_email}
          course_admins={[]} // todo enable this feature
          course_name={course_name}
          is_private={isPrivate}
        />
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
const CourseFilesList = ({ files }: CourseFilesListProps) => {
  const router = useRouter()
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
      // Handle errors, e.g., show an error message
    }
  }

  return (
    <div className="mx-auto w-full justify-center rounded-3xl border border-violet-950 bg-violet-200 p-5 shadow-md shadow-amber-100">
      <ul role="list" className="divide-y divide-gray-100">
        {files.map((file) => (
          <li
            key={file.s3_path}
            className={`bg flex items-center justify-between gap-x-6 rounded-3xl border border-violet-700 bg-violet-950 py-5 shadow-md shadow-amber-100`}
          >
            <div className="flex gap-x-4">
              <div className="min-w-0 flex-auto">
                <p className="px-6 text-xl font-semibold leading-6 text-white">
                  {file.readable_filename}
                </p>
                <p className="mt-1 truncate px-6 text-xs leading-5 text-white">
                  {file.course_name}
                </p>
              </div>
            </div>
            <button
              onClick={() =>
                handleDelete(file.s3_path as string, file.course_name as string)
              }
              className="mr-4 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-800"
            >
              <span className="text-xl font-bold">-</span>
            </button>
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
        console.error('An error occurred while fetching course metadata')
        return null
      }
      return data.course_metadata
    } else {
      console.error(`Error fetching course metadata: ${response.status}`)
      return null
    }
  } catch (error) {
    console.error('Error fetching course metadata:', error)
    return null
  }
}

export default MakeOldCoursePage
