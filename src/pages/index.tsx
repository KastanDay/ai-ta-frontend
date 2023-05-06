import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";

import { Card, Image, Text, Title, Badge, MantineProvider, Button, Group } from '@mantine/core';

import { FileInput, rem } from '@mantine/core';
import { IconUpload } from '@tabler/icons-react';




import { api } from "~/utils/api";

const Home: NextPage = () => {
  const hello = api.example.hello.useQuery({ text: "from tRPC" });

  return (
    <>
      <Head>
        <title>UIUC Course AI</title>
        <meta name="description" content="The AI teaching assistant built for students at UIUC." />
        <link rel="icon" href="/favicon.ico" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Lora"/>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Montserrat"/>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Audiowide"/>

      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
          <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
            UIUC Course <span className="text-[hsl(280,100%,70%)]">AI</span>
          </h1>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
            <Link
              className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 text-white hover:bg-white/20"
              href="https://create.t3.gg/en/usage/first-steps"
              target="_blank"
            >
              <h3 className="text-2xl font-bold">First Steps →</h3>
              <div className="text-lg">
                Just the basics - Everything you need to know to set up your
                database and authentication.
              </div>
            </Link>
            <Link
              className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 text-white hover:bg-white/20"
              href="https://create.t3.gg/en/introduction"
              target="_blank"
            >
              <h3 className="text-2xl font-bold">Documentation →</h3>
              <div className="text-lg">
                Learn more about Create T3 App, the libraries it uses, and how
                to deploy it.
              </div>
            </Link>
          </div>
          <div className="flex flex-col items-center gap-2">
            <p className="text-2xl text-white">
              {hello.data ? hello.data.greeting : "Loading tRPC query..."}
            </p>
            <AuthShowcase />
            {/* <Demo /> */}
          {/* <FileUpload /> */}
          <CourseCard />
          <CourseCard />
          
          <Text variant="gradient" size="xl" >ECE 120</Text>
          <Text STYLE="font-family: 'Audiowide'" variant="gradient" gradient={{ from: 'indigo', to: 'cyan', deg: 45 }} size="xl" weight="800">ECE 120</Text>



          </div>
        </div>

        {/* <Text STYLE="font-family: 'Lora'" ta="left" variant="gradient" size="xl" weight="800">ECE 120</Text>
        <Text STYLE="font-family: 'Montserrat'" ta="left" variant="gradient" size="xl" weight="800">ECE 120</Text>
        <Text STYLE="font-family: 'Montserrat'" ta="left" size="xl" weight="800">ECE 120</Text>
        <Title order={1}>ECE 120</Title>
        <Title align="left" order={2}>ECE 120</Title> */}

      </main>
    </>
  );
};

export default Home;

// TODO: USE BETTER CARDS! https://ui.mantine.dev/category/article-cards
function CourseCard() {
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
        <Text STYLE="font-family: 'Montserrat'" size="xl" weight={800}>ECE 120</Text>
        <Badge size="xl" color="pink" variant="light">
          ECE
        </Badge>
      </Group>

      <Text size="sm" color="dimmed">
        Taught by <Text STYLE="display: inline" color="blue">Prof. Volodymyr (Vlad) Kindratenko</Text>, Director of the Center for Artificial Intelligence Innovation at NCSA, in <Text STYLE="display: inline" color="blue">Spring 2022</Text>.
      </Text>

      <Button variant="light" color="blue" fullWidth mt="md" radius="md">
        View
      </Button>
    </Card>
    </div>
  );
}

function Demo() {
  return <Button size="xl">Click me!</Button>;
}

function FileUpload() {
  return <FileInput multiple label="Upload your documents" placeholder="textbook.pdf  /   notes.docx  /  lecture.mp4" icon={<IconUpload size={rem(14)} />} />;
}


const AuthShowcase: React.FC = () => {
  const { data: sessionData } = useSession();

  const { data: secretMessage } = api.example.getSecretMessage.useQuery(
    undefined, // no input
    { enabled: sessionData?.user !== undefined },
  );

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <p className="text-center text-2xl text-white">
        {sessionData && <span>Logged in as {sessionData.user?.name}</span>}
        {secretMessage && <span> - {secretMessage}</span>}
      </p>
      <button
        className="rounded-full bg-white/10 px-10 py-3 font-semibold text-white no-underline transition hover:bg-white/20"
        onClick={sessionData ? () => void signOut() : () => void signIn()}
      >
        {sessionData ? "Sign out" : "Sign in"}
      </button>
    </div>
  );
};
