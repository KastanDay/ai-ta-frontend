import { ServerResponse } from 'http'
// import { type NextRequest, NextResponse } from 'next/server'
import { NextApiRequest, NextApiResponse } from 'next'

const clients = new Set<ServerResponse>()

// export const runtime = 'edge'


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  console.log('XXX Received request:', req.url, req.body)

  // Just post to Supabase. No need to send data to clients. Do client-side polling on that table update.

  if (req.method === 'GET') {
    // Setup for SSE
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('Content-Encoding', 'none')
    res.flushHeaders()

    console.log('Event source connected')
    clients.add(res)

    req.on('close', () => {
      clients.delete(res)
      res.end()
    })
  } else if (req.method === 'POST') {
    // console.log("Clients:", clients)
    clients.forEach((client) => {
      console.log('Forwarding data to client:', req.body)
      client.write(`data: ${JSON.stringify(req.body)}\n\n`)
    })

    req.on('close', () => {
      res.end()
    })

    res.status(200).end('Data forwarded to all connected clients')
  } else {
    res.setHeader('Allow', ['GET', 'POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
