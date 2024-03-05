// ingest.ts
import { NextApiRequest, NextApiResponse } from 'next'
import axios, { AxiosResponse } from 'axios'
import { WorkflowRecord } from '~/types/tools'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { api_key, limit, pagination } = req.query as {
      api_key: string
      limit: string
      pagination: string
    }

    const parsedLimit = parseInt(limit)
    const parsedPagination = pagination.toLowerCase() === 'true'

    console.log('api_key', api_key)
    console.log('limit', limit)
    console.log('pagination', pagination)

    // localhost: 8000 / getworkflows ? api_key = n8n_api_304b9f5f0836aba9a8aa1c20fafbebfff49b2e1f2c2191c764aad26b614a19c320b0ffa041c0785f & limit=10 & pagination=True
    // const response: AxiosResponse = await axios.get(
    //   // `https://flask-production-751b.up.railway.app/getworkflows`,
    //   // ?api_key=n8n_api_304b9f5f0836aba9a8aa1c20fafbebfff49b2e1f2c2191c764aad26b614a19c320b0ffa041c0785f&limit=10&pagination=True
    //   `http://localhost:8000/getworkflows`,
    //   {
    //     params: {
    //       api_key: api_key,
    //       limit: parsedLimit,
    //       pagination: parsedPagination,
    //     },
    //   },
    // )
    const response = await fetch(
      `http://localhost:8000/getworkflows?api_key=${api_key}&limit=${parsedLimit}&pagination=${parsedPagination}`,
    )
    if (!response.ok) {
      return res.status(response.status).json({ error: response.statusText })
    }
    // This parses and simplifies the nested structure of the data...
    const data = await response.json()
    console.log('response', data)
    const simplifiedData = data.map((workflow: WorkflowRecord) => {
      // workflow.tags = workflow.tags.name
      return workflow
    })
    console.log('simplifiedData', simplifiedData)
    const final_data = simplifiedData[0]
    return res.status(200).json(final_data)
    // console.log('Getting to our /ingest endpoint', data);
    // return data;
  } catch (error) {
    console.error(error)
    return []
  }
}

export default handler
