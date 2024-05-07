import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'

// export const runtime = 'edge'

export default async function handler(req: any, res: any) {
  const { n8nApiKey } = req.body

  // const { n8nApiKey } = await req.json() as { n8nApiKey: string }

  // const requestBody = await req.json()
  // const requestBody = await req.json()
  // const { n8nApiKey } = requestBody
  console.log(`Testing API key: '${n8nApiKey}'`)

  const parsedPagination = true
  const limit = 1

  const response = await axios.get(
    `http://localhost:8000/getworkflows?api_key=${n8nApiKey}`,
  )

  // const response = await fetch(
  //   `http://localhost:8000/switch_workflow?id=${id}&api_key=${api_key}&activate=${activateCapitalized}`,
  // )
  // const response = await fetch('http://localhost:8000/getworkflows?api_key=n8n_api_e46b54038db2eb82e2b86f2f7f153a48141113113f38294022f495774612bb4319a4670e68e6d0e6')
  // `http://localhost:8000/getworkflows?api_key=${n8nApiKey}`
  // `http://localhost:8000/getworkflows?api_key=${n8nApiKey}`
  // )
  // {
  //   method: 'GET',
  //   headers: {
  //     'Content-Type': 'application/json',
  //   },
  // }
  if (!response.ok) {
    // return res.status(response.status).json({ error: response.statusText })
    throw new Error(`Unable to fetch n8n tools: ${response.statusText}`)
  }
  console.log('Fetch was ok. ', await response.json())
}
