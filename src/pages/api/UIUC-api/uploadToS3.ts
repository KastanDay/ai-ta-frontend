// upload.ts
import { S3Client } from '@aws-sdk/client-s3'
import { NextApiRequest, NextApiResponse } from 'next'
import { createPresignedPost } from '@aws-sdk/s3-presigned-post'

const aws_config = {
  bucketName: 'uiuc-chatbot',
  region: 'us-east-1',
  accessKeyId: process.env.AWS_KEY,
  secretAccessKey: process.env.AWS_SECRET,
}

console.log('bucket name ---------------', process.env.S3_BUCKET_NAME)
console.log('aws ---------------', process.env.AWS_KEY)

const s3Client = new S3Client({
  region: aws_config.region,
  credentials: {
    accessKeyId: process.env.AWS_KEY as string,
    secretAccessKey: process.env.AWS_SECRET as string,
  },
})

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { uniqueFileName, courseName } = req.body as {
      uniqueFileName: string
      courseName: string
    }

    console.log("in uploadToS3.ts: CourseName:", courseName)
    console.log("in uploadToS3.ts: uniqueFileName:", uniqueFileName)
    const s3_filepath = `courses/${courseName}/${uniqueFileName}`
    console.log("S3 path to upload:", s3_filepath)

    const post = await createPresignedPost(s3Client, {
      Bucket: aws_config.bucketName,
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
