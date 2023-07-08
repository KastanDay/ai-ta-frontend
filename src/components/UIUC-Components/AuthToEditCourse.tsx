import React from 'react'
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
  // Text,
  // Badge,
  // MantineProvider,
  Button,
  // Group,
  // Stack,
  // createStyles,
  // FileInput,
  // rem,
  Title,
  Flex,
} from '@mantine/core'
import { SignInButton } from '@clerk/nextjs'
const montserrat = Montserrat({ weight: '700', subsets: ['latin'] })
// const rubikpuddles = Rubik_Puddles({ weight: '400', subsets: ['latin'] })

export const AuthComponent = ({ course_name }: { course_name: string }) => {
  return (
    <>
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
              You must sign in to create or edit content.
            </Title>
            {/* Wrapping a button makes it easy to style the sign-in link. */}
            <SignInButton
              mode="modal"
              redirectUrl={`/${course_name}/materials`} // post sign-in redirect
            >
              <Button
                className="kas-gradient-text btn"
                style={{ fontSize: '24px' }}
              >
                Sign in →
              </Button>
            </SignInButton>
          </Flex>
        </div>
      </main>
    </>
  )
}
