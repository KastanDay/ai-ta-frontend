import { NextApiRequest, NextApiResponse } from 'next';
import { ContextWithMetadata } from '~/types/chat';
import OpenAI from 'openai';
import { decrypt, isEncrypted } from '~/utils/crypto';

export default async function guidedRetrieval(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { documents, prompt, openaiKey }: { documents: ContextWithMetadata[], prompt: string, openaiKey: string } = req.body;
    if (!documents || !prompt || !openaiKey) {
      return res.status(400).json({ error: 'Documents, prompt, or OpenAI key not provided.' });
    }

    let decryptedKey: string; // Declare without initial value
    if (isEncrypted(openaiKey)) {
      const signingKey = process.env.NEXT_PUBLIC_SIGNING_KEY;
      if (!signingKey) {
        console.error('Signing key is undefined.');
        return res.status(500).json({ error: 'Server configuration error.' });
      }
      decryptedKey = await decrypt(openaiKey, signingKey) || '';
    } else {
      decryptedKey = openaiKey; // Use the original key if it's not encrypted
    }

    const openai = new OpenAI({ apiKey: decryptedKey });

    console.log('Starting document relevance determination...');

    const relevanceResponses = await interactWithLLM(openai, documents, prompt);

    console.log('Relevance responses:', relevanceResponses);

    const relevantDocuments = documents.filter((document, index) => relevanceResponses[index] === 'Yes');

    console.log('Filtered relevant documents:', relevantDocuments);

    res.status(200).json({ relevantDocuments });
  } catch (error) {
    console.error('Error in guided retrieval:', error);
    res.status(500).json({ error: 'Failed to process the guided retrieval.' });
  }
}

async function interactWithLLM(openai: OpenAI, documents: ContextWithMetadata[], prompt: string): Promise<string[]> {
  const responses = await Promise.all(documents.map(document => {
    const singlePrompt = `Is the following document relevant to "${prompt}"? ${document.text}`;
    return openai.completions.create({
      model: 'gpt-3.5-turbo-0613',
      prompt: singlePrompt,
      max_tokens: 3,
      n: 1,
      stop: null,
    }).then(response => {
      if (!response.choices || response.choices.length === 0 || !response.choices[0]) {
        return 'No'; // Handle the case where choices or the first choice is undefined
      }
      const responseText = response.choices[0].text.trim().toLowerCase();
      return responseText.includes('yes') || responseText.includes('true') ? 'Yes' : 'No';
    });
  }));

  return responses;
}
