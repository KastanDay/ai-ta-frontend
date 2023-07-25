// Return webScrapeConfig from Vercel Edge Config

import { NextRequest, NextResponse } from 'next/server'
import { get } from '@vercel/edge-config'

export const config = {
  runtime: 'edge',
}

export default async () => {
  const webConfig = (await get('web_scrape_config')) as JSON
  console.log('VALUE', webConfig)
  // return webConfig
  return NextResponse.json({
    config: webConfig,
  })
}

export async function upsertWebScrapeConfig(webScrapeConfig: {
  num_sites: number
  recursive_depth: number
  timeout_sec: number
}): Promise<void> {
  try {
    const edgeConfigVar = process.env.EDGE_CONFIG
    const vercelTeamID = process.env.VERCEL_TEAM_ID
    console.log('edgeConfigVar', edgeConfigVar)
    console.log('vercelTeamID', vercelTeamID)
    const updateEdgeConfig = await fetch(`${edgeConfigVar}/items`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [
          {
            operation: 'upsert',
            key: 'web_scrape_config',
            value: webScrapeConfig,
          },
        ],
      }),
    })
    const result = await updateEdgeConfig.json()
    console.log(result)
  } catch (error) {
    console.log(error)
  }
}
