import { S3Client } from '@aws-sdk/client-s3';
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextApiRequest, NextApiResponse } from 'next';

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
});

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { filePath, ResponseContentType } = req.body as {
      filePath: string,
      ResponseContentType: string,
    }

    const command = new GetObjectCommand({
      Bucket: aws_config.bucketName,
      Key: filePath,
      ResponseContentDisposition:"inline",
      ResponseContentType: ResponseContentType
    });

    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    res
        .status(200)
        .json({ message: 'Presigned URL generated successfully', url: presignedUrl })
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    res.status(500).json({ message: 'Error generating presigned URL', error })
  }
}

export default handler