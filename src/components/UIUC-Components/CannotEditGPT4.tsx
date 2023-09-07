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
const montserrat = Montserrat({
  weight: '700',
  subsets: ['latin'],
  display: 'swap',
})
// const rubikpuddles = Rubik_Puddles({ weight: '400', subsets: ['latin'] })

export const CannotEditGPT4Page = ({
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
              You cannot edit the gpt4 page.
              <br></br>
              It&apos;s for using GPT-4 by itself with no extra knowledge base.
            </Title>

            <Title
              className={montserrat.className}
              variant="gradient"
              gradient={{ from: 'gold', to: 'white', deg: 50 }}
              order={3}
              p="xl"
            >
              {' '}
              Go to any other ULR, like{' '}
              <Link href={'/your-awesome-course'}>
                uiuc.chat/your-awesome-course
              </Link>
              , to make a new page.
            </Title>
          </Flex>
        </div>
      </main>
    </>
  )
}
