// api/conversation-history.ts
import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { course_name } = req.query;

    try {
      const response = await axios.get(
        `https://flask-production-751b.up.railway.app/export-convo-history-csv?course_name=${course_name}`,
        { responseType: 'arraybuffer' }
      );

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename=${course_name}_conversation_history.zip`);
      res.send(Buffer.from(response.data));
    } catch (error) {
      console.error('Error fetching conversation history:', error);
      res.status(500).json({ error: 'Failed to fetch conversation history' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}