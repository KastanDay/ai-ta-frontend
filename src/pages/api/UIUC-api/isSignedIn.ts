import { auth } from '@/lib/auth'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await auth.getSession(req)
  return res.status(200).json({ userId: session?.user?.id })
}