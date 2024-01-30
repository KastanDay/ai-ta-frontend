import { useState, useEffect } from 'react'
import { CourseMetadata } from '~/types/courseMetadata'
import router, { useRouter } from "next/router";
import { DEFAULT_SYSTEM_PROMPT } from '~/utils/app/const';
import { callSetCourseMetadata } from '~/utils/apiUtils';
import { extractEmailsFromClerk } from '~/components/UIUC-Components/clerkHelpers';
import { useUser } from '@clerk/nextjs';
import { Button, Text, Textarea, Title, createStyles } from '@mantine/core';
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import { Montserrat } from 'next/font/google';
import ChatNavbar from '~/components/UIUC-Components/navbars/ChatNavbar';

const montserrat_light = Montserrat({
  weight: '400',
  subsets: ['latin'],
})

const useStyles = createStyles((theme) => ({

  button: {
    backgroundColor: 'white',
    color: 'black',
    border: '2px solid purple',
    '&:hover': {
      backgroundColor: 'purple',
      color: 'white',
    },
  },
}))

interface SettingsProps {
  t: (key: string) => string
}




const Settings = ({ t }: SettingsProps) => {
  const router = useRouter();
  const getCurrentCourseName = () => {
    return router.asPath.split('/')[1];
  }
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [courseMetadata, setCourseMetadata] = useState<CourseMetadata | null>(null);
  const clerk_user = useUser()
  const emails = extractEmailsFromClerk(clerk_user.user)
  const currUserEmail = emails[0]

  const fetchCourseMetadata = async () => {
    const courseName = getCurrentCourseName();

    if (!courseName) {
      throw new Error('Course name is undefined');
    }
    const response = await fetch(`/api/UIUC-api/getAllCourseMetadata?currUserEmail=${currUserEmail}`);
    const allMetadata = await response.json();
    console.log(allMetadata);
    const metadataObj = allMetadata?.find((meta: { [key: string]: CourseMetadata }) => Object.keys(meta)[0] === courseName) || null;
    const metadata = metadataObj ? Object.values(metadataObj)[0] as CourseMetadata : null;
    setCourseMetadata(metadata);
    if (metadata) {
      setSystemPrompt(metadata.system_prompt || DEFAULT_SYSTEM_PROMPT);
    }
  }

  useEffect(() => {
    fetchCourseMetadata();
  }, []);

  const handleSystemPromptSubmit = async () => {
    const courseName = getCurrentCourseName();
    if (courseMetadata && courseName) {
      courseMetadata.system_prompt = systemPrompt;
      const success = await callSetCourseMetadata(courseName, courseMetadata);
      if (!success) {
        console.log('Error updating course metadata');
      }
    }
  }

  const { classes } = useStyles()

  return (
    <>
      <div className="justify-center" style={{ height: '46px' }}>
        {/* <ChatNavbar isgpt4={true} /> */}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ width: '60%' }}>
          <div className="form-control relative">
            <Title
              className={`label ${montserrat_heading.variable} p-0 pl-1 pt-2 font-montserratHeading`}
              variant="gradient"
              gradient={{ from: 'gold', to: 'white', deg: 170 }}
              order={3}
            >
              System Prompt{' '}
            </Title>
            <Text
              className={`label ${montserrat_light.className} pt-0`}
              size={'sm'}
            >
              Customize the system prompt for your project: {getCurrentCourseName()}
            </Text>
            <Textarea
              autosize
              minRows={2}
              maxRows={4}
              placeholder="Enter a system prompt"
              className={`w-full ${montserrat_paragraph.variable} font-montserratParagraph`}
              value={systemPrompt}
              onChange={(e) => {
                setSystemPrompt(e.target.value)
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-start', paddingTop: '10px' }}>

              <Button
                className="relative m-1 w-[30%] self-end bg-purple-800 text-white hover:border-indigo-600 hover:bg-indigo-600"
                type="submit"
                onClick={handleSystemPromptSubmit}
              >
                Update System Prompt
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Settings;
