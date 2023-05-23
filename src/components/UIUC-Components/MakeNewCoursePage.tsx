import Head from 'next/head'
import { DropzoneS3Upload } from '~/components/Upload_S3'

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

import Link from 'next/link'
import React from 'react'

const MakeNewCoursePage = ({ course_name }: { course_name: string }) => {
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
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
          <Link href="/">
            <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
              UIUC Course <span className="text-[hsl(280,100%,70%)]">AI</span>
            </h1>
          </Link>
        </div>
        <div className="items-left container flex flex-col justify-center gap-12 px-20 py-16 ">
          <h2 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
            Course does not exist,{' '}
            <span className="text-[hsl(280,100%,70%)]">&nbsp;yet!</span>
          </h2>
          <Title order={2}></Title>
          <Flex direction="column" align="center" justify="center">
            <Title style={{ color: 'White' }} order={3} p="md">
              To create course, simply upload your course materials and on
              will be created for you!
            </Title>
            <Title style={{ color: 'White' }} order={3} variant="normal">
              The course will be named:
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
          </Flex>
        </div>
      </main>
    </>
  )
}

export default MakeNewCoursePage