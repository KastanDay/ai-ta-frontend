import { useState, useEffect } from 'react'
import { CourseMetadata } from '~/types/courseMetadata'
import router from "next/router";
import { DEFAULT_SYSTEM_PROMPT } from '~/utils/app/const';
import { callSetCourseMetadata } from '~/utils/apiUtils';
import { extractEmailsFromClerk } from '~/components/UIUC-Components/clerkHelpers';
import { useUser } from '@clerk/nextjs';
import { createStyles } from '@mantine/core';

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

const getCurrentCourseName = () => {
  return router.asPath.split('/')[1];
}


const Settings = ({ t }: SettingsProps) => {
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
    <div>
      <h2 style={{ textAlign: 'center', color: 'white', padding: '10px', fontSize: '20px' }}>System Prompt</h2>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
        <textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          style={{ width: '60%', height: '100px', marginBottom: '10px', color: 'white' }}
        />
        <button
          onClick={handleSystemPromptSubmit}
          className={classes.button}
        >
          Update System Prompt
        </button>
      </div>
    </div>
  )
}

export default Settings;