// ingest.ts
import { NextApiRequest, NextApiResponse } from 'next'
import axios, { AxiosResponse } from 'axios'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { uniqueFileName, courseName, readableFilename } = req.query as {
      uniqueFileName: string
      courseName: string
      readableFilename: string
    }

    const s3_filepath = `courses/${courseName}/${uniqueFileName}`
    console.log("S3 path in ingest.ts:", s3_filepath)

    const response: AxiosResponse = await axios.get(
      // `https://flask-production-751b.up.railway.app/ingest`,
      `https://flask-ai-ta-backend-pr-137.up.railway.app/ingest`,
      {
        params: {
          course_name: courseName,
          s3_paths: s3_filepath,
          readable_filename: readableFilename,
        },
      },
    )
    // const data = await
    return res.status(200).json(response.data)
    // console.log('Getting to our /ingest endpoint', data);
    // return data;
  } catch (error) {
    console.error(error)
    return []
  }
}

export default handler
