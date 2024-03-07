// pages/api/eventSourceUpdates.ts

export default function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  console.log('Event source connected')

  // Send an event every 2 seconds
  const intervalId = setInterval(() => {
    const data = { time: new Date().toLocaleTimeString() }
    console.log('Sending data', data)
    res.write(`data: ${JSON.stringify(data)}\n\n`)
  }, 2000)

  // Clear interval on client disconnect
  req.on('close', () => {
    clearInterval(intervalId)
    res.end()
  })
}
