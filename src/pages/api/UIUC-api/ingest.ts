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

    const response: AxiosResponse = await axios.get(
      `https://flask-doc-groups.up.railway.app/ingest`,
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
