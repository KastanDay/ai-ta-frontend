// LargeDropzone.tsx
import React, { useState, useRef } from 'react'
import { Text, Group, createStyles, rem, Title, Flex } from '@mantine/core'
import { IconCloudUpload, IconX, IconDownload } from '@tabler/icons-react'
import {
  Dropzone,
  // MIME_TYPES,
  // MS_POWERPOINT_MIME_TYPE,
  // MS_WORD_MIME_TYPE,
  // PDF_MIME_TYPE,
} from '@mantine/dropzone'
import { useRouter } from 'next/router'
import { useUser } from '@clerk/nextjs'
import { CourseMetadata } from '~/types/courseMetadata'
import { callUpsertCourseMetadata } from '~/pages/api/UIUC-api/upsertCourseMetadata'
import SupportedFileUploadTypes from './SupportedFileUploadTypes'

const useStyles = createStyles((theme) => ({
  wrapper: {
    position: 'relative',
    // marginBottom: rem(10),
  },

  dropzone: {
    borderWidth: rem(1.5),
    // paddingBottom: rem(20),
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

export function LargeDropzone({
  course_name,
  current_user_email,
  redirect_to_gpt_4 = true,
  isDisabled = false,
}: {
  course_name: string
  current_user_email: string
  redirect_to_gpt_4?: boolean
  isDisabled?: boolean
}) {
  // upload-in-progress spinner control
  const [uploadInProgress, setUploadInProgress] = useState(false)
  const router = useRouter()

  // Set owner email
  // const { isSignedIn, user } = useUser()
  // const current_user_email = user?.primaryEmailAddress?.emailAddress as string

  // console.log("in LargeDropzone.tsx primaryEmailAddress: ", user?.primaryEmailAddress?.emailAddress as string)
  // console.log("in LargeDropzone.tsx ALL emailAddresses: ", user?.emailAddresses )

  const refreshOrRedirect = (redirect_to_gpt_4: boolean) => {
    if (redirect_to_gpt_4) {
      router.push(`/${course_name}/gpt4`)
    }
    //   refresh current page
    router.push(`/${course_name}/materials`)
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

      console.log((file.name as string) + 'uploaded to S3 successfully!!')
    } catch (error) {
      console.error('Error uploading file:', error)
    }
  }

  const ingestFile = async (file: File | null) => {
    if (!file) return
    const queryParams = new URLSearchParams({
      courseName: course_name,
      fileName: file.name,
    }).toString()

    const requestObject = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      query: {
        fileName: file.name,
        courseName: course_name,
      },
    }

    // Actually we CAN await here, just don't await this function.
    console.log('right before call /ingest...')
    const response = await fetch(
      `/api/UIUC-api/ingest?${queryParams}`,
      requestObject,
    )

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

  // Get and Set course exist in KV store
  const setCourseExistsAPI = async (courseName: string) => {
    try {
      console.log('inside setCourseExistsAPI()...')
      const response = await fetch(`/api/UIUC-api/setCourseExists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ course_name: courseName }),
      })
      const data = await response.json()
      return data.success
    } catch (error) {
      console.error('Error setting course data:', error)
      return false
    }
  }

  return (
    <>
      {/* START LEFT COLUMN */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        {/* <div className={classes.wrapper} style={{ maxWidth: '320px' }}> */}
        <div
          className={classes.wrapper}
          style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column',
            paddingTop: rem(24),
          }}
        >
          <Dropzone
            openRef={openRef}
            style={{ width: rem(330), height: rem(225), ...(isDisabled ? { backgroundColor: '#2A2F36' } : {}), cursor: isDisabled ? 'not-allowed' : 'pointer' }}
            loading={uploadInProgress}
            onDrop={async (files) => {
              // set loading property
              setUploadInProgress(true)

              // Make course exist in kv store
              await setCourseExistsAPI(course_name)

              // set course exists in new metadata endpoint. Works great.
              await callUpsertCourseMetadata(course_name, {
                course_owner: current_user_email,

                // Don't set properties we don't know about. We'll just upsert and use the defaults.
                course_admins: undefined,
                approved_emails_list: undefined,
                is_private: undefined,
                banner_image_s3: undefined,
                course_intro_message: undefined
              })

              // this does sequential uploads.
              for (const [index, file] of files.entries()) {
                console.log('Index: ' + index)

                try {
                  // UPLOAD TO S3
                  await uploadToS3(file).catch((error) => {
                    console.error('Error during file upload:', error)
                  })

                  // Ingest into Qdrant (time consuming).
                  await ingestFile(file).catch((error) => {
                    console.error('Error during file upload:', error)
                  })

                  console.log('Ingested a file.')
                } catch (error) {
                  console.error('Error during file processing:', error)
                }
              }

              console.log(
                'Done ingesting everything! Now refreshing the page...',
              )
              setUploadInProgress(false)
              refreshOrRedirect(redirect_to_gpt_4)
            }}
            className={classes.dropzone}
            radius="md"
            bg="#0E1116"
            disabled={isDisabled}
            // #0E1116 -- nice dark
          >
            <div style={{ pointerEvents: 'none', opacity: isDisabled ? 0.6 : 1 }}>
              <Group position="center" pt={'md'}>
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
                {isDisabled ?
                    'Choose an available course name to create a course' :
                    <>
                      <Dropzone.Accept>Drop files here</Dropzone.Accept>
                      <Dropzone.Reject>
                        Upload rejected, not proper file type or too large.
                      </Dropzone.Reject>
                      <Dropzone.Idle>Upload materials</Dropzone.Idle>
                    </>
                }
              </Text>
              {isDisabled ? '' :
              <Text ta="center" fz="sm" mt="xs" c="dimmed">
                 Drag&apos;n&apos;drop files or a whole folder here
              </Text>}
            </div>
          </Dropzone>
          {uploadInProgress && (
            <div className="flex flex-col items-center justify-center ">
              <Title
                order={4}
                style={{
                  marginTop: 10,
                  alignItems: 'center',
                  color: '#B22222',
                  justifyContent: 'center',
                  textAlign: 'center',
                }}
              >
                Do not navigate away until loading is complete <br></br> or
                ingest will fail.
              </Title>
              <Title
                order={4}
                style={{
                  marginTop: 5,
                  alignItems: 'center',
                  color: '#B22222',
                  justifyContent: 'center',
                  textAlign: 'center',
                }}
              >
                The page will refresh when your AI Assistant is ready.
              </Title>
            </div>
          )}
        </div>
        {/* END LEFT COLUMN */}

        {/* START RIGHT COLUMN */}
        <div
            style={{
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'column',
              textAlign: 'center',
            }}
        >
          <SupportedFileUploadTypes />
        </div>
        {/* END RIGHT COLUMN */}
      </div>
    </>
  )
}

export default LargeDropzone
