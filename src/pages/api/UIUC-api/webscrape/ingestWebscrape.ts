// ingest.ts
import { NextApiRequest, NextApiResponse } from 'next'
import axios, { AxiosResponse } from 'axios'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  console.log('Getting to our /ingest-webscrape endpoint')
  try {
    const { base_url, url, title, content, courseName } = req.query as {
      base_url: string
      url: string
      title: string
      content: string
      courseName: string
    }

    console.log("Invoking ingestWebscrape.ts's /ingest endpoint. Url: ", url)

    const response: AxiosResponse = await axios.get(
      `https://flask-production-751b.up.railway.app/ingest-web-text`,
      {
        params: {
          url: url,
          base_url: base_url,
          title: title,
          content: content,
          course_name: courseName,
        },
      },
    )
    return res.status(200).json(response.data)
    // console.log('Getting to our /ingest endpoint', data);
    // return data;
  } catch (error) {
    console.error(error)
    return []
  }
}

export default handler
