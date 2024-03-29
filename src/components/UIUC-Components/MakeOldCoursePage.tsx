import Head from 'next/head'
import { Title, Flex, Blockquote, Text } from '@mantine/core'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

// import { useAuth } from '@clerk/nextjs'
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

            {/* Course files header/background */}
            <div
              className="mx-auto mt-[2%] w-[90%] items-start rounded-2xl shadow-md shadow-purple-600"
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
              {/* NOMIC not bad, not great */}
              {/* <iframe className="nomic-iframe pl-20" id="iframe6a6ab0e4-06c0-41f6-8798-7891877373be" allow="clipboard-read; clipboard-write" src="https://atlas.nomic.ai/map/d5d9e9d2-6d86-47c1-98fc-9cccba688559/6a6ab0e4-06c0-41f6-8798-7891877373be"/> */}
            </div>
            <div className="flex w-[85%] flex-col items-center justify-center pb-2 pt-8">
              {metadata && (
                <>
                  <Blockquote
                    color="blue"
                    icon={<IconInfoCircle />}
                    styles={{
                      root: {
                        background:
                          'linear-gradient(to right, rgba(106, 13, 173), rgba(80, 0, 220), rgba(0, 100, 255))',
                        marginBottom: '20px',
                        borderRadius: '10px',
                        overflow: 'hidden',
                      },
                    }}
                  >
                    <Text
                      size="lg"
                      className={`label ${montserrat_paragraph.className} inline-block p-0 text-neutral-200`}
                    >
                      Introducing Document Groups
                    </Text>
                    <Text
                      className={`label ${montserrat_paragraph.className} inline-block p-0 text-neutral-200`}
                      size={'md'}
                    >
                      To enhance organization and efficiency, we&apos;ve
                      introduced Document Groups. This feature allows admins and
                      project owners to categorize a large list of documents
                      into smaller, manageable groups. It offers more control
                      over document management for admins while simplifying the
                      process for users to find relevant information quickly.
                      Document Groups can be used as a filtering criterion
                      during retrieval, aiding navigation through large volumes
                      of documents.
                    </Text>
                    <Text
                      className={`label ${montserrat_paragraph.className} inline-block p-0 text-neutral-200`}
                      size={'md'}
                    >
                      Admins and owners have the flexibility to enable or
                      disable these groups, tailoring the feature to their
                      specific needs, ensuring users benefit from an organized
                      and streamlined document retrieval process that improves
                      their ability to access and utilize information
                      effectively.
                    </Text>
                  </Blockquote>
                  <DocGroupsTable course_name={course_name} />
                </>
              )}
            </div>
            <div
              className="mx-auto mt-[2%] w-[90%] items-start rounded-2xl shadow-md shadow-purple-600"
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
                    Project Files
                  </Title>
                </div>
              </Flex>
            </div>
            <div className="flex w-[85%] flex-col items-center justify-center pb-2 pt-8">
              {metadata && (
                <>
                  <ProjectFilesTable course_name={course_name} />
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
