import { NextApiRequest, NextApiResponse } from 'next';
import { createOpenAI } from '@ai-sdk/openai';
import { decrypt, isEncrypted } from '~/utils/crypto';
import { guidedRetrieval } from './guidedRetrieval';

export default async function guidedRetrievalRoute(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { documents, prompt, openaiKey } = req.body;
    if (!documents || !prompt || !openaiKey) {
      return res.status(400).json({ error: 'Documents, prompt, or OpenAI key not provided.' });
    }

    let decryptedKey: string;
    if (isEncrypted(openaiKey)) {
      const signingKey = process.env.NEXT_PUBLIC_SIGNING_KEY;
      if (!signingKey) {
        console.error('Signing key is undefined.');
        return res.status(500).json({ error: 'Server configuration error.' });
      }
      decryptedKey = await decrypt(openaiKey, signingKey) || '';
    } else {
      decryptedKey = openaiKey;
    }

    const relevantDocuments = await guidedRetrieval(documents, prompt);

    res.status(200).json({ relevantDocuments });
  } catch (error) {
    console.error('Error in guided retrieval:', error);
    res.status(500).json({ error: 'Failed to process the guided retrieval.'  });
  }
}