import { type NextPage } from 'next'
import Head from 'next/head'
import { env } from '~/env.mjs'
import dynamic from 'next/dynamic';

import {
  // Textarea,
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
import { api } from '~/utils/api'

import React, { useState, useEffect } from 'react';
import axios, { AxiosResponse } from 'axios';
import { createClient } from '@supabase/supabase-js'
import { GetServerSideProps, GetServerSidePropsContext } from 'next'

// trying to do supabase connection on edge function.
export const config = {
    runtime: 'experimental-edge', // this is a pre-requisite
  };
  
  
// TRY TO UPLOAD TO S3
import { S3Client, PutObjectCommand, PutObjectRequest, PutObjectCommandInput } from '@aws-sdk/client-s3';

const aws_config = {
  bucketName: process.env.S3_BUCKET_NAME,
  region: 'us-east-1',
  accessKeyId: process.env.AWS_KEY,
  secretAccessKey: process.env.AWS_SECRET,
};
console.log("bucket name ---------------", process.env.S3_BUCKET_NAME)

const s3Client = new S3Client({
  region: aws_config.region,
    credentials: {
      accessKeyId: process.env.AWS_KEY as string,
      secretAccessKey: process.env.AWS_SECRET as string,
    },
});

// run on server side
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { params } = context;
  if (!params) {
    return {
      course_data: null,
      course_name: null,
    }
  }
  console.log("params ----------------------", params)
  const course_name = params['dynamic_course']

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET)
  async function checkCourseExists() {
    const { data } = await supabase
      .from('courses')
      .select('*')
      .eq('name', course_name)
      .single()

    if (!data) {
      console.log('Course not found ☹️')
    } else {
      console.log('Course found 😍')
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

  console.log("PROPS IN COURSE_MAIN", props)
  const course_name = props.course_name

  // MAKE A NEW COURSE PAGE
  if (props.course_data == null) {
    return (
      <>
      <Head>
        <title>{GetCurrentPageName()}</title>
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
            Course does not exist, <span className="text-[hsl(280,100%,70%)]">&nbsp;yet!</span>
          </h2>
        <Title order={2}></Title>
        <Flex direction="column" align="center" justify="center">
          <Title style={{color: 'White'}} order={3} p="md">To create course, simply upload your course materials and on will be created for you!</Title>
          <Title style={{color: 'White'}} order={3} variant='normal'>The course will be named:</Title> 
          <Title style={{color: 'White'}} order={2} p="md" variant="gradient" weight="bold" gradient={{ from: 'gold', to: 'white', deg: 140 }}>{props.course_name}</Title>
          <DropzoneS3Upload course_name={props.course_name} />
        </Flex>
        </div>
      </main>
      </>
      )
  }

  // COURSE PAGE
  return (
    <>
      <Head>
        <title>{GetCurrentPageName()}</title>
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
            UIUC <span className="text-[hsl(280,100%,70%)]">{GetCurrentPageName()}</span>
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
              <DropzoneS3Upload course_name={course_name} />
            </div>
          </Flex>

          <Title order={2}>Week 1: Finite State Machines</Title>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
            <DropzoneS3Upload course_name={course_name} />
          </div>
          <Title order={2}>Week 2: Circuit Diagrams</Title>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
            <DropzoneS3Upload course_name={course_name} />
          </div>
          <Title order={2}>Week 3: LC-3 ISA</Title>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
            <DropzoneS3Upload course_name={course_name} />
          </div>

          <TextInput
            placeholder="Add another content section here! (testing different ways of making the titles editable by the professors)"
            variant="unstyled"
            size="xl"
            withAsterisk
          />
        </Container>

        {/* <BuildContextCards /> */}
      </main>
    </>
  )
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
  Checkbox
} from '@mantine/core'
import { IconSearch, IconArrowRight, IconArrowLeft, IconExternalLink, IconCloudUpload, IconX, IconDownload } from '@tabler/icons-react'
import { useListState, randomId } from '@mantine/hooks'
import { useRef } from 'react'
import { Dropzone, MIME_TYPES } from '@mantine/dropzone'
import Link from 'next/link'
import { useRouter } from 'next/router';
import { UploadDropzone } from '@uploadthing/react'
import { Interface } from 'readline';


/// START OF COMPONENTS
export const GetCurrentPageName = () => {
  const router = useRouter();
  return router.asPath.slice(1,);
}

interface getTopContextsResponse {
  id: number;
  source_name: string;
  source_location: string;
  text: string;
}

interface contextsResponse {
  contexts: getTopContextsResponse[];
}


export const BuildContextCards = () => {
  // const [contexts, setContexts] = useState([]);
  const [contexts, setContexts] = useState<getTopContextsResponse[]>([]);

  useEffect(() => {
    axios.defaults.baseURL = 'https://flask-production-751b.up.railway.app';

    axios
      .get('/getTopContexts', {
        params: {
          course_name: GetCurrentPageName(),
        },
      })
      .then((response: AxiosResponse<contextsResponse>) => {
        setContexts(response.data.contexts);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  return (
    <>
      {contexts.map((context: getTopContextsResponse) => (
        <DynamicMaterialsCard
          key={context.id}
          sourceName={context.source_name}
          sourceLocation={context.source_location}
          text={context.text}
        />
      ))}
    </>
  );
};

interface DynamicMaterialsCardProps {
  sourceName: string;
  sourceLocation: string;
  text: string;
}

function DynamicMaterialsCard({ sourceName, sourceLocation, text }: DynamicMaterialsCardProps) {
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
            {sourceName}
          </Text>
        </Group>

        <Text
          size="sm"
          variant="gradient"
          weight={600}
          gradient={{ from: 'yellow', to: 'green', deg: 0 }}
        >
          AI summary
        </Text>
        <Text className="fade" size="md" color="dimmed">
          {text}
        </Text>

        <Link href={"https://kastanday.com"} rel="noopener noreferrer" target="_blank">
          <Group >
            <IconExternalLink 
              size={20}
              strokeWidth={2}
              color={'white'}
            />
            <Text
              size="xs"
              variant="dimmed"
              weight={4300}
              // gradient={{ from: 'yellow', to: 'green', deg: 0 }}
            >
              Source {sourceLocation}
            </Text>
          </Group>
        </Link>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button size="xs" variant="dimmed" pb="0">
            Show full paragraph
          </Button>
        </div>
      </Card>
    </div>
  );
}


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

export function DropzoneS3Upload ( {course_name}: {course_name: string} ) {
  const { classes, theme } = useStyles()
  const openRef = useRef<() => void>(null)

  const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  };

  const handleUpload = async (file: File) => {
    try {
      const fileArrayBuffer: ArrayBuffer = await readFileAsArrayBuffer(file);
      const fileUint8Array = new Uint8Array(fileArrayBuffer);
      const s3_filepath = "courses/" + course_name + "/" + file.name; // todo: add course name
      const uploadParams : PutObjectCommandInput = {
        Bucket: aws_config.bucketName,
        Key: s3_filepath,
        Body: fileUint8Array,
      };
      const command = new PutObjectCommand(uploadParams);
      const response = await s3Client.send(command);
      console.log('File uploaded successfully:', response);
      
      // TODO: make entry in supabase
      axios.defaults.baseURL = 'https://flask-production-751b.up.railway.app';
      axios.post('/createCourse', {
        params: {
          course_name: course_name,
          file_name: file.name,
          file_path: s3_filepath,
          file_type: file.type,
          file_size: file.size,
        }
      })
      .then(function (response) {
        console.log(response);
      })
      .catch(function (error) {
        console.log(error);
      })
      .finally(function () {
        // always executed
      });

    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  return (
    <div className={classes.wrapper} style={{ maxWidth: '220px' }}>
      <Dropzone
        openRef={openRef}
        onDrop={(files) => {
          // UPLOAD TO S3
          files.forEach((file) => {
          void (async () => {
            await handleUpload(file).catch((error) => {
              console.error('Error during file upload:', error);
            });
          })();
        });

          console.log("Got your upload! And saved it!")
          console.log(files)
        }}
        className={classes.dropzone}
        radius="md"
        accept={[
          MIME_TYPES.pdf,
          MIME_TYPES.mp4,
          MIME_TYPES.docx,
          MIME_TYPES.xlsx,
          MIME_TYPES.pptx,
          MIME_TYPES.ppt,
          MIME_TYPES.doc,
        ]}
        bg="#0E1116"
        // maxSize={30 * 1024 ** 2} max file size
      >
        <div style={{ pointerEvents: 'none' }}>
          <Group position="center">
            <Dropzone.Accept>
              <IconDownload
                size={rem(50)}
                color={theme.primaryColor[6]}
                stroke={1.5}
              />
            </Dropzone.Accept>
            <Dropzone.Reject>
              <IconX size={rem(50)} color={theme.colors.red[6]} stroke={1.5} />
            </Dropzone.Reject>
            <Dropzone.Idle>
              <IconCloudUpload
                size={rem(50)}
                color={
                  theme.colorScheme === 'dark'
                    ? theme.colors.dark[0]
                    : theme.black
                }
                stroke={1.5}
              />
            </Dropzone.Idle>
          </Group>

          <Text ta="center" fw={700} fz="lg" mt="xl">
            <Dropzone.Accept>Drop files here</Dropzone.Accept>
            <Dropzone.Reject>
              Upload rejected, not proper file type or too large.
            </Dropzone.Reject>
            <Dropzone.Idle>Upload materials</Dropzone.Idle>
          </Text>
          <Text ta="center" fz="sm" mt="xs" c="dimmed">
            Drag&apos;n&apos;drop files here to upload.<br></br>We support PDF,
            MP4, DOCX, XLSX, PPTX, PPT, DOC.
          </Text>
        </div>
      </Dropzone>
    </div>
  )
}

function oneWeek() {
  return (
    <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
      hello
    </h1>
  )
}

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

function FileUpload() {
  return (
    <FileInput
      style={{ backgroundColor: '#0E1116' }}
      multiple
      label="Upload your documents"
      placeholder="textbook.pdf  /   notes.docx  /  lecture.mp4"
      icon={<IconUpload size={rem(14)} />}
    />
  )
}
