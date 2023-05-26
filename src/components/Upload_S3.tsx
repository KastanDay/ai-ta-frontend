// upload.tsx
import React, { useState, useRef } from 'react'
import { Text, Group, createStyles, FileInput, rem } from '@mantine/core'
import { IconCloudUpload, IconX, IconDownload } from '@tabler/icons-react'
import { Dropzone, MIME_TYPES, MS_POWERPOINT_MIME_TYPE, MS_WORD_MIME_TYPE, PDF_MIME_TYPE } from '@mantine/dropzone'
import { useRouter } from 'next/router';

import { addEdgeConfigItem, addConfigV2 } from '~/pages/api/UIUC-api/addCourseEdgeConfig';

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      if (e.target.files[0]) setSelectedFile(e.target.files[0])
    }
  }

  const router = useRouter();

  const refreshPage = () => {
    router.replace(router.asPath);
  };
  const NewGetCurrentPageName = () => {
    // /CS-125/materials --> CS-125
    return router.asPath.slice(1).split("/")[0]
  }

  const uploadToS3 = async (file: File | null) => {
  if (!file) return

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
  }

  try {
    interface PresignedPostResponse {
      post: {
        url: string
        fields: { [key: string]: string }
      }
    }

    // Then, update the lines where you fetch the response and parse the JSON
    const response = await fetch('/api/UIUC-api/uploadToS3', requestObject)
    const data = (await response.json()) as PresignedPostResponse

    const { url, fields } = data.post as {
      url: string
      fields: { [key: string]: string }
    }
    const formData = new FormData()

    Object.entries(fields).forEach(([key, value]) => {
      formData.append(key, value)
    })

    formData.append('file', file)

    await fetch(url, {
      method: 'POST',
      body: formData,
    })

    console.log(file.name as string + 'uploaded to S3 successfully!!')
  } catch (error) {
    console.error('Error uploading file:', error)
  }
}

const ingestFile = async (file: File | null) => {
  if (!file) return
  const queryParams = new URLSearchParams({
    courseName: course_name,
    fileName: file.name,
  }).toString();

  const requestObject = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    query: {
      fileName: file.name,
      courseName: course_name,
    }
  };

  // Actually we CAN await here, just don't await this function.
  const response = await fetch(`/api/UIUC-api/ingest?${queryParams}`, requestObject)

  // check if the response was ok 
  if (response.ok) {
    const data = await response.json()
    // console.log(file.name as string + ' ingested successfully!!')
    console.log('Response:', data)
    return data
  } else {
    console.log('Error during ingest:', response.statusText)
    console.log('Full Response message:', response)
    return response
  }
}

// const createEdgeConfigKey = async (courseName: string) => {
//   console.log('createEdgeConfigKey.....:', courseName)
//   if (!courseName) return
//   const queryParams = new URLSearchParams({
//     courseName: courseName,
//   }).toString();

  
//   const requestObject = {
//     method: 'GET',
//     headers: {
//       'Content-Type': 'application/json',
//     },
//     query: {
//       courseName: courseName,
//     }
//   };
  
//   console.log('right before fetch.....')
//   // Actually we CAN await here, just don't await this function.
//   const response = await fetch(`/api/UIUC-api/sosad?${queryParams}`, requestObject)
//   console.log('right after fetch.....')
  
//   // check if the response was ok 
//   if (response.ok) {
//     const data = await response.json()
//     // console.log(file.name as string + ' ingested successfully!!')
//     console.log('Response:', data)
//     return data
//   } else {
//     console.log('Error during ingest:', response.statusText)
//     console.log('Full Response message:', response)
//     return response
//   }
// }
// const createEdgeConfigKey = async (courseName: string) => {
//   console.log('createEdgeConfigKey.....:', courseName)
//   if (!courseName) return
//   const queryParams = new URLSearchParams({
//     courseName: courseName,
//   }).toString();

//   const requestObject = {
//     method: 'GET',
//     headers: {
//       'Content-Type': 'application/json',
//     },
//     query: {
//       courseName: courseName,
//     }
//   };
  
//   console.log('right before fetch.....')
//   // Actually we CAN await here, just don't await this function.
//   const response = await fetch(`/api/UIUC-api/sosad?${queryParams}`, requestObject)
//   console.log('right after fetch.....')
  
//   // check if the response was ok 
//   if (response.ok) {
//     const data = await response.json()
//     // console.log(file.name as string + ' ingested successfully!!')
//     console.log('Response:', data)
//     return data
//   } else {
//     console.log('Error during ingest:', response.statusText)
//     console.log('Full Response message:', response)
//     return response
//   }
// }

  const createEdgeConfigKey = async (courseName: string) => {
    console.log('createEdgeConfigKey.....:', courseName)
    if (!courseName) return
    const queryParams = new URLSearchParams({
      courseName: courseName,
    }).toString();

    const requestObject = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      query: {
        courseName: courseName,
      }
    };
    console.log('right before fetch.....')
    // Actually we CAN await here, just don't await this function.
    const response = await fetch(`/api/UIUC-api/vercelsosad?${queryParams}`, requestObject)
    console.log('right after fetch.....')

    // check if the response was ok 
    if (response.ok) {
      const data = await response.json()
      // console.log(file.name as string + ' ingested successfully!!')
      console.log('Response:', data)
      return data
    } else {
      console.log('Error during ingest:', response.statusText)
      console.log('Full Response message:', response)
      return response
    }
  }

  const { classes, theme } = useStyles()
  const openRef = useRef<() => void>(null)

  return (
    <div className={classes.wrapper} style={{ maxWidth: '220px' }}>
      <Dropzone
        openRef={openRef}
        onDrop={(files) => {
          // Make course exist in EdgeConfig
          console.log('about to add EdgeConfig...');
          (async () => {
            await createEdgeConfigKey(NewGetCurrentPageName() as string)
          })();


          // UPLOAD TO S3
          files.forEach((file) => {
            void (async () => {
              await uploadToS3(file).catch((error) => {
                console.error('Error during file upload:', error)
              })

              console.log('About to call ingestFile...')

              // UPLOAD TO SupaBase
              await ingestFile(file).catch((error) => {
                console.error('Error during file upload:', error)
              })
              console.log('Ingested a file.')

            }
            )()
          })
          
          console.log('Done ingesting everything! Now refreshing the page...')
          refreshPage();
          // console.log('Got your upload! And saved it!')
          // console.log(files)
        }}
        className={classes.dropzone}
        radius="md"
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
              <IconX size={rem(50)} color={theme.colors.red[6]} stroke={1.5} />
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
            Drag&apos;n&apos;drop files or a whole folder here.<br></br>We support PDF,
            Word, Powerpoint, Excel, .mp4 video, and SRT closed-captions.
          </Text>
        </div>
      </Dropzone>
    </div>
  )
}

export default DropzoneS3Upload
