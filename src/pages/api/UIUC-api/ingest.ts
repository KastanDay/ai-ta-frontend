// import { NextApiRequest, NextApiResponse } from 'next'
import { NextRequest, NextResponse } from 'next/server'

export const config = {
  runtime: 'edge',
}

const handler = async (req: NextRequest, res: NextResponse) => {
  try {
    // const { uniqueFileName, courseName, readableFilename } = req.query as {
    //   uniqueFileName: string
    //   courseName: string
    //   readableFilename: string
    // }

    // Parse the URL to get query parameters
    const url = new URL(req.url)
    const uniqueFileName = url.searchParams.get('uniqueFileName')
    const courseName = url.searchParams.get('courseName')
    const readableFilename = url.searchParams.get('readableFilename')

    if (!uniqueFileName || !courseName || !readableFilename) {
      // Handle the case where any of the parameters are missing
      console.error('Missing query parameters')
      // return res.status(400).json({ error: 'Missing query parameters' })
      return new Response(
        JSON.stringify({ error: 'Missing query parameters' }),
        { status: 400 },
      )
    }

    const s3_filepath = `courses/${courseName}/${uniqueFileName}`

    fetch('https://41kgx.apps.beam.cloud', {
      method: 'POST',
      headers: {
        Accept: '*/*',
        'Accept-Encoding': 'gzip, deflate',
        Authorization: `Basic ${process.env.BEAM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        course_name: courseName,
        readable_filename: readableFilename,
        s3_paths: s3_filepath,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(`In success case -- Data ingested for URL: ${s3_filepath}`)
        // res.status(200).json(data)
        return new Response(JSON.stringify({ data }), { status: 200 })
      })
      .catch((err) => {
        console.error(err)
        // res.status(500).json({ error: 'Internal Server Error' })
        return new Response(
          JSON.stringify({ error: `Internal Server Error: ${err}` }),
          { status: 500 },
        )
      })
    // console.log('Getting to our /ingest endpoint', data);
    // return data;
  } catch (error) {
    console.error(error)
    return []
  }
}

export default handler
