import Head from 'next/head'
import React, { useState } from 'react'

import PlainNavbar from '~/components/UIUC-Components/navbars/PlainNavbar'
import { useMediaQuery } from '@mantine/hooks'
import EditCourseCard from '~/components/UIUC-Components/EditCourseCard'

const MakeNewCoursePage = ({
  course_name,
  current_user_email,
}: {
  course_name: string
  current_user_email: string
}) => {

  return (
    <>
      <PlainNavbar />
      <Head>
        <title>{course_name}</title>
        <meta
          name="description"
          content="Create a new project on UIUC.chat."
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
