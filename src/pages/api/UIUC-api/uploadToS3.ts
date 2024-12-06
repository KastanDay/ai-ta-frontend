// upload.ts
import { S3Client } from '@aws-sdk/client-s3'
import { NextApiRequest, NextApiResponse } from 'next'
import { createPresignedPost } from '@aws-sdk/s3-presigned-post'

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

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { uniqueFileName, courseName } = req.body as {
      uniqueFileName: string
      courseName: string
    }

    const s3_filepath = `courses/${courseName}/${uniqueFileName}`

    const post = await createPresignedPost(s3Client, {
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: s3_filepath,
      Expires: 60 * 60, // 1 hour
    })

    res
      .status(200)
      .json({ message: 'Presigned URL generated successfully', post })
  } catch (error) {
    console.error('Error generating presigned URL:', error)
    res.status(500).json({ message: 'Error generating presigned URL', error })
  }
}

export default handler
