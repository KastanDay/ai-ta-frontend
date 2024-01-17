import { useState, useEffect } from 'react'
import { CourseMetadata } from '~/types/courseMetadata'
import router from "next/router";
import { DEFAULT_SYSTEM_PROMPT } from '~/utils/app/const';
import { callSetCourseMetadata } from '~/utils/apiUtils';
import { getAllCourseMetadata } from '../api/UIUC-api/getAllCourseMetadata';

interface SettingsProps {
  t: (key: string) => string
}

const getCurrentCourseName = () => {
  return router.asPath.split('/')[1];
}

const Settings = ({ t }: SettingsProps) => {
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [courseMetadata, setCourseMetadata] = useState<CourseMetadata | null>(null);

  const fetchCourseMetadata = async () => {
    const courseName = getCurrentCourseName();
    if (!courseName) {
      throw new Error('Course name is undefined');
    }
    const allMetadata = await getAllCourseMetadata();
    const metadata = allMetadata?.find(meta => Object.keys(meta)[0] === courseName);
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

  return (
    <div style={{ height: '20px' }}>
      <input
        type="text"
        value={systemPrompt}
        onChange={(e) => setSystemPrompt(e.target.value)}
        style={{ width: '100%', height: '30px' }}
      />
      <button onClick={handleSystemPromptSubmit}>Update System Prompt</button>
    </div>
  )
}

export default Settings;