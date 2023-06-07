import { kv } from '@vercel/kv';

export const runtime = "edge";

export async function setCourseExists(course_name: string ) {
  // View storage: https://vercel.com/uiuc-chatbot-team/uiuc-chat/stores/kv/store_VAj1mEGlDPewhKM1/cli
  try {
    await kv.set(course_name, true);
  } catch (error) {
    console.error(error);
  }
}