// ingest.ts
import { NextApiRequest, NextApiResponse } from 'next'
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

    console.log('get n8nworkflows api_key', api_key)
    console.log('get n8nworkflows limit', limit)
    console.log('get n8nworkflows pagination', pagination)

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
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      error: (error as Error).message || 'An unexpected error occurred',
    })
  }
}

export default handler
