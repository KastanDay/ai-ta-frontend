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

import Header from '~/components/UIUC-Components/GlobalHeader'

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

    // return response.data.url;
    // console.log('response.data', response.data)
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

  const course_exists: boolean = await checkIfCourseExists(
    course_name as string,
  )
  if (course_exists != null) {
    // call flask backend to get course data
    const course_data = await getCourseData(course_name as string)
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

// run on client side
const CourseMain: NextPage<CourseMainProps> = (props) => {
  // console.log('PROPS IN materials.tsx', props)
  const course_name = props.course_name
  const course_data = props.course_data
  const currentPageName = GetCurrentPageName() as string
  // const { isLoaded, userId, sessionId, getToken } = useAuth() // Clerk Auth
  const clerk_user = useUser()

  // Check auth - https://clerk.com/docs/nextjs/read-session-and-user-data
  if (!clerk_user.isLoaded) {
    return (
      <MainPageBackground>
        <LoadingSpinner />
      </MainPageBackground>
    )
  }

  if (!clerk_user.isSignedIn) {
    console.log(
      'User not logged in',
      clerk_user.isSignedIn,
      clerk_user.isLoaded,
      currentPageName,
    )
    // return ("In the if statement biiii")
    return (
      // <MainPageBackground>
      <AuthComponent />
      // <LoadingSpinner />
      // </MainPageBackground>
    )
  }

  // Don't edit certain special pages (no context allowed)
  if (
    props.course_name.toLowerCase() == 'gpt4' ||
    props.course_name.toLowerCase() == 'global' ||
    props.course_name.toLowerCase() == 'extreme'
  ) {
    return <CannotEditGPT4Page course_name={currentPageName || ''} />
  }

  // NEW COURSE
  if (props.course_data == null) {
    return <MakeNewCoursePage course_name={currentPageName || ''} />
  }

  return (
    <>
      <MakeOldCoursePage
        course_name={currentPageName || ''}
        course_data={course_data}
      />
    </>
  )
}
export default CourseMain
