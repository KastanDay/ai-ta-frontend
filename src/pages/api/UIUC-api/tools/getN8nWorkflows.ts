// ingest.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { WorkflowRecord } from '~/types/tools'
import { supabase } from '~/utils/supabaseClient'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  // Only one of course_name OR api_key is required
  try {
    const { course_name } = req.query as { course_name?: string }
    let { api_key, limit, pagination } = req.query as {
      api_key?: string
      limit?: string
      pagination?: string
    }

    if (!course_name && !api_key) {
      return res.status(400).json({
        error: 'One of course_name OR api_key is required',
      })
    }

    if (!api_key) {
      // getApiFromCourse if api_key is not provided
      const { data, error } = await supabase
        .from('projects')
        .select('n8n_api_key')
        .eq('course_name', course_name)
        .single()

      if (error) {
        return res.status(500).json({ error: error.message })
      }
      if (!data) {
        return res
          .status(404)
          .json({ error: 'No project found for course_name' })
      }
      api_key = data.n8n_api_key
    }

    if (!limit) {
      limit = '10'
    }
    if (!pagination) {
      pagination = 'true'
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
