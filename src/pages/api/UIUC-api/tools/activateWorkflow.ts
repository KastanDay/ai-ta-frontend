// ingest.ts
import { NextApiRequest, NextApiResponse } from 'next'
import axios, { AxiosResponse } from 'axios'
import { WorkflowRecord } from '~/types/tools'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { api_key, id, activate } = req.query as {
      api_key: string
      id: string
      activate: string
    }

    console.log('api_key', api_key)
    console.log('id', id)
    const activateCapitalized =
      activate.charAt(0).toUpperCase() + activate.slice(1)
    console.log('activate', activateCapitalized)

    // localhost: 8000 / getworkflows ? api_key = n8n_api_304b9f5f0836aba9a8aa1c20fafbebfff49b2e1f2c2191c764aad26b614a19c320b0ffa041c0785f & limit=10 & pagination=True
    // const response: AxiosResponse = await axios.get(
    //   // `https://flask-production-751b.up.railway.app/getworkflows`,
    // ?api_key=n8n_api_304b9f5f0836aba9a8aa1c20fafbebfff49b2e1f2c2191c764aad26b614a19c320b0ffa041c0785f&limit=10&pagination=True
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
      `http://localhost:8000/switch_workflow?id=${id}&api_key=${api_key}&activate=${activateCapitalized}`,
    )
    if (!response.ok) {
      console.log('response not ok', response.text)
      return res.status(response.status).json({ error: response.statusText })
    }
    // This parses and simplifies the nested structure of the data...
    const data = await response.json()
    console.log('response for workflow switch', data)
    if (data.message) {
      return res.status(400).json({ error: data.message })
    }

    return res.status(200).json(data)
    // console.log('Getting to our /ingest endpoint', data);
    // return data;
  } catch (error) {
    return error
  }
}

export default handler
