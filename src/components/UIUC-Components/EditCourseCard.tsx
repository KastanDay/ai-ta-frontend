import React, { useEffect, useState } from 'react'
import {
  Card,
  Text,
  Flex,
  Group,
  Checkbox,
  Title,
  type CheckboxProps, Paper, Input, Button,
} from '@mantine/core'
import {IconLock, IconQuestionMark} from '@tabler/icons-react'
import { type CourseMetadata } from '~/types/courseMetadata'
import LargeDropzone from './LargeDropzone'
import EmailChipsComponent from './EmailChipsComponent'
import { useMediaQuery } from '@mantine/hooks'
import { Montserrat } from 'next/font/google'
import { callUpsertCourseMetadata } from '~/pages/api/UIUC-api/upsertCourseMetadata'
import { GetCurrentPageName } from './CanViewOnlyCourse'
import { useRouter } from 'next/router'
import {LoadingSpinner} from "~/components/UIUC-Components/LoadingSpinner";
import axios from "axios";

const montserrat = Montserrat({
  weight: '700',
  subsets: ['latin'],
})

const validateUrl = (url:string) => {
  const courseraRegex = /^https?:\/\/(www\.)?coursera\.org\/learn\/.+/;
  const mitRegex = /^https?:\/\/ocw\.mit\.edu\/.+/;
  const webScrapingRegex = /^https?:\/\/.+/;

  return courseraRegex.test(url) || mitRegex.test(url) || webScrapingRegex.test(url);
};

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
  const [isUrlUpdated, setIsUrlUpdated] = useState(false);
  const [url, setUrl] = useState('');
  const [icon, setIcon] = useState(<IconQuestionMark size={'50%'}/>);
  const [loadinSpinner, setLoadinSpinner] = useState(false);
  const API_URL = 'https://flask-production-751b.up.railway.app';

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    console.log("newUrl: ", newUrl)
    setUrl(newUrl);
    if (newUrl.length > 0 && validateUrl(newUrl)) {
        setIsUrlUpdated(true);
    } else {
        setIsUrlUpdated(false);
    }
    // Change icon based on URL
    if (newUrl.includes('coursera.org')) {
      setIcon(<img src={'/media/coursera_logo_cutout.png'} alt="Coursera Logo" style={{height: '50%', width: '50%'}}/>);
    } else if (newUrl.includes('ocw.mit.edu')) {
      setIcon(<img src={'/media/mitocw_logo.jpg'} alt="MIT OCW Logo" style={{height: '50%', width: '50%'}} />);
    } else {
      setIcon(<IconQuestionMark />);
    }

  };

  const handleSubmit = async () => {
    if (validateUrl(url)) {
      setLoadinSpinner(true);
      let data = null;
      // Make API call based on URL
      if (url.includes('coursera.org')) {
        // Coursera API call
      } else if (url.includes('ocw.mit.edu')) {
        // MIT API call
        data = await downloadMITCourse(url, courseName, 'local_dir');
        console.log(data);

      } else {
        // Other API call
        // Move hardcoded values to KV database - any global data structure available?
        data = await scrapeWeb(url, courseName, 5, 1, 200);
      }
      console.log(data);
      if (data?.success) {
        alert('Successfully scraped course!');
        await router.push(`/${courseName}/gpt4`);
      }
    } else {
      alert('Invalid URL');
    }
    setLoadinSpinner(false);
  };

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
    if (url && url.length > 0 && validateUrl(url)) {
      console.log("url updated : ", url)
      setIsUrlUpdated(true);
    } else {
      console.log("url empty")
      setIsUrlUpdated(false);
    }
  }, [url]);

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

  const scrapeWeb = async (url: string | null, courseName: string | null, maxUrls: number, maxDepth: number, timeout: number) => {
    try {
      if (!url || !courseName) return null;
      const response = await axios.get(`${API_URL}/web-scrape`, {
        params: {
          url: encodeURIComponent(url),
          course_name: courseName,
          max_urls: maxUrls,
          max_depth: maxDepth,
          timeout: timeout,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error during web scraping:', error);
      return null;
    }
  };

  const downloadMITCourse = async (url: string | null, courseName: string | null, localDir: string | null) => {
    try {
      if (!url || !courseName || !localDir) return null;
      console.log("calling downloadMITCourse")
      const response = await axios.get(`${API_URL}/mit-download`, {
        params: {
          url: encodeURIComponent(url),
          course_name: courseName,
          local_dir: localDir,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error during MIT course download:', error);
      return null;
    }
  };

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
              {!is_new_course ? `${courseName}` : 'Create your own course'}
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
                className={`input-bordered input w-[70%] rounded-lg border-2 border-solid bg-gray-800 lg:w-[50%] 
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
            <Flex direction={'column'} align={'center'} w={'100%'}>
              {is_new_course && (
                  <Input
                      icon={icon}
                      className="w-[70%] lg:w-[50%]"
                      placeholder="Enter URL"
                      radius={'xl'}
                      value={url}
                      size={'lg'}
                      onChange={(e) => {
                        setUrl(e.target.value);
                        // Change icon based on URL
                        if (e.target.value.includes('coursera.org')) {
                          setIcon(<img src={'/media/coursera_logo_cutout.png'} alt="Coursera Logo"
                                       style={{height: '50%', width: '50%'}}/>);
                        } else if (e.target.value.includes('ocw.mit.edu')) {
                          setIcon(<img src={'/media/mitocw_logo.jpg'} alt="MIT OCW Logo"
                                       style={{height: '50%', width: '50%'}}/>);
                        } else {
                          setIcon(<IconQuestionMark/>);
                        }
                      }}
                      rightSection={
                        <Button onClick={handleSubmit}
                                size="md"
                                className={`rounded-e-3xl rounded-s-md ${isUrlUpdated ? 'bg-purple-800' : 'border-purple-800'} text-white hover:bg-indigo-600 hover:border-indigo-600 hover:text-white text-ellipsis overflow-ellipsis p-2`}
                                w={`${isSmallScreen ? '90%' : '95%'}}`}
                        >
                          Ingest
                        </Button>
                      }
                      rightSectionWidth={isSmallScreen ? '25%' : '20%'}
                  />
              )}
              <div className={'flex flex-row items-center'}>
                {loadinSpinner &&  (<>
                    <LoadingSpinner size={'sm'}/>
                    <Title order={4}>Please wait while the course gets ingested...</Title>
                    </>
                )}
              </div>
            <LargeDropzone
              course_name={courseName}
              current_user_email={current_user_email}
              redirect_to_gpt_4={false}
              isDisabled={
                is_new_course && (!isCourseAvailable || courseName === '')
              }
              courseMetadata={courseMetadata as CourseMetadata}
            />
            </Flex>
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
                  courseMetadata={courseMetadata as CourseMetadata}
                  // course_intro_message={
                  //   courseMetadata?.course_intro_message || ''
                  // }
                  // is_private={courseMetadata?.is_private || false}
                  // banner_image_s3={courseBannerUrl}
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
                                 courseMetadata
                               }: {
  course_name: string,
  current_user_email: string,
  courseMetadata: CourseMetadata
}) => {
  const [isPrivate, setIsPrivate] = useState(courseMetadata.is_private)
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
          course_intro_message={courseMetadata.course_intro_message || ''}
          banner_image_s3={courseMetadata.banner_image_s3 || ''}
        />
      )}
    </>
  )
}

export default EditCourseCard
