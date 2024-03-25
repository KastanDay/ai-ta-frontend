import { ChatBody, Conversation, Message } from '@/types/chat'

export const onResponseCompletion = async (course_name: string, conversation: Conversation) => {
  try {
    const response = await fetch(`https://flask-production-751b.up.railway.app/onResponseCompletion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        course_name,
        conversation,
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);

    console.log('new method worked backend');
    
    return data.success;
  } catch (error) {
    console.error('Error in backend.ts running onResponseCompletion():', error);
    return false;
  }
};