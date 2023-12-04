// pages/api/getPresignedUrl.ts
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { NextApiRequest, NextApiResponse } from 'next';


const aws_config = {
  bucketName: 'uiuc-chatbot',
  region: 'us-east-1',
  accessKeyId: process.env.AWS_KEY,
  secretAccessKey: process.env.AWS_SECRET,
}

const s3Client = new S3Client({
  region: aws_config.region,
  credentials: {
    accessKeyId: process.env.AWS_KEY as string,
    secretAccessKey: process.env.AWS_SECRET as string,
  },
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { s3_path } = req.query;

    const command = new GetObjectCommand({
      Bucket: aws_config.bucketName,
      Key: s3_path as string,
    });

    try {
      const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 * 60 }); // 1 hour
      res.status(200).json({ presignedUrl });
    } catch (error) {
      res.status(500).json({ error: 'Error generating presigned URL' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}