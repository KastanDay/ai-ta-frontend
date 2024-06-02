import { decrypt, isEncrypted } from '~/utils/crypto';
import { guidedRetrieval } from './guidedRetrieval';

export async function POST(request: Request) {
  try {
    const { documents, prompt, openaiKey } = await request.json();
    if (!documents || !prompt || !openaiKey) {
      return new Response(JSON.stringify({ error: 'Documents, prompt, or OpenAI key not provided.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let decryptedKey: string;
    if (isEncrypted(openaiKey)) {
      const signingKey = process.env.NEXT_PUBLIC_SIGNING_KEY;
      if (!signingKey) {
        console.error('Signing key is undefined.');
        return new Response(JSON.stringify({ error: 'Server configuration error.' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      decryptedKey = await decrypt(openaiKey, signingKey) || '';
    } else {
      decryptedKey = openaiKey;
    }

    const relevantDocuments = await guidedRetrieval(documents, prompt);

    return new Response(JSON.stringify({ relevantDocuments }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in guided retrieval:', error);
    return new Response(JSON.stringify({ error: 'Failed to process the guided retrieval.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}