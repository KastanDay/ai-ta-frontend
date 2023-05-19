// upload.ts
import type { PutObjectCommandInput } from '@aws-sdk/client-s3';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { NextApiRequest, NextApiResponse } from 'next';

const aws_config = {
  bucketName: 'uiuc-chatbot',
  region: 'us-east-1',
  accessKeyId: process.env.AWS_KEY,
  secretAccessKey: process.env.AWS_SECRET,
};

console.log("bucket name ---------------", process.env.S3_BUCKET_NAME);
console.log("aws ---------------", process.env.AWS_KEY);

const s3Client = new S3Client({
  region: aws_config.region,
  credentials: {
    accessKeyId: process.env.AWS_KEY as string,
    secretAccessKey: process.env.AWS_SECRET as string,
  },
});

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { file, fileName, courseName } = req.body as { file: string; fileName: string; courseName: string };

    const s3_filepath = `courses/${courseName}/${fileName}`;

    // Convert base64-encoded file data to a buffer
    const fileBuffer = Buffer.from(file, 'base64');

    const uploadParams: PutObjectCommandInput = {
      Bucket: aws_config.bucketName,
      Key: s3_filepath,
      Body: fileBuffer,
    };
    const command = new PutObjectCommand(uploadParams);
    const response = await s3Client.send(command);
    console.log('File uploaded successfully:', response);

    res.status(200).json({ message: 'File uploaded successfully', response });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ message: 'Error uploading file', error });
  }
};

export default handler;
