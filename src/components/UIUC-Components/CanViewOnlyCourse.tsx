// import React from 'react'
import Link from 'next/link'
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
} from '@mantine/core'
import GlobalHeader from './GlobalHeader'
import { CourseMetadata } from '~/types/courseMetadata'
const montserrat = Montserrat({ weight: '700', subsets: ['latin'] })
// const rubikpuddles = Rubik_Puddles({ weight: '400', subsets: ['latin'] })
import React, { useState, useEffect } from 'react'
import Spinner from '../Spinner'
import { LoadingSpinner } from './LoadingSpinner'
import { useRouter } from 'next/router'
import { useUser } from '@clerk/nextjs'
import { CannotEditCourse } from './CannotEditCourse'
import GlobalFooter from './GlobalFooter'

export const GetCurrentPageName = () => {
  // /CS-125/materials --> CS-125
  return useRouter().asPath.slice(1).split('/')[0] as string
}

export const CanViewOnlyCourse = ({
  course_name,
  course_metadata,
}: {
  course_name: string
  course_metadata: CourseMetadata
}) => {
  // const { isSignedIn, user } = useUser()
  // const curr_user_email = user?.primaryEmailAddress?.emailAddress as string
  const router = useRouter()

  const getCurrentPageName = () => {
    // /CS-125/materials --> CS-125
    return router.asPath.slice(1).split('/')[0]
  }

  if (course_metadata == null || course_name == null) {
    // if you refresh the not_authorized page
    router.push(`${getCurrentPageName}/materials`)
  }

  return (
    <>
      <GlobalHeader />
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
            <div
              style={{
                display: 'inline-block',
                border: '1px solid gold',
                borderRadius: '4px',
                padding: '1rem',
              }}
            >
              <Title
                className={montserrat.className}
                variant="gradient"
                gradient={{ from: 'gold', to: 'white', deg: 50 }}
                order={2}
                p="xl"
              >
                {' '}
                You cannot edit this page, but you <i>can</i> chat here:{' '}
                <Link href={`/${course_name}/gpt4`}>
                  <u
                    style={{
                      textDecoration: 'underline',
                      textDecorationColor: 'gold',
                      color: 'inherit',
                    }}
                  >
                    uiuc.chat/{course_name}
                  </u>
                </Link>
              </Title>
            </div>

            <Flex direction="column" align="center" justify="center">
              {/* SHOW CREATOR AND ADMINS */}
              <Title
                className={montserrat.className}
                variant="gradient"
                gradient={{ from: 'gold', to: 'white', deg: 50 }}
                order={3}
                p="lg"
              >
                For Admin permissions to edit the content, email the creator or
                admins to request access:
              </Title>
              <>
                <Text
                  className={montserrat.className}
                  variant="gradient"
                  gradient={{ from: 'gold', to: 'white', deg: 50 }}
                  // py={8}
                  pb={10}
                  pt={2}
                  size={20}
                >
                  Creator:{' '}
                  <a href={`mailto:${course_metadata['course_owner']}`}>
                    <u
                      style={{
                        textDecoration: 'underline',
                        textDecorationColor: 'gold',
                        color: 'inherit',
                      }}
                    >
                      {course_metadata['course_owner']}
                    </u>
                  </a>
                  {course_metadata['course_admins'].length > 0 && (
                    <>
                      <br></br>
                      Admins:{' '}
                      <a
                        href={`mailto:${course_metadata['course_admins'].join(
                          ', ',
                        )}`}
                      >
                        <u
                          style={{
                            textDecoration: 'underline',
                            textDecorationColor: 'gold',
                            color: 'inherit',
                          }}
                        >
                          {course_metadata['course_admins'].join(', ')}
                        </u>
                      </a>
                    </>
                  )}
                </Text>
              </>
            </Flex>

            <Title
              className={montserrat.className}
              variant="gradient"
              gradient={{ from: 'gold', to: 'white', deg: 50 }}
              order={3}
              p="xl"
              py={35}
            >
              {' '}
              If <i>you are</i> the creator or an admin, please sign in with the
              account you used to create this page (in the top right).
              <br></br>
              <br></br>
              Or make a <i>new</i> page by going to any other ULR, like{' '}
              <Link href={'/your-awesome-course'}>
                <u
                  style={{
                    textDecoration: 'underline',
                    textDecorationColor: 'gold',
                    color: 'inherit',
                  }}
                >
                  uiuc.chat/your-awesome-course
                </u>
              </Link>
              .
            </Title>
          </Flex>
        </div>
        <GlobalFooter />
      </main>
    </>
  )
}
