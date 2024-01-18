// api/crawl.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { crawl } from './core';
import { Config } from './configValidation';

// Max duration: https://vercel.com/changelog/serverless-functions-can-now-run-up-to-5-minutes
// Hobby: 10s, pro 300s. Edge: 25s. 
export const config = {
  maxDuration: 10,
};
// export const runtime = 'edge' // Crawlee note supported on Edge runtime


export default async function (req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    const { url, match, maxPagesToCrawl, maxTokens, courseName } = req.body;

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
    const e = error as Error;
    res.status(500).json({ error: 'An error occurred during crawling', errorTitle: e, errorMessage: e.message });
  }
}