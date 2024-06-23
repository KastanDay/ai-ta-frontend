// pages/api/mitIngest.ts
import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const flask_url = process.env.FLASK_URL

const mitDownload = async (url: string, courseName: string, localDir: string) => {
  try {
    const response = await axios.get(`${flask_url}/mit-download`, {
      params: {
        url: url,
        course_name: courseName,
        local_dir: localDir,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error during MIT course download:', error);
    throw error;
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // console.log("made it to new mit function")
  if (req.method === 'POST') {
    try {
      const { url, courseName, localDir } = req.body;
      const response = await mitDownload(url, courseName, localDir);
      // console.log("new mit function successfull")
      res.status(200).json(response);
    } catch (error) {
      console.error('Error during MIT course download:', error);
      res.status(500).json({ error: 'An error occurred during MIT course download' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}