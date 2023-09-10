import React from 'react'
import Link from 'next/link'
import {
  // Card,
  // Image,
  // Text,
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
import { montserrat_heading } from 'fonts'
// const rubikpuddles = Rubik_Puddles({ weight: '400', subsets: ['latin'] })

export const CannotEditCourse = ({ course_name }: { course_name: string }) => {
  return (
    <>
      <Flex direction="column" align="center" justify="center">
        <Title
          className={`${montserrat_heading.variable} font-montserratHeading`}
          variant="gradient"
          gradient={{ from: 'gold', to: 'white', deg: 50 }}
          order={2}
          p="xl"
        >
          {' '}
          You cannot edit this page because you don&apos;t own it.
          <br></br>
          {/* It&apos;s for using GPT-4 by itself with no extra knowledge base. */}
        </Title>

        <Title
          className={`${montserrat_heading.variable} font-montserratHeading`}
          variant="gradient"
          gradient={{ from: 'gold', to: 'white', deg: 50 }}
          order={3}
          p="xl"
        >
          {' '}
          Either sign in with a different account (in the top right) or
          <br></br>
          go to any other URL, like{' '}
          <Link href={'/your-awesome-course'}>
            uiuc.chat/your-awesome-course
          </Link>
          , to make a new page.
        </Title>
      </Flex>
    </>
  )
}
