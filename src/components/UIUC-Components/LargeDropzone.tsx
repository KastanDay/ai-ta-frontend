// LargeDropzone.tsx
import React, { useRef, useState } from 'react'
import {
  createStyles,
  Group,
  rem,
  Text,
  Title,
  useMantineTheme,
} from '@mantine/core'
import {
  IconAlertCircle,
  IconCloudUpload,
  IconDownload,
  IconX,
} from '@tabler/icons-react'
import { Dropzone } from '@mantine/dropzone'
import { useRouter } from 'next/router'
import { type CourseMetadata } from '~/types/courseMetadata'
import SupportedFileUploadTypes from './SupportedFileUploadTypes'
import { useMediaQuery } from '@mantine/hooks'
import { callSetCourseMetadata } from '~/utils/apiUtils'
import { notifications } from '@mantine/notifications'

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
  courseName,
  current_user_email,
  redirect_to_gpt_4 = true,
  isDisabled = false,
  courseMetadata,
  is_new_course,
}: {
  courseName: string
  current_user_email: string
  redirect_to_gpt_4?: boolean
  isDisabled?: boolean
  courseMetadata: CourseMetadata
  is_new_course: boolean
}) {
  // upload-in-progress spinner control
  const [uploadInProgress, setUploadInProgress] = useState(false)
  const router = useRouter()
  const isSmallScreen = useMediaQuery('(max-width: 960px)')
  // const theme = useMantineTheme()
  // Set owner email
  // const { isSignedIn, user } = useUser()
  // const current_user_email = user?.primaryEmailAddress?.emailAddress as string

  // console.log("in LargeDropzone.tsx primaryEmailAddress: ", user?.primaryEmailAddress?.emailAddress as string)
  // console.log("in LargeDropzone.tsx ALL emailAddresses: ", user?.emailAddresses )

  const refreshOrRedirect = async (redirect_to_gpt_4: boolean) => {
    if (redirect_to_gpt_4) {
      router.push(`/${courseName}/gpt4`)
    }
    // refresh current page
    await new Promise((resolve) => setTimeout(resolve, 700))
    router.reload()
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
        courseName: courseName,
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
      courseName: courseName,
      fileName: file.name,
    }).toString()

    const requestObject = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      query: {
        fileName: file.name,
        courseName: courseName,
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
      console.log('Success or Failure:', data)
      // TODO: move these toasts to AFTER the refreshOrRedirect
      // showToast(data.failure_ingest)
      // showToast(data.success_ingest)
      // failure_ingest.length is not a function. idk why...
      if (data.failure_ingest.length > 0) {
        data.failure_ingest.map((s3path: string) => {
          console.log('Logging each failure path:', s3path)
        })
      }
      if (data.success_ingest.length > 0) {
        data.success_ingest.map((s3path: string) => {
          console.log('Logging each success path:', s3path)
        })
      }

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
    <>
      {/* START LEFT COLUMN */}
      <div
        style={{
          display: 'flex',
          flexDirection: is_new_course && !isSmallScreen ? 'row' : 'column',
          justifyContent: 'space-between',
        }}
      >
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
            style={{
              width: rem(330),
              height: rem(225),
              ...(isDisabled
                ? { backgroundColor: '#3a374a' }
                : { backgroundColor: '#25262b' }),
              cursor: isDisabled ? 'not-allowed' : 'pointer',
            }}
            loading={uploadInProgress}
            onDrop={async (files) => {
              setUploadInProgress(true)
              console.log(
                'Calling upsert metadata api with courseName & courseMetadata',
                courseName,
                courseMetadata,
              )
              // set course exists
              const upsertCourseMetadataResponse = await callSetCourseMetadata(
                courseName,
                courseMetadata || {
                  course_owner: current_user_email,
                  course_admins: undefined,
                  approved_emails_list: undefined,
                  is_private: undefined,
                  banner_image_s3: undefined,
                  course_intro_message: undefined,
                },
              )
              if (upsertCourseMetadataResponse) {
                // this does sequential uploads.
                for (const [index, file] of files.entries()) {
                  console.log('Index: ' + index)
                  try {
                    await uploadToS3(file).catch((error) => {
                      console.error('Error during file upload:', error)
                    })
                    // Ingest into backend (time consuming)
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
                // TODO: here we should raise toast for failed ingest files. AND successful ingest files.
              } else {
                console.error('Upsert metadata failed')
                setUploadInProgress(false)
              }
            }}
            className={classes.dropzone}
            radius="md"
            bg="#25262b"
            disabled={isDisabled}
          >
            <div
              style={{ pointerEvents: 'none', opacity: isDisabled ? 0.6 : 1 }}
            >
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
                {!isDisabled && (
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
                )}
              </Group>
              {isDisabled ? (
                <>
                  <br></br>
                  <Text ta="center" fw={700} fz="lg" mt="xl">
                    Enter an available project name above! 👀
                  </Text>
                </>
              ) : (
                <Text ta="center" fw={700} fz="lg" mt="xl">
                  <Dropzone.Accept>Drop files here</Dropzone.Accept>
                  <Dropzone.Reject>
                    Upload rejected, not proper file type or too large.
                  </Dropzone.Reject>
                  <Dropzone.Idle>Upload materials</Dropzone.Idle>
                </Text>
              )}
              {isDisabled ? (
                ''
              ) : (
                <Text ta="center" fz="sm" mt="xs" c="dimmed">
                  Drag&apos;n&apos;drop files or a whole folder here
                </Text>
              )}
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

const showToast = (error_files: string[]) => {
  return (
    // docs: https://mantine.dev/others/notifications/

    notifications.show({
      id: 'failed-ingest-toast',
      withCloseButton: true,
      onClose: () => console.log('unmounted'),
      onOpen: () => console.log('mounted'),
      autoClose: 15000,
      // position="top-center",
      title: 'Failed to ingest files',
      message: `Failed to ingest the following files: ${error_files.join(
        ', ',
      )}. Please shoot me an email: kvday2@illinois.edu.`,
      color: 'red',
      radius: 'lg',
      icon: <IconAlertCircle />,
      className: 'my-notification-class',
      style: { backgroundColor: '#15162c' },
      loading: false,
    })
  )
}
