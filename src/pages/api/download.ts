// download.ts
import { S3Client } from '@aws-sdk/client-s3';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { NextApiRequest, NextApiResponse } from 'next';

const aws_config = {
  bucketName: 'uiuc-chatbot',
  region: 'us-east-1',
  accessKeyId: process.env.AWS_KEY,
  secretAccessKey: process.env.AWS_SECRET,
};

console.log('bucket name ---------------', process.env.S3_BUCKET_NAME);
console.log('aws ---------------', process.env.AWS_KEY);

const s3Client = new S3Client({
  region: aws_config.region,
  credentials: {
    accessKeyId: process.env.AWS_KEY as string,
    secretAccessKey: process.env.AWS_SECRET as string,
  },
});

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { S3_filepath } = req.body as {
      S3_filepath: string;
    };

    const command = new GetObjectCommand({
      Bucket: aws_config.bucketName,
      Key: S3_filepath,
    });

    const signedUrl = await s3Client.config.credentials?.getSignedUrl(command, {
      expiresIn: 60 * 60, // 1 hour
    });

    console.log('Download pre-signed URL generated successfully:', signedUrl);

    res
      .status(200)
      .json({ message: 'Download pre-signed URL generated successfully', signedUrl });
  } catch (error) {
    console.error('Error generating download pre-signed URL:', error);
    res.status(500).json({ message: 'Error generating download pre-signed URL', error });
  }
};

export default handler;