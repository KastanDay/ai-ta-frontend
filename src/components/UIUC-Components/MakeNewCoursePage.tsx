import Head from 'next/head'
import { Montserrat } from 'next/font/google'
import {
  Card,
  Text,
  Flex,
  Group,
  Checkbox,
  Col,
  Paper,
  Input,
  Textarea,
  FileInput,
  MediaQuery,
  type CheckboxProps,
  Title,
} from '@mantine/core'

const montserrat = Montserrat({
  weight: '700',
  subsets: ['latin'],
})

import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import GlobalHeader from './GlobalHeader'
import EmailChipsComponent from './EmailChipsComponent'
import { IconLock } from '@tabler/icons-react'
import { type CourseMetadata } from '~/types/courseMetadata'
import LargeDropzone from './LargeDropzone'
import Navbar from '~/components/UIUC-Components/Navbar'
import { useMediaQuery } from '@mantine/hooks'
import EditCourseCard from '~/components/UIUC-Components/EditCourseCard'

const MakeNewCoursePage = ({
  course_name,
  current_user_email,
}: {
  course_name: string
  current_user_email: string
}) => {
  const [introMessage, setIntroMessage] = useState('')
  const [courseName, setCourseName] = useState(course_name || '')
  const [isCourseAvailable, setIsCourseAvailable] = useState<
    boolean | undefined
  >(undefined)
  const [allExistingCourseNames, setAllExistingCourseNames] = useState<
    string[]
  >([])
  const isSmallScreen = useMediaQuery('(max-width: 960px)')

  return (
    <>
      <Navbar />
      <Head>
        <title>{course_name}</title>
        <meta
          name="description"
          content="The AI teaching assistant built for students at UIUC."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main
        className="course-page-main"
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'start',
          minHeight: '100vh',
          padding: '1rem',
        }}
      >
        <EditCourseCard
          course_name={course_name}
          current_user_email={current_user_email}
          is_new_course={true}
        />
      </main>
    </>
  )
}

export default MakeNewCoursePage
