// upload.tsx
import React, { useState, useRef } from 'react';
import {
  Text,
  Group,
  createStyles,
  FileInput, 
  rem,
} from '@mantine/core'
import {  IconCloudUpload, IconX, IconDownload } from '@tabler/icons-react'
import { Dropzone, MIME_TYPES } from '@mantine/dropzone'

const useStyles = createStyles((theme) => ({
  wrapper: {
    position: 'relative',
    marginBottom: rem(20),
  },

  dropzone: {
    borderWidth: rem(1),
    paddingBottom: rem(20),
  },

  icon: {
    color:
      theme.colorScheme === 'dark'
        ? theme.colors.dark[3]
        : theme.colors.gray[4],
  },

  control: {
    position: 'absolute',
    width: rem(250),
    left: `calc(50% - ${rem(125)})`,
    bottom: rem(-20),
  },
}))



export function DropzoneS3Upload({ course_name }: { course_name: string }) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      if (e.target.files[0]) setSelectedFile(e.target.files[0]);
    }
  };

  const uploadFile = async (file: File | null) => {
    if (!file) return;

    const requestObject = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        courseName: course_name,
      }),
    };

    try {
      interface PresignedPostResponse {
        post: {
          url: string;
          fields: { [key: string]: string };
        };
      }

      // Then, update the lines where you fetch the response and parse the JSON
      const response = await fetch('/api/upload', requestObject);
      const data = (await response.json()) as PresignedPostResponse;

      const { url, fields } = data.post as {
        url: string;
        fields: { [key: string]: string };
      };
      const formData = new FormData();

      Object.entries(fields).forEach(([key, value]) => {
        formData.append(key, value);
      });

      formData.append('file', file);

      await fetch(url, {
        method: 'POST',
        body: formData,
      });

      console.log('File uploaded successfully!!');
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const { classes, theme } = useStyles();
  const openRef = useRef<() => void>(null);

  return (
    <div className={classes.wrapper} style={{ maxWidth: '220px' }}>
      <Dropzone
        openRef={openRef}
        onDrop={(files) => {
          // UPLOAD TO S3
          files.forEach((file) => {
            void (async () => {
              await uploadFile(file).catch((error) => {
                console.error('Error during file upload:', error);
              });
            })();
          });

          console.log('Got your upload! And saved it!');
          console.log(files);
        }}
        className={classes.dropzone}
        radius="md"
        accept={[
          MIME_TYPES.pdf,
          MIME_TYPES.mp4,
          MIME_TYPES.docx,
          MIME_TYPES.xlsx,
          MIME_TYPES.pptx,
          MIME_TYPES.ppt,
          MIME_TYPES.doc,
        ]}
        bg="#0E1116"
        // maxSize={30 * 1024 ** 2} max file size
      >
        <div style={{ pointerEvents: 'none' }}>
          <Group position="center">
            <Dropzone.Accept>
              <IconDownload
                size={rem(50)}
                color={theme.primaryColor[6]}
                stroke={1.5}
              />
            </Dropzone.Accept>
            <Dropzone.Reject>
              <IconX
                size={rem(50)}
                color={theme.colors.red[6]}
                stroke={1.5}
              />
            </Dropzone.Reject>
            <Dropzone.Idle>
              <IconCloudUpload
                size={rem(50)}
                color={
                  theme.colorScheme === 'dark'
                    ? theme.colors.dark[0]
                    : theme.black
                }
                stroke={1.5}
              />
            </Dropzone.Idle>
          </Group>

          <Text ta="center" fw={700} fz="lg" mt="xl">
            <Dropzone.Accept>Drop files here</Dropzone.Accept>
            <Dropzone.Reject>
              Upload rejected, not proper file type or too large.
            </Dropzone.Reject>
            <Dropzone.Idle>Upload materials</Dropzone.Idle>
          </Text>
          <Text ta="center" fz="sm" mt="xs" c="dimmed">
            Drag&apos;n&apos;drop files here to upload.<br></br>We support PDF,
            MP4, DOCX, XLSX, PPTX, PPT, DOC.
          </Text>
        </div>
      </Dropzone>
    </div>
  );
}

export default DropzoneS3Upload;
