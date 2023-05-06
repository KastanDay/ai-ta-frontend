import { type NextPage } from "next";
import Head from "next/head";

import { Card, Image, Text, Title, Badge, MantineProvider, Button, Group } from '@mantine/core';

import { FileInput, rem } from '@mantine/core';
import { IconUpload } from '@tabler/icons-react';

import { createStyles } from '@mantine/core';

import { api } from "~/utils/api";


const CourseMain: NextPage = () => {
  // const hello = api.example.hello.useQuery({ text: "from tRPC" });

  return (
    <>
      <Head>
        <title>UIUC Course AI</title>
        <meta name="description" content="The AI teaching assistant built for students at UIUC." />
        <link rel="icon" href="/favicon.ico" />
        {/* <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Lora"/>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Montserrat"/>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Audiowide"/> */}
      </Head>

      <main className="flex min-h-screen flex-col items-left justify-left; course-page-main">

        
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
          <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
            UIUC Course <span className="text-[hsl(280,100%,70%)]">AI</span>
          </h1>
        </div>
        <div className="container flex flex-col items-left justify-center gap-12 px-20 py-16 ">
          <h2 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
            ECE <span className="text-[hsl(280,100%,70%)]">120</span>
          </h2>
        <Text style={{fontFamily: 'Lora'}} size="md" color="white">
          Taught by <Text style={{display: "inline"}} color="skyblue">Prof. Volodymyr (Vlad) Kindratenko</Text>, Director of the Center for Artificial Intelligence Innovation at NCSA, in <Text style={{display: "inline"}} color="skyblue">Spring 2022</Text>.
        </Text>
        {/* <FileUpload /> */}
      
        {/* QA goes here */}
        <Container size="100rem" px="md" py="md">
          <InputWithButton pb="md"/>
          <ChatSettings />
        </Container>

        {/* MAIN WEEKLY CONTENT */}
        <Title order={1}>Course Overview</Title>
        <div className="flex-container">
          <div className="item"><MaterialsCard /></div>
          <div className="item"><MaterialsCard /></div>
          <div className="item"><MaterialsCard /></div>
          <div className="item-wide"><DropzoneButton /></div>
        </div>

        <Title order={1}>Week 1: Finite State Machines</Title>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
          <DropzoneButton />
        </div>
        <Title order={1}>Week 2: Circuit Diagrams</Title>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
          <DropzoneButton />
        </div>
        <Title order={1}>Week 3: LC-3 ISA</Title>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
          <DropzoneButton />
        </div>



        {/* <Text variant="gradient" size="xl" >ECE 120</Text>
        <Text STYLE="font-family: 'Audiowide'" variant="gradient" gradient={{ from: 'indigo', to: 'cyan', deg: 45 }} size="xl" weight="800">ECE 120</Text>
        <Text STYLE="font-family: 'Lora'" ta="left" variant="gradient" size="xl" weight="800">ECE 120</Text>
        <Text STYLE="font-family: 'Montserrat'" ta="left" variant="gradient" size="xl" weight="800">ECE 120</Text>
        <Text STYLE="font-family: 'Montserrat'" ta="left" size="xl" weight="800">ECE 120</Text>
        <Title order={1}>ECE 120</Title>
        <Title align="left" order={2}>ECE 120</Title> */}
        </div>
      </main>
    </>
  );
};

{/* <DndListHandle data={"position": 1, "mass": 2, "symbol": "string", "name": "string"}/> */}
export default CourseMain;

import { Switch, Flex, Container, TextInput, TextInputProps, ActionIcon, useMantineTheme } from '@mantine/core';
import { IconSearch, IconArrowRight, IconArrowLeft } from '@tabler/icons-react';

function ChatSettings() {
  return (
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
      <UseGPT4Switch />
    </Flex>
  );
}

function PublicChatSwitch() {
  return (
    <Switch
      label="Share chat publicly"
      description="Chat history appears on your profile"
    />
  );
}

function UseGPT4Switch() {
  return (
    <Switch
      label="Use GPT-4 (instead of 3.5)"
      description="Best for extremely long contexts "
    />
  );
}

export function InputWithButton(props: TextInputProps) {
  const theme = useMantineTheme();

  return (
    <TextInput
      icon={<IconSearch size="1.1rem" stroke={1.5} />}
      radius="xl"
      size="md"
      rightSection={
        <ActionIcon size={32} radius="xl" color={theme.primaryColor} variant="filled">
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
  );
}

import { useRef } from 'react';
import { Dropzone, MIME_TYPES } from '@mantine/dropzone';
import { IconCloudUpload, IconX, IconDownload } from '@tabler/icons-react';

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
    color: theme.colorScheme === 'dark' ? theme.colors.dark[3] : theme.colors.gray[4],
  },

  control: {
    position: 'absolute',
    width: rem(250),
    left: `calc(50% - ${rem(125)})`,
    bottom: rem(-20),
  },
}));

export function DropzoneButton() {
  const { classes, theme } = useStyles();
  const openRef = useRef<() => void>(null);

  return (
    <div className={classes.wrapper} style={{ maxWidth: '50%'}}>
      <Dropzone
        openRef={openRef}
        onDrop={() => {console.log("Got your upload! But still haven't saved it.")}}
        className={classes.dropzone}
        radius="md"
        accept={[MIME_TYPES.pdf, MIME_TYPES.mp4, MIME_TYPES.docx, MIME_TYPES.xlsx, MIME_TYPES.pptx, MIME_TYPES.ppt, MIME_TYPES.doc, ]}
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
                color={theme.colorScheme === 'dark' ? theme.colors.dark[0] : theme.black}
                stroke={1.5}
              />
            </Dropzone.Idle>
          </Group>

          <Text ta="center" fw={700} fz="lg" mt="xl">
            <Dropzone.Accept>Drop files here</Dropzone.Accept>
            <Dropzone.Reject>Upload rejected, not proper file type or too large.</Dropzone.Reject>
            <Dropzone.Idle>Upload materials</Dropzone.Idle>
          </Text>
          <Text ta="center" fz="sm" mt="xs" c="dimmed">
            Drag&apos;n&apos;drop files here to upload. <br></br>We support PDF, MP4, DOCX, XLSX, PPTX, PPT, DOC.
          </Text>
        </div>
      </Dropzone>

      {/* <Button className={classes.control} size="md" radius="xl" onClick={() => openRef.current?.()}>
        Select files
      </Button> */}
    </div>
  );
}


function oneWeek() {
  return (
    <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">hello</h1>
  );
  }

function MaterialsCard() {
  return (
    <div className="box-sizing: border-box; border: 100px solid #ccc;">
    <Card style={{maxWidth: "100%"}} shadow="sm" padding="lg" radius="md" withBorder>
      <Card.Section>
        <Image
          src="https://images.unsplash.com/photo-1527004013197-933c4bb611b3?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=720&q=80"
          height={160}
          alt="Norway"
        />
      </Card.Section>

      <Group position="apart" mt="md" mb="xs">
        <Text style={{fontFamily: 'Montserrat'}} size="xl" weight={800}>Finite Satem Machine Readings</Text>
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
  );
}

function FileUpload() {
  return <FileInput multiple label="Upload your documents" placeholder="textbook.pdf  /   notes.docx  /  lecture.mp4" icon={<IconUpload size={rem(14)} />} />;
}
