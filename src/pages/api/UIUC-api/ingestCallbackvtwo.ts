// import type { NextApiRequest, NextApiResponse } from "next";
// import EventEmitter from "events";
// import ioredis from "ioredis";

// const stream = new EventEmitter();

// const redis = new ioredis({
//   host: "127.0.0.1",
//   port: 6379,
//   password: "",
//   family: 4,
//   db: 0,
// });

// redis.subscribe("test");

// export const config = {
//   api: {
//     externalResolver: true,
//   },
// }; // this is important to avoid the 'API resolved without sending a response for /api/test_sse, this may result in stalled requests.' warning

// export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
//   res.setHeader("Content-Type", "text/event-stream");
//   res.setHeader("Cache-Control", "no-cache, no-transform");
//   res.setHeader("Connection", "keep-alive");
//   res.setHeader('Content-Encoding', 'none')
//   res.flushHeaders()

//   stream.on("channel", function (event, data) {
//     res.write(`event: ${event}\ndata: ${JSON.stringify({ counter: data })}\n\n`); // <- the format here is important!
//   });

//   redis.on("message", (channel: string, message: string) => {
//     console.log(`get ${message} on ${channel}`);
//     stream.emit("channel", "myEventName", message);
//   });

//   redis.on("close", () => res.end());
// }

// NOT WORKING ON VERCEL
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
  res.setHeader('Content-Encoding', 'none')
  res.flushHeaders()

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
