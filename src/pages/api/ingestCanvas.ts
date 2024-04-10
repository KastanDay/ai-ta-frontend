// pages/api/ingestCanvas.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const flask_url = process.env.FLASK_URL

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // console.log("made it to new canvas ingest");
  if (req.method === 'POST') {
    const { canvasCourseId, courseName, selectedCanvasOptions } = req.body;
    try {
      const response = await axios.get(
        `${flask_url}/ingestCanvas`,
        {
          params: {
            course_id: canvasCourseId,
            course_name: courseName,
            files: selectedCanvasOptions.includes('files') ? 'true' : 'false',
            pages: selectedCanvasOptions.includes('pages') ? 'true' : 'false',
            modules: selectedCanvasOptions.includes('modules') ? 'true' : 'false',
            syllabus: selectedCanvasOptions.includes('syllabus') ? 'true' : 'false',
            assignments: selectedCanvasOptions.includes('assignments') ? 'true' : 'false',
            discussions: selectedCanvasOptions.includes('discussions') ? 'true' : 'false',
          },
        }
      );
      // console.log("new canvas ingest successful");
      res.status(200).json(response.data);
    } catch (error) {
      console.error('Error while ingesting Canvas content:', error);
      res.status(500).json({ error: 'An error occurred while ingesting Canvas content.' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed.' });
  }
}