import { type NextPage } from 'next'
import Head from 'next/head'

import {
  Textarea,
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
  rem,
} from '@mantine/core'
import { IconUpload } from '@tabler/icons-react'
import { env } from '~/env.mjs'
import { api } from '~/utils/api'
import { DropzoneS3Upload } from '~/components/Upload_S3'
import { createClient } from '@supabase/supabase-js'
import axios from 'axios';
import { GetServerSideProps, GetServerSidePropsContext } from 'next'

// run on server side
// export async function getServerSideProps(context: GetServerSidePropsContext) {
//   const { params } = context;
//   if (!params) {
//     return {
//       course_data: null,
//       course_name: null,
//     }
//   }
//   console.log("params ----------------------", params)
//   const course_name = params['dynamic_course']

//   const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET)
//   async function checkCourseExists() {
//     const { data } = await supabase
//       .from('courses')
//       .select('*')
//       .eq('name', course_name)
//       .single()

//     if (!data) {
//       console.log('Course not found ☹️')
//     } else {
//       console.log('Course found 😍')
//     }
//     return data
//   }

//   const course_data = await checkCourseExists()
//   console.log("course_data")
//   console.log(course_data)
//   return {
//     props: {
//       course_data,
//       course_name,
//     },
//   }
// }

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { params } = context;
  if (!params) {
    return {
      props: {
        course_data: null,
        course_name: null,
      },
    }
  }
  console.log("params ----------------------", params)
  const course_name = 'ece120'

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET)
  async function checkCourseExists() {
    const { data } = await supabase
      .from('courses')
      .select('*')
      .eq('name', course_name)
      .single()

    if (!data) {
      console.log('Course not found :/')
    } else {
      console.log('Course found !!!')
    }
    return data
  }

  const course_data = await checkCourseExists()
  console.log("course_data")
  console.log(course_data)
  return {
    props: {
      course_data,
      course_name,
    },
  }
}


interface CourseMainProps {
  course_data: any,
  course_name: string,
}

// run on client side
const CourseMain: NextPage<CourseMainProps> = (props) => {
  // const hello = api.example.hello.useQuery({ text: "from tRPC" });


  axios.get('https://flask-production-751b.up.railway.app/getContexts?language=penis')
    .then(response => {
      // Handle the response data
      console.log("HERE IS OUR RESPONSE!");
      console.log(response.data);
    })
    .catch(error => {
      // Handle any errors
      console.error(error);
    });


  return (
    <>
      <Head>
        <title>ECE 120 Course AI</title>
        <meta
          name="description"
          content="The AI teaching assistant built for students at UIUC."
        />
        <link rel="icon" href="/favicon.ico" />
        {/* <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Lora"/>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Montserrat"/>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Audiowide"/> */}
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
            ECE <span className="text-[hsl(280,100%,70%)]">120</span>
          </h2>
          <Text style={{ fontFamily: 'Montserrat' }} size="md" color="white">
            Taught by{' '}
            <Text style={{ display: 'inline' }} color="skyblue">
              Prof. Volodymyr (Vlad) Kindratenko
            </Text>
            , Director of the Center for Artificial Intelligence Innovation at
            NCSA, in{' '}
            <Text style={{ display: 'inline' }} color="skyblue">
              Spring 2022
            </Text>
            .
          </Text>
        </div>

        {/* CHATBOT CONTAINER */}
        {/* style={{border: '1px solid white', borderRadius: '10px'}} */}
        <Container size="xl" px="md" py="md">
          <AShortChat />
          <InputWithButton pb="md" />
          <ChatSettings />
        </Container>

        {/* MAIN WEEKLY CONTENT */}
        <Container size="xl" px="md" py="md">
          <Title order={2}>Course Overview</Title>
          <Flex
            mih={50}
            // bg="rgba(0, 0, 0, .3)"
            justify="flex-start"
            align="flex-start"
            direction="row"
            wrap="wrap"
          >
            <div className="item">
              <MaterialsCard />
            </div>
            <div className="item">
              <MaterialsCard />
            </div>
            <div className="item">
              <MaterialsCard />
            </div>
            <div className="item-wide">
              <DropzoneS3Upload course_name={props.course_name}  />
            </div>
          </Flex>

          <Title order={2}>Week 1: Finite State Machines</Title>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
            <DropzoneS3Upload course_name={props.course_name}  />
          </div>
          <Title order={2}>Week 2: Circuit Diagrams</Title>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
            <DropzoneS3Upload course_name={props.course_name}  />
          </div>
          <Title order={2}>Week 3: LC-3 ISA</Title>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
            <DropzoneS3Upload course_name={props.course_name}  />
          </div>

          <TextInput
            placeholder="Add another content section here! (testing different ways of making the titles editable by the professors)"
            variant="unstyled"
            size="xl"
            withAsterisk
          />
        </Container>

        {/* <Text variant="gradient" size="xl" >ECE 120</Text>
        <Text STYLE="font-family: 'Audiowide'" variant="gradient" gradient={{ from: 'indigo', to: 'cyan', deg: 45 }} size="xl" weight="800">ECE 120</Text>
        <Text STYLE="font-family: 'Lora'" ta="left" variant="gradient" size="xl" weight="800">ECE 120</Text>
        <Text STYLE="font-family: 'Montserrat'" ta="left" variant="gradient" size="xl" weight="800">ECE 120</Text>
        <Text STYLE="font-family: 'Montserrat'" ta="left" size="xl" weight="800">ECE 120</Text>
        <Title order={2}>ECE 120</Title>
        <Title align="left" order={2}>ECE 120</Title> */}
      </main>
    </>
  )
}

{
  /* <DndListHandle data={"position": 1, "mass": 2, "symbol": "string", "name": "string"}/> */
}
export default CourseMain

import {
  Switch,
  Flex,
  Container,
  TextInput,
  TextInputProps,
  ActionIcon,
  useMantineTheme,
} from '@mantine/core'
import { IconSearch, IconArrowRight, IconArrowLeft } from '@tabler/icons-react'
import { useListState, randomId } from '@mantine/hooks'
import { Checkbox } from '@mantine/core'

const initialValues = [
  { label: 'Week 1: Finite State Machines', checked: true, key: randomId() },
  { label: 'Week 2: Circuit Diagrams', checked: true, key: randomId() },
  { label: 'Week 3: LC-3 ISA', checked: true, key: randomId() },
]

export function IndeterminateCheckbox() {
  const [values, handlers] = useListState(initialValues)

  const allChecked = values.every((value) => value.checked)
  const indeterminate = values.some((value) => value.checked) && !allChecked

  const items = values.map((value, index) => (
    <Checkbox
      mt="xs"
      ml={33}
      color="cyan"
      label={value.label}
      key={value.key}
      checked={value.checked}
      onChange={(event) =>
        handlers.setItemProp(index, 'checked', event.currentTarget.checked)
      }
    />
  ))

  return (
    <>
      <Text
        size="lg"
        pb=".2rem"
        weight={700}
        variant="gradient"
        gradient={{ from: 'cyan', to: 'indigo', deg: 0 }}
      >
        Optionally refine your search space
      </Text>
      <Checkbox
        checked={allChecked}
        indeterminate={indeterminate}
        label="Include content from all weeks"
        color="cyan"
        transitionDuration={0}
        onChange={() =>
          handlers.setState((current) =>
            current.map((value) => ({ ...value, checked: !allChecked })),
          )
        }
      />
      {items}
    </>
  )
}

function ChatSettings() {
  return (
    <div>
      <Flex
        mih={50}
        // bg="rgba(0, 0, 0, .3)"
        gap="sm"
        justify="flex-start"
        align="flex-start"
        direction="row"
        wrap="wrap"
      >
        <PublicChatSwitch />
        <GPT4Switch />
      </Flex>
      <IndeterminateCheckbox />
    </div>
  )
}

function AShortChat() {
  return (
    <Container size="lg" px="md" py="md">
      <div className="chat chat-end">
        <div className="chat-image avatar">
          <div className="w-10 rounded-full">
            <img src="https://daisyui.com/images/stock/photo-1534528741775-53994a69daeb.jpg" />
          </div>
        </div>
        <div className="chat-header">
          Anakin
          <time className="text-xs opacity-50"> 12:46</time>
        </div>
        <div className="chat-bubble">What is a Finite State machine?</div>
        <div className="chat-footer opacity-50">Seen at 12:46</div>
      </div>

      <div className="chat chat-start">
        <div className="chat-image avatar">
          <div className="w-10 rounded-full">
            <img
              className="mask mask-hexagon-2"
              src="https://daisyui.com/images/stock/photo-1534528741775-53994a69daeb.jpg"
            />
          </div>
        </div>
        <div className="chat-header">
          Obi-Wan Kenobi
          <time className="text-xs opacity-50">12:46</time>
        </div>
        <div className="chat-bubble to-blue-600">
          A Finite State Machine (FSM) is a mathematical model used to represent
          and analyze systems that can be in a finite number of states and can
          transition between these states in response to external inputs. It is
          also known as a Finite Automaton or a State Transition System.
        </div>
        <div className="chat-footer to-blue-600 opacity-50 ">Delivered</div>
      </div>
      <Text size="lg" weight={800} p={6}>
        From the course
      </Text>
      <Group variant="row" spacing="xs">
        {/* <MaterialsCard /> */}
        {/* <MaterialsCard /> */}
        <MaterialsCardSmall />
        <MaterialsCardSmall />
      </Group>

      <div className="chat chat-end">
        <div className="chat-image avatar">
          <div className="w-10 rounded-full">
            <img src="https://daisyui.com/images/stock/photo-1534528741775-53994a69daeb.jpg" />
          </div>
        </div>
        <div className="chat-header">
          Anakin
          <time className="text-xs opacity-50"> 12:47</time>
        </div>
        <div className="chat-bubble">Why are they useful??</div>
        <div className="chat-footer opacity-50">Seen at 12:47</div>
      </div>

    </Container>
  )
}

function PublicChatSwitch() {
  return (
    <Switch
      label="Share chat publicly"
      description="Chat history appears on your profile"
      color="cyan"
    />
  )
}
function GPT4Switch() {
  return (
    <Switch
      label="Use GPT-4 (instead of 3.5)"
      description="Best for extremely long contexts "
      color="cyan"
    />
  )
}

export function InputWithButton(props: TextInputProps) {
  const theme = useMantineTheme()

  return (
    <TextInput
      icon={<IconSearch size="1.1rem" stroke={1.5} />}
      radius="xl"
      size="md"
      rightSection={
        <ActionIcon
          size={32}
          radius="xl"
          color={theme.primaryColor}
          variant="filled"
        >
          {theme.dir === 'ltr' ? (
            <IconArrowRight size="1.1rem" stroke={1.5} />
          ) : (
            <IconArrowLeft size="1.1rem" stroke={1.5} />
          )}
        </ActionIcon>
      }
      placeholder="Search questions"
      rightSectionWidth={42}
      {...props}
    />
  )
}

import { useRef } from 'react'
import { Dropzone, MIME_TYPES } from '@mantine/dropzone'
import { IconCloudUpload, IconX, IconDownload } from '@tabler/icons-react'
import Link from 'next/link'

const useStyles = createStyles((theme) => ({
  wrapper: {
    position: 'relative',
    marginBottom: rem(20),
  },

  dropzone: {
    borderWidth: rem(1),
    paddingBottom: rem(20),
  },

  icon: {
    color:
      theme.colorScheme === 'dark'
        ? theme.colors.dark[3]
        : theme.colors.gray[4],
  },

  control: {
    position: 'absolute',
    width: rem(250),
    left: `calc(50% - ${rem(125)})`,
    bottom: rem(-20),
  },
}))

function MaterialsCard() {
  return (
    <div className="box-sizing: border-box; border: 100px solid #ccc;">
      <Card
        bg="#0E1116"
        style={{ maxWidth: '100%' }}
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
            Finite State Machine Readings
          </Text>
          <Badge size="xl" color="pink" variant="light">
            ECE
          </Badge>
        </Group>

        <Text size="sm" color="dimmed">
          Crucial for any learning endeavour.
        </Text>

        <Button variant="light" color="blue" fullWidth mt="md" radius="md">
          View
        </Button>
      </Card>
    </div>
  )
}

// In the chat box
function MaterialsCardSmall() {
  return (
    <div className="box-sizing: border-box; border: 100px solid #ccc;">
      <Card
        bg="#0E1116"
        style={{ maxWidth: '20rem' }}
        shadow="sm"
        padding="md"
        radius="md"
        withBorder
      >
        <Card.Section>
          <Image
            src="https://images.unsplash.com/photo-1527004013197-933c4bb611b3?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=720&q=80"
            height={'7rem'}
            alt="Norway"
          />
        </Card.Section>

        <Group position="apart" mt="md" mb="xs">
          <Text style={{ fontFamily: 'Montserrat' }} size="xl" weight={800}>
            Finite State Machine Readings
          </Text>
          {/* <Badge size="xl" color="pink" variant="light">
          ECE
        </Badge> */}
        </Group>

        <Text
          size="sm"
          variant="gradient"
          weight={600}
          gradient={{ from: 'yellow', to: 'green', deg: 0 }}
        >
          AI summary
        </Text>
        {/* style={{'font-family': 'Lora'}} */}
        <Text className="fade" size="md" color="dimmed">
          In a FSM, each state represents a specific condition or mode that the
          system can be in, and each transition represents a change of state
          triggered by a specific input or event. The FSM can be defined by a
          set of states, a set of input symbols or events, a set of output
          symbols or actions, and a transition function that maps each state and
          input to a next state and output.
        </Text>
        {/* <Button size="xs" variant="dimmed">Show full paragraph</Button> */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button size="xs" variant="dimmed" pb="0">
            Show full paragraph
          </Button>
        </div>
      </Card>
    </div>
  )
}
