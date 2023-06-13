import React from 'react'
import Link from 'next/link'
import { 
  Montserrat, 
  // Inter, 
  Rubik_Puddles, 
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
const rubikpuddles = Rubik_Puddles({ weight: '400', subsets: ['latin'] })

export const AuthComponent = ({
  course_name,
}: {
  course_name: string
}) => {
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
              {/* <SignInButton className={"${inter.style.fontFamily}", montserrat.className, 'kas-gradient-text'} style={{'variant':"gradient", 'font-size': '72px'}}/> */}
              <SignInButton mode="modal">
                <Button className="btn kas-gradient-text" style={{fontSize: '24px'}}>
                  Sign in →
                </Button>
              </SignInButton>
              {/* <SignInButton appearance={{
                    userProfile: { elements: { breadcrumbs: "bg-slate-500" } },
                  }} className={'kas-gradient-text'} style={{'font-family': '${montserrat.className}, inter.style.fontFamily', 'variant':"gradient", 'font-size': '72px'}}/> */}
            {/* <Title order={4}>
              Stay on page until loading is complete or ingest will fail.
            </Title>
            <Title order={4}>
              The page will auto-refresh when your AI Assistant is ready.
            </Title>
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
            </Title>*/}
          </Flex>
        </div>
      </main>
    </>
  )
}