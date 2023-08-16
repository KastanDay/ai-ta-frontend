import { type NextPage } from 'next'
// import Head from 'next/head'
// import { env } from '~/env.mjs'
// import { DropzoneS3Upload } from '~/components/Upload_S3'
// import dynamic from 'next/dynamic'
import axios from 'axios'

import MakeNewCoursePage from '~/components/UIUC-Components/MakeNewCoursePage'
import MakeOldCoursePage from '~/components/UIUC-Components/MakeOldCoursePage'
// import { cannotEditGPT4Page } from '~/components/UIUC-Components/CannotEditGPT4'

// import { Card, Image, Text, Title, Badge, Button, Group } from '@mantine/core'

import React from 'react'
// import { createClient } from '@supabase/supabase-js'
import { GetServerSideProps, GetServerSidePropsContext } from 'next'

// import Header from '~/components/UIUC-Components/GlobalHeader'
import { Montserrat } from 'next/font/google'
const montserrat = Montserrat({
  weight: '700',
  subsets: ['latin'],
})

import { kv } from '@vercel/kv'

export async function checkIfCourseExists(course_name: string) {
  try {
    const courseExists = await kv.get(course_name)
    // console.log(courseExists);
    return courseExists as boolean
  } catch (error) {
    console.log(error)
    return false
  }
}

import { useRouter } from 'next/router'

export const GetCurrentPageName = () => {
  // /CS-125/materials --> CS-125
  return useRouter().asPath.slice(1).split('/')[0]
}

// method to call flask backend api to get course data
async function getCourseData(course_name: string) {
  const API_URL = 'https://flask-production-751b.up.railway.app'

  try {
    const response = await axios.get(`${API_URL}/getAll`, {
      params: { course_name },
    })

    // return response.data.distinct_files
    return response.data.all_s3_paths
  } catch (error) {
    console.error('Error fetching course files:', error)
    return null
  }
}

// run on server side
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { params } = context
  if (!params) {
    console.log('no params')
    return {
      course_data: null,
      course_name: null,
    }
  }
  console.log('params ----------------------', params)
  const course_name = params['course_name']
  console.log('materials.tsx -- Acter course name', course_name)

  const course_exists: boolean = await checkIfCourseExists(
    course_name as string,
  )
  console.log('materials.tsx -- after course_exists', course_exists)
  if (course_exists != null) {
    // call flask backend to get course data

    // TODO: FIX COURSE DATA TO ASYNC
    console.log('materials.tsx before course_data')
    const course_data = await getCourseData(course_name as string)
    // const course_data = 'hi'
    console.log('materials.tsx after course data ', course_data)
    if (course_data != null) {
      // console.log('materials.tsx -- course_data', course_data)
      return {
        props: {
          course_name,
          course_data,
        },
      }
    }
  }
  return {
    props: {
      course_name,
      course_exists,
    },
  }
}

interface CourseMainProps {
  course_name: string
  course_data: any
}

import { useAuth, useUser } from '@clerk/nextjs'
import { CannotEditGPT4Page } from '~/components/UIUC-Components/CannotEditGPT4'
import { LoadingSpinner } from '~/components/UIUC-Components/LoadingSpinner'
import { MainPageBackground } from '~/components/UIUC-Components/MainPageBackground'
import { AuthComponent } from '~/components/UIUC-Components/AuthToEditCourse'
import { Title } from '@mantine/core'
import { extractEmailsFromClerk } from '~/components/UIUC-Components/clerkHelpers'

// run on client side
const CourseMain: NextPage<CourseMainProps> = (props) => {
  // console.log('PROPS IN materials.tsx', props)
  const course_name = props.course_name
  const course_data = props.course_data
  const currentPageName = GetCurrentPageName() as string
  // const { isLoaded, userId, sessionId, getToken } = useAuth() // Clerk Auth
  const { user, isLoaded, isSignedIn } = useUser()

  // Check auth - https://clerk.com/docs/nextjs/read-session-and-user-data
  if (!isLoaded) {
    return (
      <MainPageBackground>
        <LoadingSpinner />
      </MainPageBackground>
    )
  }

  if (!isSignedIn) {
    console.log('User not logged in', isSignedIn, isLoaded, currentPageName)
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
    props.course_name.toLowerCase() == 'gpt4' ||
    props.course_name.toLowerCase() == 'global' ||
    props.course_name.toLowerCase() == 'extreme'
  ) {
    return <CannotEditGPT4Page course_name={currentPageName as string} />
  }

  // NEW COURSE
  if (props.course_data == null) {
    return (
      <MakeNewCoursePage
        course_name={currentPageName as string}
        current_user_email={user_emails[0] as string}
      />
    )
  }

  return (
    <>
      <MakeOldCoursePage
        course_name={currentPageName as string}
        course_data={course_data}
        // current_user_email={user_emails[0] as string}
      />
    </>
  )
}
export default CourseMain
