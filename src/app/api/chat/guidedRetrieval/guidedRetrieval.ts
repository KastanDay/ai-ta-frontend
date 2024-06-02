import { ContextWithMetadata } from '~/types/chat';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

export async function guidedRetrieval(documents: ContextWithMetadata[], prompt: string): Promise<ContextWithMetadata[]> {
  console.log('Starting document relevance determination...');

  const relevanceResponses = await interactWithLLM(documents, prompt);

  console.log('Relevance responses:', relevanceResponses);

  const relevantDocuments = documents.filter((document, index) => relevanceResponses[index] === 'Yes');

  console.log('Filtered relevant documents:', relevantDocuments);

  return relevantDocuments;
}

async function interactWithLLM(documents: ContextWithMetadata[], prompt: string): Promise<string[]> {
  const responses = await Promise.all(documents.map(document => {
    const singlePrompt = `Is the following document relevant to "${prompt}"? ${document.text}`;
    return generateText({
      model: openai('gpt-3.5-turbo'),
      prompt: singlePrompt,
      maxTokens: 3,
    }).then((response) => {
      if (!response.text) {
        return 'No';
      }
      const responseText = response.text.trim().toLowerCase();
      return responseText.includes('yes') || responseText.includes('true') ? 'Yes' : 'No';
    });
  }));

  return responses;
}