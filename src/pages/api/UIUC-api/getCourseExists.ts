import { kv } from '@vercel/kv';

export const runtime = "edge";

export async function checkIfCourseExists( course_name: string) {
  // It'll return True for existing, and null for non-existing. False for errors.
  // View storage: https://vercel.com/uiuc-chatbot-team/uiuc-chat/stores/kv/store_VAj1mEGlDPewhKM1/cli
  try {
    const courseExists = await kv.get(course_name);
    return courseExists as boolean;
  } catch (error) {
    console.log(error)
    return false;
  }
}


