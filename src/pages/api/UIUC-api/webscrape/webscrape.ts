// api/crawl.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { crawl } from './core';
import { Config } from './config_validation';

// Max duration: https://vercel.com/changelog/serverless-functions-can-now-run-up-to-5-minutes
// Hobby: 10s, pro 300s. Edge: 25s. 
// export const config = {
//   maxDuration: 10,
// };
export const runtime = 'edge'

export default async function (req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    const { url, match, maxPagesToCrawl, maxTokens, courseName } = req.body;

    // Validate input parameters
    // You can use zod or any other validation library to validate the input

    const config: Config = {
      url,
      match,
      maxPagesToCrawl,
      courseName,
      maxTokens,
    };

    const results = await crawl(config);
    // Instead of writing to a file, return the results as JSON
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred during crawling' });
  }
}

// Example usage 
// fetch('/api/crawl', {
//   method: 'POST',
//   headers: {
//     'Content-Type': 'application/json',
//   },
//   body: JSON.stringify({
//     url: "https://kastanday.com/",
//     match: "https://kastanday.com/**",
//     maxPagesToCrawl: 10,
//     maxTokens: 2000000,
//   }),
// })
// .then(response => response.json())
// .then(data => {
//   console.log(data);
// })
// .catch((error) => {
//   console.error('Error:', error);
// });