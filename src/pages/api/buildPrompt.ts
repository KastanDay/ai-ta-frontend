import { NextApiRequest, NextApiResponse } from 'next';
import { ChatBody } from '@/types/chat';
import { buildPrompt } from './chat';
import { initializeWasm } from '@/utils/encoding';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Initialize encoding before using it
    await initializeWasm();

    const chatBody = req.body as ChatBody;
    console.log('Received ChatBody:', JSON.stringify(chatBody, null, 2));

    const { conversation, key, course_name, courseMetadata } = chatBody;
    
    if (!conversation) {
      console.error('No conversation provided');
      return res.status(400).json({ error: 'No conversation provided' });
    }

    if (!conversation.messages || !Array.isArray(conversation.messages)) {
      console.error('Invalid or missing messages in conversation');
      return res.status(400).json({ error: 'Invalid conversation structure' });
    }

    const updatedConversation = await buildPrompt({
      conversation,
      projectName: course_name,
      courseMetadata,
    });

    return res.status(200).json(updatedConversation);
  } catch (error) {
    console.error('Error in buildPromptAPI:', error);

    return res.status(500).json({
      error: 'An error occurred in buildPromptAPI',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
