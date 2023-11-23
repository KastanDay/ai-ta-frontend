// src/pages/api/UIUC-api/validateS3Url.ts
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const { url } = req.body;
    console.log("Validating url: ", url)
    try {
        const response = await fetch(url, { method: 'HEAD' });
        if (!response.ok) {
            res.status(200).json({ isValid: false });
        } else {
            res.status(200).json({ isValid: true });
        }
    } catch (error) {
        console.error('Failed to fetch URL', url, error);
        res.status(500).json({ error: 'Failed to fetch URL' });
    }
}