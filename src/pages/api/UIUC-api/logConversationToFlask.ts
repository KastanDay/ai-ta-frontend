import { NextApiRequest, NextApiResponse } from 'next';
import { ChatBody, Conversation, Message } from '@/types/chat';

const flask_url = process.env.FLASK_URL

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { course_name, conversation } = req.body as { course_name: string; conversation: Conversation };

      const response = await fetch(`${flask_url}/onResponseCompletion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          course_name: course_name,
          conversation: conversation,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      // console.log('new method worked backend');
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error in backend.ts running logConversationToFlask():', error);
      res.status(500).json({ success: false, message: 'An error occurred' });
    }
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}