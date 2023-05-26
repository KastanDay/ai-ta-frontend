// ingest.ts
import { NextApiRequest, NextApiResponse } from 'next'
import axios, { AxiosResponse } from "axios";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { fileName, courseName } = req.query as {
      fileName: string
      courseName: string
    }
    
    const s3_filepath = `courses/${courseName}/${fileName}`
    
    const response: AxiosResponse = await axios.get(process.env.RAILWAY_URL + '/ingest', {
      params: {
        course_name: courseName,
        s3_paths: s3_filepath,
      },
    });
    console.log('Getting to our /ingest endpoint', response.data);
    return response;
  } catch (error) {
    console.error(error);
    return [];
  }
}

export default handler
