import Head from 'next/head'
import { DropzoneS3Upload } from '~/components/Upload_S3'

// import { Montserrat, Inter, Rubik_Puddles, Audiowide } from "next/font/google"
import { Montserrat } from 'next/font/google'

import {
  Card,
  Image,
  Text,
  Title,
  Badge,
  MantineProvider,
  Button,
  Group,
  Stack,
  createStyles,
  FileInput,
  Flex,
  rem,
} from '@mantine/core'

// const rubik_puddles = Rubik_Puddles({
//   weight: '400',
//   subsets: ['latin'],
// });

const montserrat = Montserrat({
  weight: '700',
  subsets: ['latin'],
})

import Link from 'next/link'
import React from 'react'
// import { useRouter } from 'next/router'

const MakeNewCoursePage = ({ course_name }: { course_name: string }) => {
  // const router = useRouter()
  // const { course_name: course_name_param } = router.query

  console.log('WERE IN MAKE A NEW COURSE PAGE', course_name)
  console.log('course_name', course_name)

  return (
    <>
      <Head>
        <title>{course_name}</title>
        <meta
          name="description"
          content="The AI teaching assistant built for students at UIUC."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="items-left justify-left; course-page-main flex min-h-screen flex-col">
        <div className="container flex flex-col items-center justify-center gap-8 px-4 py-5 ">
          <Link href="/">
            <h2 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
              UIUC Course{' '}
              <span className="${inter.style.fontFamily} text-[hsl(280,100%,70%)]">
                AI
              </span>
            </h2>
          </Link>
        </div>
        <div className="items-left container flex flex-col justify-center gap-12 px-20 py-16 ">
          <h5 className="xs:text-[5rem] text-5xl font-extrabold tracking-tight text-white">
            <Text
              className={montserrat.className}
              variant="gradient"
              gradient={{ from: 'gold', to: 'white', deg: 20 }}
            >
              {course_name}
            </Text>
            is available, create an AI assistant.
          </h5>

          <Flex direction="column" align="center" justify="center">
            <Title style={{ color: 'White' }} order={3} p="md">
              Just one step: upload your textbooks, lecture slides, video
              recordings and any other files.
            </Title>
            <Title style={{ color: 'White' }} order={3} variant="normal">
              Claim your URL:
            </Title>
            <Title
              style={{ color: 'White' }}
              order={2}
              p="md"
              variant="gradient"
              weight="bold"
              gradient={{ from: 'gold', to: 'white', deg: 140 }}
            >
              {course_name}
            </Title>
            <DropzoneS3Upload course_name={course_name} />
            <Title order={4}>
              Stay on page until loading is complete or ingest will fail.
            </Title>
            <Title order={4}>
              The page will auto-refresh when your AI Assistant is ready.
            </Title>
          </Flex>
        </div>
      </main>
    </>
  )
}

export default MakeNewCoursePage
