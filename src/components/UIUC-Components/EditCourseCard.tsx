import React, { useEffect, useState } from 'react'
import {
  Card,
  Text,
  Flex,
  Group,
  Checkbox,
  Title,
  type CheckboxProps,
} from '@mantine/core'
import { IconLock } from '@tabler/icons-react'
import { type CourseMetadata } from '~/types/courseMetadata'
import LargeDropzone from './LargeDropzone'
import EmailChipsComponent from './EmailChipsComponent'
import { useMediaQuery } from '@mantine/hooks'
import { Montserrat } from 'next/font/google'
import { callUpsertCourseMetadata } from '~/pages/api/UIUC-api/upsertCourseMetadata'
import { GetCurrentPageName } from './CanViewOnlyCourse'
import { useRouter } from 'next/router'

const montserrat = Montserrat({
  weight: '700',
  subsets: ['latin'],
})

const EditCourseCard = ({
  course_name,
  current_user_email,
  is_new_course = false,
  courseMetadata,
}: {
  course_name: string
  current_user_email: string
  is_new_course?: boolean
  courseMetadata?: CourseMetadata
}) => {
  const [introMessage, setIntroMessage] = useState('')
  const [courseName, setCourseName] = useState(course_name || '')
  const [isCourseAvailable, setIsCourseAvailable] = useState<
    boolean | undefined
  >(undefined)
  const [allExistingCourseNames, setAllExistingCourseNames] = useState<
    string[]
  >([])
  const isSmallScreen = useMediaQuery('(max-width: 960px)')
  const [courseBannerUrl, setCourseBannerUrl] = useState('')
  const [isIntroMessageUpdated, setIsIntroMessageUpdated] = useState(false)

  const checkCourseAvailability = () => {
    const courseExists =
      courseName != '' &&
      allExistingCourseNames &&
      allExistingCourseNames.includes(courseName)
    setIsCourseAvailable(!courseExists)
  }

  const router = useRouter()
  const checkIfNewCoursePage = () => {
    // `/new` --> `new`
    // `/new?course_name=mycourse` --> `new`
    return router.asPath.split('/')[1]?.split('?')[0] as string
  }

  useEffect(() => {
    // only run when creating new courses.. otherwise VERY wasteful on DB.
    if (checkIfNewCoursePage() == 'new') {
      async function fetchGetAllCourseNames() {
        const response = await fetch(`/api/UIUC-api/getAllCourseNames`)

        if (response.ok) {
          const data = await response.json()
          return data.all_course_names
        } else {
          console.error(`Error fetching course metadata: ${response.status}`)
          return null
        }
      }

      fetchGetAllCourseNames()
        .then((result) => {
          console.log('Running getAllCourseNames()', result)
          setAllExistingCourseNames(result)
        })
        .catch((error) => {
          console.error(error)
        })
    }
  }, [])

  useEffect(() => {
    checkCourseAvailability()
  }, [courseName])

  useEffect(() => {
    setIntroMessage(courseMetadata?.course_intro_message || '')
  }, [courseMetadata])

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

      console.log(file.name + 'uploaded to S3 successfully!!')
      return data.post.fields.key
    } catch (error) {
      console.error('Error uploading file:', error)
    }
  }

  return (
    <Card
      shadow="xs"
      padding="none"
      radius="xl"
      style={{ maxWidth: '85%', width: '100%', marginTop: '4%' }}
    >
      <Flex direction={isSmallScreen ? 'column' : 'row'}>
        <div
          style={{
            flex: isSmallScreen ? '1 1 100%' : '1 1 60%',
            border: 'None',
            color: 'white',
          }}
          className="min-h-full bg-gradient-to-r from-purple-900 via-indigo-800 to-blue-800"
        >
          <Group
            variant="row"
            spacing="lg"
            m="3rem"
            align="center"
            style={{ justifyContent: 'center' }}
          >
            <Title
              order={2}
              variant="gradient"
              gradient={{ from: 'gold', to: 'white', deg: 50 }}
              className={montserrat.className}
            >
              {!is_new_course ? `${courseName}` : 'Chat with your documents'}
            </Title>
            {is_new_course && (
              <input
                type="text"
                placeholder="Project name"
                value={courseName}
                onChange={(e) =>
                  setCourseName(e.target.value.replaceAll(' ', '-'))
                }
                disabled={!is_new_course}
                className={`input-bordered input w-[80%] rounded-lg border-2 border-solid bg-gray-800 lg:w-[50%] 
                                ${
                                  isCourseAvailable && courseName != ''
                                    ? 'border-2 border-green-500 text-green-500 focus:border-green-500'
                                    : 'border-red-800 text-red-600 focus:border-red-800'
                                } ${montserrat.className}`}
              />
            )}
            <Title
              order={4}
              className={`w-full text-center ${montserrat.className}`}
            >
              Just one step: upload any and all materials. More is better,
              it&apos;s fine if they&apos;re messy.
            </Title>
            <LargeDropzone
              course_name={courseName}
              current_user_email={current_user_email}
              redirect_to_gpt_4={false}
              isDisabled={
                is_new_course && (!isCourseAvailable || courseName === '')
              }
            />
          </Group>
        </div>
        {!is_new_course && (
          <div
            style={{
              flex: isSmallScreen ? '1 1 100%' : '1 1 40%',
              padding: '1rem',
              backgroundColor: '#15162c',
              color: 'white',
            }}
          >
            <div className="card flex h-full flex-col justify-center">
              <div className="card-body">
                <div className="form-control relative">
                  <label className={`label ${montserrat.className}`}>
                    <span className="label-text text-lg text-neutral-200">
                      Introductory Message
                    </span>
                  </label>
                  <textarea
                    rows={5}
                    placeholder="Enter the introductory message of the chatbot"
                    className={`textarea-bordered textarea w-full border-2 border-violet-800 bg-white text-black hover:border-violet-800 ${montserrat.className}`}
                    value={introMessage}
                    onChange={(e) => {
                      setIntroMessage(e.target.value)
                      setIsIntroMessageUpdated(true)
                    }}
                  />
                  {isIntroMessageUpdated && (
                    <>
                      <button
                        className="btn-outline btn absolute bottom-0 right-0 m-1 h-[2%] rounded-3xl border-violet-800 py-1 text-violet-800  hover:bg-violet-800 hover:text-white"
                        onClick={async () => {
                          setIsIntroMessageUpdated(false)
                          if (courseMetadata) {
                            courseMetadata.course_intro_message = introMessage
                            await callUpsertCourseMetadata(
                              course_name,
                              courseMetadata,
                            ) // Update the courseMetadata object
                          }
                        }}
                      >
                        Submit
                      </button>
                    </>
                  )}
                </div>
                <div className="form-control mt-4">
                  <label className={`label ${montserrat.className}`}>
                    <span className="label-text text-lg text-neutral-200">
                      Upload Banner
                    </span>
                  </label>
                  <input
                    type="file"
                    className={`file-input-bordered file-input w-full border-violet-800 bg-violet-800 text-white  shadow-inner hover:border-violet-600 hover:bg-violet-800 ${montserrat.className}`}
                    onChange={async (e) => {
                      // Assuming the file is converted to a URL somewhere else
                      setCourseBannerUrl(e.target.value)
                      if (e.target.files?.length) {
                        console.log('Uploading to s3')
                        const banner_s3_image = await uploadToS3(
                          e.target.files?.[0] ?? null,
                        )
                        if (banner_s3_image && courseMetadata) {
                          courseMetadata.banner_image_s3 = banner_s3_image
                          await callUpsertCourseMetadata(
                            course_name,
                            courseMetadata,
                          ).then(() => setCourseBannerUrl(banner_s3_image)) // Update the courseMetadata object
                        }
                      }
                    }}
                  />
                </div>
                <PrivateOrPublicCourse
                  course_name={course_name}
                  current_user_email={current_user_email}
                  course_intro_message={
                    courseMetadata?.course_intro_message || ''
                  }
                  is_private={courseMetadata?.is_private || false}
                  banner_image_s3={courseBannerUrl}
                />
              </div>
            </div>
          </div>
        )}
      </Flex>
    </Card>
  )
}

const PrivateOrPublicCourse = ({
  course_name,
  current_user_email,
  course_intro_message,
  banner_image_s3,
  is_private,
}: {
  course_name: string
  current_user_email: string
  course_intro_message: string
  banner_image_s3: string
  is_private: boolean
}) => {
  const [isPrivate, setIsPrivate] = useState(is_private)
  // const { user, isSignedIn, isLoaded } = useUser()
  // const user_emails = extractEmailsFromClerk(user)
  // console.log("in MakeNewCoursePage.tsx user email list: ", user_emails )

  const CheckboxIcon: CheckboxProps['icon'] = ({ indeterminate, className }) =>
    indeterminate ? (
      <IconLock className={className} />
    ) : (
      <IconLock className={className} />
    )

  const handleCheckboxChange = () => {
    const callSetCoursePublicOrPrivate = async (
      course_name: string,
      is_private: boolean,
    ) => {
      try {
        const url = new URL(
          '/api/UIUC-api/setCoursePublicOrPrivate',
          window.location.origin,
        )
        url.searchParams.append('course_name', course_name)
        url.searchParams.append('is_private', String(is_private))

        const response = await fetch(url.toString(), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        const data = await response.json()
        return data.success
      } catch (error) {
        console.error(
          'Error changing course from public to private (or vice versa):',
          error,
        )
        return false
      }
    }

    setIsPrivate(!isPrivate) // react gui
    callSetCoursePublicOrPrivate(course_name, !isPrivate) // db
  }

  const callSetCourseMetadata = async (
    courseMetadata: CourseMetadata,
    course_name: string,
  ) => {
    try {
      const {
        is_private,
        course_owner,
        course_admins,
        approved_emails_list,
        course_intro_message,
        banner_image_s3,
      } = courseMetadata

      console.log(
        'IN callSetCourseMetadata in MakeNewCoursePage: ',
        courseMetadata,
      )

      const url = new URL(
        '/api/UIUC-api/setCourseMetadata',
        window.location.origin,
      )

      url.searchParams.append('is_private', String(is_private))
      url.searchParams.append('course_name', course_name)
      url.searchParams.append('course_owner', course_owner)
      url.searchParams.append(
        'course_intro_message',
        course_intro_message || '',
      )
      url.searchParams.append('banner_image_s3', banner_image_s3 || '')
      url.searchParams.append('course_admins', JSON.stringify(course_admins))
      url.searchParams.append(
        'approved_emails_list',
        JSON.stringify(approved_emails_list),
      )

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error setting course metadata:', error)
      return false
    }
  }

  const handleEmailAddressesChange = (
    new_course_metadata: CourseMetadata,
    course_name: string,
  ) => {
    console.log('Fresh course metadata:', new_course_metadata)
    callSetCourseMetadata(
      {
        ...new_course_metadata,
      },
      course_name,
    )
  }

  return (
    <>
      <Title
        className={montserrat.className}
        variant="gradient"
        gradient={{ from: 'gold', to: 'white', deg: 50 }}
        order={2}
        p="xl"
        style={{ marginTop: '4rem', alignSelf: 'center' }}
      >
        {' '}
        Course Visibility{' '}
      </Title>
      <Group className="p-3">
        <Checkbox
          label={`Course is ${
            isPrivate ? 'private' : 'public'
          }. Click to change.`}
          // description="Course is private by default."
          aria-label="Checkbox to toggle Course being public or private. Private requires a list of allowed email addresses."
          className={montserrat.className}
          // style={{ marginTop: '4rem' }}
          size="xl"
          // bg='#020307'
          color="grape"
          icon={CheckboxIcon}
          defaultChecked={isPrivate}
          onChange={handleCheckboxChange}
        />
      </Group>
      {/* </Group>
      <Group className="p-3"> */}

      <Text>
        Only the below email address are able to access the content. Read our
        strict security policy (in progress).
      </Text>
      {isPrivate && (
        <EmailChipsComponent
          course_owner={current_user_email}
          course_admins={[]} // TODO: add admin functionality
          course_name={course_name}
          is_private={isPrivate}
          onEmailAddressesChange={handleEmailAddressesChange}
          course_intro_message={course_intro_message}
          banner_image_s3={banner_image_s3}
        />
      )}
    </>
  )
}

export default EditCourseCard
