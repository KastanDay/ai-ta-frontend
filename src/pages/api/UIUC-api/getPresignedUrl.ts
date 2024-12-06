// pages/api/getPresignedUrl.ts
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import type { NextApiRequest, NextApiResponse } from 'next'

const region = process.env.AWS_REGION // no need for any MINIO_REGION. It doesn't exist.
const accessKey = process.env.MINIO_KEY || process.env.AWS_KEY
const secretKey = process.env.MINIO_SECRET || process.env.AWS_SECRET
const bucketName = process.env.MINIO_BUCKET_NAME || process.env.S3_BUCKET_NAME

if (
  !region ||
  !accessKey ||
  !secretKey ||
  !bucketName ||
  !process.env.MINIO_ENDPOINT
) {
  throw new Error(
    'Missing required AWS S3 or MINIO credentials, endpoint, or bucket name in environment variables.',
  )
}

const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretKey,
  },
  ...(process.env.MINIO_ENDPOINT && {
    endpoint: process.env.MINIO_ENDPOINT,
    forcePathStyle: true,
  }),
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === 'GET') {
    const { s3_path } = req.query

    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: s3_path as string,
    })

    try {
      const presignedUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 60 * 60,
      }) // 1 hour
      res.status(200).json({ presignedUrl })
    } catch (error) {
      res.status(500).json({ error: 'Error generating presigned URL' })
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}
