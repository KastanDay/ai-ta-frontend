import { NextApiRequest, NextApiResponse } from "next"
import { toNodeHandler } from "better-auth/node"
import { auth } from "@/lib/auth"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await toNodeHandler(auth)(req, res)
}