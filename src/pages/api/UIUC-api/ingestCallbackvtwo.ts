import type { NextApiRequest, NextApiResponse } from 'next'
import EventEmitter from 'events'

export const delay = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms))

const stream = new EventEmitter()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>,
) {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')

  let counter = 0

  stream.on('channel', function (event, data) {
    //res.write(JSON.stringify({ counter: data })); // NOTE: this DOES NOT work
    res.write(`event: ${event}\ndata: ${JSON.stringify({ counter: data })}\n\n`) // <- the format here is important!
  })

  for (let i = 0; i < 120; ++i) {
    stream.emit('channel', 'myEventName', counter) // the event name here must be the same as in the EventSource in frontend
    console.log('update counter', counter)
    counter++
    await delay(1000)
  }
  res.end('done\n')
}
