import { NextApiRequest, NextApiResponse } from "next";

// pages/api/sse
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>,
) {
  res.writeHead(200, {
    Connection: 'keep-alive',
    'Content-Encoding': 'none',
    'Cache-Control': 'no-cache, no-transform',
    'Content-Type': 'text/event-stream',
  });

  let count = 1;
  const interval = setInterval(() => {
    res.write(
      `data: ${JSON.stringify({
        message: 'hello',
        value: (count += 1),
      })}\n\n`
    );
  }, 1000);

  res.on('close', () => {
    console.log(`close ${count}`);
    clearInterval(interval);
    res.end();
  });

  res.socket?.on('close', () => {
    console.log(`close ${count}`);
    clearInterval(interval);
    res.end();
  });
};