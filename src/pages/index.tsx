import { type NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { Montserrat, Lora, Audiowide } from 'next/font/google'
// import { signIn, signOut, useSession } from "next-auth/react";

import {
  FileInput,
  rem,
  Card,
  Image,
  Text,
  Title,
  Badge,
  MantineProvider,
  Button,
  Group,
} from '@mantine/core'
import { IconUpload } from '@tabler/icons-react'

import { api } from '~/utils/api'

const Home: NextPage = () => {
  // const hello = api.example.hello.useQuery({ text: "from tRPC" });

  return (
    <>
      <Head>
        <title>UIUC Course AI</title>
        <meta
          name="description"
          content="The AI teaching assistant built for students at UIUC."
        />
        <link rel="icon" href="/favicon.ico" />
        {/* Preload images for improved CLS score */}
        <link
          rel="preload"
          href="https://images.unsplash.com/photo-1527004013197-933c4bb611b3?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=720&q=80"
          as="image"
        />
        <link
          rel="preload"
          href="https://github.com/KastanDay/learning-t3/blob/dd33e38bc801f4f6bbfc3b3a826a09d805f9bf65/media/Toy_University_students_walking_walter_wick_StableDiffusion-xl-beta-v2-2-2.png?raw=true"
          as="image"
        />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#0E1116]">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
          <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
            <Link href="/">
              UIUC Course <span className="text-[hsl(280,100%,70%)]">AI</span>
            </Link>
          </h1>

          <Container
            size="lg"
            py="xl"
            style={{ position: 'relative', minHeight: '100%' }}
          >
            <Title
              color="#57534e"
              order={2}
              variant="gradient"
              weight={800}
              // gradient={{ from: 'indigo', to: 'cyan', deg: 45 }}
              gradient={{ from: 'pink', to: 'blue', deg: 45 }}
              ta="center"
              mt="md"
            >
              Upload anything. Search everything.
              <br></br>
              Discover more.
            </Title>

            <br></br>
            <Title color="white" order={4} ta="center" mt="sm">
              AI Teaching Assistant crafted for UIUC students,
              <br></br>
              by UIUC students.
            </Title>

            <Text color="#57534e" c="dimmed" ta="center" mt="md">
              *Factuality not guaranteed.
              <br></br>
              Test it in your area of expertise to best assess its capabilities.
            </Text>

            <Text color="white" ta="center" mt="md" weight={500} size="lg">
              {/* Add bold span */}
              <span className="font-bold">Upload</span> your videos, any number
              of PDFs, PowerPoint, Word, Excel and almost anything other
              document to chat with your knowledge base.
              <br></br>
              Coming soon: Students can contribute content to enhance the
              AI&apos;s knowledge.
            </Text>
          </Container>

          <Title color="white" order={3}>
            Explore the Courses
          </Title>

          {/* Main courses */}
          <div className="flex flex-col items-center gap-2">
            {/* <p className="text-2xl text-white">
              {hello.data ? hello.data.greeting : "Loading tRPC query..."}
            </p> */}
            {/* <AuthShowcase /> */}
            <CourseCard />
            <MoreCoursesSoonCard />

            {/* <Text variant="gradient" size="xl" >ECE 120</Text>
            <Text STYLE="font-family: 'Audiowide'" variant="gradient" gradient={{ from: 'indigo', to: 'cyan', deg: 45 }} size="xl" weight="800">ECE 120</Text> */}
          </div>

          <h4 className="font-extrabold tracking-tight text-white sm:text-[3rem]">
            <Link href="/">
              Some background{' '}
              <span className="text-[hsl(280,100%,70%)]">about us</span>
            </Link>
          </h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
            <Link
              className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 text-white hover:bg-white/20"
              href="https://github.com/UIUC-Chatbot/ai-teaching-assistant-uiuc"
              target="_blank"
            >
              <h3 className="text-2xl font-bold">Read the code →</h3>
              <div className="text-lg">
                100% free<br></br>100% open source<br></br>100% awesome
              </div>
            </Link>
            <Link
              className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 text-white hover:bg-white/20"
              href="https://kastanday.com/"
              target="_blank"
            >
              <h3 className="text-2xl font-bold">Bio →</h3>
              <div className="text-lg">Made at UIUC by Kastan Day.</div>
            </Link>
          </div>
        </div>

        {/* search */}
        {/* <script async src="https://cse.google.com/cse.js?cx=2616b82a523e047b2">
        </script>
        <div className="gcse-search"></div> */}
      </main>
    </>
  )
}

export default Home

import { createStyles, SimpleGrid, Container } from '@mantine/core'
import { IconGauge, IconUser, IconCookie } from '@tabler/icons-react'

const mockdata = [
  {
    title: 'Faster than ChatGPT, with better prompts',
    description:
      'It is said to have an IQ of 5,000 and is a math genius, and can answer any question you throw at it.',
    icon: IconGauge,
  },
  {
    title: 'Course Specific',
    description:
      'Made by your professor, with all your course materials for hyper-detailed answers.',
    icon: IconUser,
  },
  {
    title: 'Upload anything, get answers',
    description:
      'Add your own study materials and get answers from the AI. Optionally, share these with your classmates.',
    icon: IconCookie,
  },
]

const useStyles = createStyles((theme) => ({
  title: {
    fontSize: rem(34),
    fontWeight: 900,

    [theme.fn.smallerThan('sm')]: {
      fontSize: rem(24),
    },
  },

  description: {
    maxWidth: 600,
    margin: 'auto',

    '&::after': {
      content: '""',
      display: 'block',
      backgroundColor: 'white', //theme.fn.primaryColor(),
      width: rem(45),
      height: rem(2),
      marginTop: theme.spacing.sm,
      marginLeft: 'auto',
      marginRight: 'auto',
    },
  },

  card: {
    border: `${rem(1)} solid ${
      theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[1]
    }`,
  },

  cardTitle: {
    '&::after': {
      content: '""',
      display: 'block',
      backgroundColor: 'white', //theme.fn.primaryColor(),
      width: rem(45),
      height: rem(2),
      marginTop: theme.spacing.sm,
    },
  },
}))

export function FeaturesCards() {
  const { classes, theme } = useStyles()
  const features = mockdata.map((feature) => (
    <Card
      bg="#0E1116"
      key={feature.title}
      shadow="md"
      radius="md"
      className={classes.card}
      padding="xl"
      style={{ position: 'relative', minHeight: '100%' }}
    >
      <feature.icon size={rem(50)} stroke={2} color="#C06BF9" />
      <Text
        color="white"
        fz="lg"
        fw={500}
        className={classes.cardTitle}
        mt="md"
      >
        {feature.title}
      </Text>
      <Text style={{ color: 'white' }} fz="sm" c="dimmed" mt="sm">
        {feature.description}
      </Text>
    </Card>
  ))

  return (
    // <Container size="lg" py="xl" style={{ position: 'relative' }}>

    <SimpleGrid
      cols={3}
      spacing="xl"
      mt={50}
      breakpoints={[{ maxWidth: 'md', cols: 1 }]}
    >
      {features}
    </SimpleGrid>
  )
}

// TODO: USE BETTER CARDS! https://ui.mantine.dev/category/article-cards
function CourseCard() {
  return (
    <div className="box-sizing: border-box; border: 100px solid #ccc;">
      <Link href="/ece120">
        <Card
          bg="#0E1116"
          style={{ maxWidth: '100%', position: 'relative', minHeight: '100%' }}
          shadow="sm"
          padding="lg"
          radius="md"
          withBorder
        >
          <Card.Section>
            <Image
              src="https://images.unsplash.com/photo-1527004013197-933c4bb611b3?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=720&q=80"
              height={160}
              alt="Norway"
            />
          </Card.Section>

          <Group position="apart" mt="md" mb="xs">
            <Text style={{ fontFamily: 'Montserrat' }} size="xl" weight={800}>
              ECE 120
            </Text>
            <Badge size="xl" color="pink" variant="light">
              ECE
            </Badge>
          </Group>

          <Text size="sm" color="dimmed">
            Taught by{' '}
            <Text style={{ display: 'inline' }} color="blue">
              Prof. Volodymyr (Vlad) Kindratenko
            </Text>
            , Director of the Center for Artificial Intelligence Innovation at
            NCSA, in{' '}
            <Text style={{ display: 'inline' }} color="blue">
              Spring 2022
            </Text>
            .
          </Text>

          <Button variant="light" color="blue" fullWidth mt="md" radius="md">
            View
          </Button>
        </Card>
      </Link>
    </div>
  )
}

function MoreCoursesSoonCard() {
  return (
    <div className="box-sizing: border-box; border: 100px solid #ccc;">
      <Link href="/ece120">
        <Card
          bg="#0E1116"
          style={{ maxWidth: '100%', minHeight: '100%' }}
          shadow="sm"
          padding="lg"
          radius="md"
          withBorder
        >
          <Card.Section>
            <Image
              src="https://github.com/KastanDay/learning-t3/blob/dd33e38bc801f4f6bbfc3b3a826a09d805f9bf65/media/Toy_University_students_walking_walter_wick_StableDiffusion-xl-beta-v2-2-2.png?raw=true"
              height={300}
              alt="Students walking to school"
            />
          </Card.Section>

          <Group position="apart" mt="md" mb="xs">
            <Text style={{ fontFamily: 'Montserrat' }} size="xl" weight={800}>
              More courses coming soon :)
            </Text>
            <Badge size="xl" color="pink" variant="light">
              ECE
            </Badge>
          </Group>

          <Text size="sm" color="dimmed">
            Taught by{' '}
            <Text style={{ display: 'inline' }} color="blue">
              Prof. Volodymyr (Vlad) Kindratenko
            </Text>
            , Director of the Center for Artificial Intelligence Innovation at
            NCSA, in{' '}
            <Text style={{ display: 'inline' }} color="blue">
              Spring 2022
            </Text>
            .
          </Text>

          <Button variant="light" color="blue" fullWidth mt="md" radius="md">
            View
          </Button>
        </Card>
      </Link>
    </div>
  )
}

// const AuthShowcase: React.FC = () => {
//   const { data: sessionData } = useSession();

//   const { data: secretMessage } = api.example.getSecretMessage.useQuery(
//     undefined, // no input
//     { enabled: sessionData?.user !== undefined },
//   );

//   return (
//     <div className="flex flex-col items-center justify-center gap-4">
//       <p className="text-center text-2xl text-white">
//         {sessionData && <span>Logged in as {sessionData.user?.name}</span>}
//         {secretMessage && <span> - {secretMessage}</span>}
//       </p>
//       <button
//         className="rounded-full bg-white/10 px-10 py-3 font-semibold text-white no-underline transition hover:bg-white/20"
//         onClick={sessionData ? () => void signOut() : () => void signIn()}
//       >
//         {sessionData ? "Sign out" : "Sign in"}
//       </button>
//     </div>
//   );
// };
