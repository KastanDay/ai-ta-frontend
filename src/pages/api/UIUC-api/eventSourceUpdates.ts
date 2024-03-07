// pages/api/UIUC-api/eventSourceUpdates.ts
import { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('Content-Encoding', 'none')
  res.flushHeaders()

  console.log('Event source connected')

  // Send an event every 2 seconds
  const intervalId = setInterval(() => {
    const data = 'hi'
    console.log('Sending data', data)
    res.write(': keep-alive\n\n')
    res.write(`data: ${JSON.stringify(data)}\n\n`)
  }, 2000)

  // Clear interval on client disconnect
  req.on('close', () => {
    clearInterval(intervalId)
    res.end()
  })
}
