import Head from 'next/head'
import {
  Title,
  Flex,
  Blockquote,
  Text,
  List,
  Tabs,
  Indicator,
} from '@mantine/core'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

import Navbar from './navbars/Navbar'
import EditCourseCard from '~/components/UIUC-Components/EditCourseCard'
import GlobalFooter from './GlobalFooter'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import { fetchPresignedUrl } from '~/utils/apiUtils'
import { DocGroupsTable } from './DocGroupsTable'
import { ProjectFilesTable } from './ProjectFilesTable'
import { IconInfoCircle } from '@tabler/icons-react'

import { CannotEditCourse } from './CannotEditCourse'
import { type CourseMetadata } from '~/types/courseMetadata'

const MakeOldCoursePage = ({
  course_name,
  metadata,
  current_email,
}: {
  course_name: string
  metadata: CourseMetadata
  current_email: string
}) => {
  // Check auth - https://clerk.com/docs/nextjs/read-session-and-user-data
  const [bannerUrl, setBannerUrl] = useState<string>('')
  const [tabValue, setTabValue] = useState<string | null>('success')
  const [failedCount, setFailedCount] = useState<number>(0)

  const router = useRouter()
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (metadata == null) {
          console.error('No metadata found for course')
          return
        }
        // fetch banner image url
        if (metadata?.banner_image_s3 && metadata.banner_image_s3 !== '') {
          console.log('Getting banner image: ', metadata.banner_image_s3)
          try {
            const url = await fetchPresignedUrl(metadata.banner_image_s3)
            setBannerUrl(url as string)
            console.log('Got banner image: ', url)
          } catch (error) {
            console.error('Error fetching banner image: ', error)
          }
        }
      } catch (error) {
        console.error(error)
        // alert('An error occurred while fetching course metadata. Please try again later.')
      }
    }

    fetchData()
  }, [metadata])

  // TODO: update this check to consider Admins & participants.
  if (
    metadata &&
    current_email !== (metadata.course_owner as string) &&
    metadata.course_admins.indexOf(current_email) === -1
  ) {
    router.replace(`/${course_name}/not_authorized`)

    return <CannotEditCourse course_name={course_name as string} />
  }

  return (
    <>
      <Navbar course_name={course_name} bannerUrl={bannerUrl} />

      <Head>
        <title>{course_name}</title>
        <meta
          name="description"
          content="The AI teaching assistant built for students at UIUC."
        />
        <link rel="icon" href="/favicon.ico" />
        {/* <Header /> */}
      </Head>
      <main className="course-page-main min-w-screen flex min-h-screen flex-col items-center">
        <div className="items-left flex w-full flex-col justify-center py-0">
          <Flex direction="column" align="center" w="100%">
            <EditCourseCard
              course_name={course_name}
              current_user_email={current_email}
              courseMetadata={metadata}
            />

            <div className="flex w-[85%] flex-col items-center justify-center pb-8 pt-8">
              {metadata && (
                <>
                  <Blockquote
                    color="blue"
                    icon={<IconInfoCircle />}
                    styles={{
                      root: {
                        background:
                          'linear-gradient(to right, rgba(106, 13, 173), rgba(80, 0, 220), rgba(0, 100, 255))',
                        // marginBottom: '20px',
                        borderRadius: '10px',
                        overflow: 'hidden',
                      },
                    }}
                  >
                    <Text
                      size="lg"
                      className={`label ${montserrat_paragraph.className} inline-block select-text p-0 text-neutral-200`}
                    >
                      {/* Introducing Document Groups */}
                      Exciting News: Document Groups Are Here!{' '}
                      <span style={{ fontSize: '22px' }}>🎉</span>
                    </Text>
                    <br></br>
                    <Text
                      className={`label ${montserrat_paragraph.className} inline-block select-text p-0 text-neutral-200`}
                      size={'md'}
                    >
                      Document Groups help you find what you need faster.
                      <br></br>
                      You can:
                    </Text>
                    <List>
                      <List.Item className="pl-4">
                        <Text
                          className={`label ${montserrat_paragraph.className} inline-block select-text p-0 text-neutral-200`}
                          size={'md'}
                        >
                          Organize documents into clear, manageable categories
                        </Text>
                      </List.Item>
                      <List.Item className="pl-4">
                        <Text
                          className={`label ${montserrat_paragraph.className} inline-block select-text p-0 text-neutral-200`}
                          size={'md'}
                        >
                          Enable and disable Document Groups to control what
                          your chatbot users see.
                        </Text>
                      </List.Item>
                      <List.Item className="pl-4">
                        <Text
                          className={`label ${montserrat_paragraph.className} inline-block select-text p-0 text-neutral-200`}
                          size={'md'}
                        >
                          Chat with subsets of your data using filters (coming
                          soon to the /chat page)
                        </Text>
                      </List.Item>
                    </List>
                    <Text
                      className={`label ${montserrat_paragraph.className} inline-block select-text p-0 text-neutral-200`}
                      size={'md'}
                    >
                      Try it out and start navigating huge projects with ease
                      and control <span style={{ fontSize: '22px' }}>🙌</span>
                    </Text>
                  </Blockquote>
                </>
              )}
            </div>
            {/* Course files header/background */}
            <div
              className="w-[90%] items-start rounded-2xl shadow-md shadow-purple-600"
              style={{ zIndex: 1, background: '#15162c' }}
            >
              <Flex direction="row" justify="space-between">
                <div className="flex flex-row items-start justify-start">
                  <Title
                    className={`${montserrat_heading.variable} font-montserratHeading`}
                    variant="gradient"
                    gradient={{
                      from: 'hsl(280,100%,70%)',
                      to: 'white',
                      deg: 185,
                    }}
                    order={3}
                    p="xl"
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    {' '}
                    Document Groups
                  </Title>
                </div>
              </Flex>
            </div>
            <div className="w-[85%] pb-8 pt-8">
              <DocGroupsTable course_name={course_name} />
            </div>

            <div
              className="w-[90%] items-start rounded-2xl shadow-md shadow-purple-600"
              style={{ zIndex: 1, background: '#15162c' }}
            >
              <Flex direction="row" justify="space-between">
                <div className="flex flex-row items-start justify-start">
                  <Title
                    className={`${montserrat_heading.variable} font-montserratHeading`}
                    variant="gradient"
                    gradient={{
                      from: 'hsl(280,100%,70%)',
                      to: 'white',
                      deg: 185,
                    }}
                    order={3}
                    p="xl"
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    {' '}
                    Document Groups
                  </Title>
                </div>
              </Flex>
            </div>
            <div className="flex w-[85%] max-w-full flex-col items-center justify-center pb-2 pt-8">
              {metadata && (
                <>
                  <Tabs
                    defaultValue="success"
                    value={tabValue}
                    onTabChange={setTabValue}
                    color="grape"
                    className="w-[100%] max-w-full"
                  >
                    <Tabs.List>
                      <Tabs.Tab value="success">Success</Tabs.Tab>

                      <Indicator
                        inline
                        disabled={!failedCount}
                        label={failedCount}
                        color="grape"
                        offset={6}
                        size={16}
                        className=" text-center"
                      >
                        <Tabs.Tab value="failed">Failed</Tabs.Tab>
                      </Indicator>
                    </Tabs.List>

                    <Tabs.Panel value="success" pt="xs">
                      <ProjectFilesTable
                        key="success"
                        course_name={course_name}
                        setFailedCount={setFailedCount}
                        tabValue={tabValue as string}
                      />
                    </Tabs.Panel>
                    <Tabs.Panel value="failed" pt="xs">
                      <ProjectFilesTable
                        key="failed"
                        course_name={course_name}
                        tabValue={tabValue as string}
                      />
                    </Tabs.Panel>
                  </Tabs>
                </>
              )}
            </div>
          </Flex>
        </div>
        <GlobalFooter />
      </main>
    </>
  )
}

export default MakeOldCoursePage
