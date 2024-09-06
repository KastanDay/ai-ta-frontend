import Head from 'next/head'
import React, { useEffect, useState } from 'react'

import EditCourseCard from '~/components/UIUC-Components/EditCourseCard'
import Navbar from './navbars/Navbar'
import { Button, Card, Flex, Group, Textarea, TextInput, Title } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import router from 'next/router'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import createProject from '~/pages/api/UIUC-api/createProject'
import { callSetCourseMetadata } from '~/utils/apiUtils'
import { CourseMetadata } from '~/types/courseMetadata'

const MakeNewCoursePage = ({
  project_name,
  current_user_email,
  is_new_course = true,
  project_description,
}: {
  project_name: string
  current_user_email: string
  is_new_course?: boolean
  project_description?: string
}) => {
  const isSmallScreen = useMediaQuery('(max-width: 960px)')
  const [projectName, setProjectName] = useState(project_name || '')
  const [projectDescription, setProjectDescription] = useState(project_description || '')
  const [isCourseAvailable, setIsCourseAvailable] = useState<
    boolean | undefined
  >(undefined)
  const [allExistingCourseNames, setAllExistingCourseNames] = useState<
    string[]
  >([])
  const checkCourseAvailability = () => {
    const courseExists =
      projectName != '' &&
      allExistingCourseNames &&
      allExistingCourseNames.includes(projectName)
    setIsCourseAvailable(!courseExists)
  }
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
          setAllExistingCourseNames(result)
        })
        .catch((error) => {
          console.error(error)
        })
    }
  }, [])

  useEffect(() => {
    checkCourseAvailability()
  }, [projectName])

  const handleSubmit = async (project_name: string, project_description: string | undefined, current_user_email: string) => {
    try {
      const result = await createProject(project_name, project_description, current_user_email)
      console.log('Project created successfully:', result)
      if (is_new_course) {
        await router.push(`/${projectName}/materials`)
        return
      }
    } catch (error) {
      console.error('Error creating project:', error)
    }
  }

  return (
    <>
      <Navbar isPlain={true} />
      <Head>
        <title>{project_name}</title>
        <meta name="description" content="Create a new project on UIUC.chat." />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main
        className="course-page-main"
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'start',
          minHeight: '100vh',
          padding: '1rem',
        }}
      >
        <Card
          shadow="xs"
          padding="none"
          radius="xl"
          // style={{ maxWidth: '85%', width: '100%', marginTop: '4%' }}
          className="mt-[4%] w-[96%] md:w-[90%] 2xl:w-[75%]"
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
                // spacing="lg"
                m="3rem"
                align="center"
                style={{ justifyContent: 'center' }}
              >
                <Flex direction="column" gap="md" w={isSmallScreen ? '80%' : '60%'}>
                  <Title
                    order={2}
                    variant="gradient"
                    gradient={{ from: 'gold', to: 'white', deg: 50 }}
                    className={`${montserrat_heading.variable} font-montserratHeading text-center`}
                  >
                    {!is_new_course ? `${projectName}` : 'Create a new project'}
                  </Title>
                  {/* {is_new_course && ( */}
                  {/* <> */}

                  <TextInput
                    // icon={icon}
                    // className={`mt-4 w-[80%] min-w-[20rem] disabled:bg-purple-200 lg:w-[75%]`}
                    styles={{
                      input: {
                        backgroundColor: '#1A1B1E',
                        paddingRight: '6rem', // Adjust right padding to prevent text from hiding behind the button
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        color: isCourseAvailable && projectName != '' ? 'green' : 'red',
                        '&:focus-within': {
                          borderColor: isCourseAvailable && projectName !== '' ? 'green' : 'red',
                        },
                        fontSize: '16px', // Added text styling
                        font: `${montserrat_paragraph.variable} font-montserratParagraph`,
                      },
                      label: {
                        fontWeight: 'bold',
                        fontSize: '20px',
                        color: 'white',
                        marginBottom: '1rem',
                      }
                    }}
                    placeholder="Project name"
                    radius={'lg'}
                    type="text"
                    value={projectName}
                    label="What is the project name?"
                    size={'lg'}
                    disabled={!is_new_course
                    }
                    onChange={(e) => setProjectName(e.target.value.replaceAll(' ', '-'))}
                    autoFocus
                    withAsterisk
                    className={`${montserrat_paragraph.variable} font-montserratParagraph`}
                    //               className={`input-bordered input w-[70%] rounded-lg border-2 border-solid bg-gray-800 lg:w-[50%] 
                    // ${isCourseAvailable && courseName != ''
                    //                   ? 'border-2 border-green-500 text-green-500 focus:border-green-500'
                    //                   : 'border-red-800 text-red-600 focus:border-red-800'
                    //                 } ${montserrat_paragraph.variable} font-montserratParagraph`}

                    rightSectionWidth={isSmallScreen ? 'auto' : 'auto'}
                  />
                  <Flex justify="space-between" align="center">
                    <label className={`${montserrat_paragraph.variable} font-montserratParagraph font-bold mt-4`} style={{ fontSize: '20px' }}>
                      What do you want to achieve?
                    </label>
                    <label className={`${montserrat_paragraph.variable} font-montserratParagraph text-gray-400 font-bold mt-4`}>
                      Optional
                    </label>
                  </Flex>
                  <Textarea
                    placeholder="Describe your project, goals, expected impact etc..."
                    radius={'lg'}
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    size={'lg'}
                    minRows={4}
                    styles={{
                      input: {
                        backgroundColor: '#1A1B1E',
                        fontSize: '16px', // Added text styling
                        font: `${montserrat_paragraph.variable} font-montserratParagraph`,
                      },
                      label: {
                        fontWeight: 'bold',
                        color: 'white',
                      }
                    }}
                    className={`${montserrat_paragraph.variable} font-montserratParagraph`}

                  />
                  <Flex direction={'row'}>
                    <Title
                      order={4}
                      className={`w-full pr-2 text-right pr-7 ${montserrat_paragraph.variable} mt-2 font-montserratParagraph`}
                    >
                      Next: let&apos;s upload some documents
                      {/* </> */}
                    </Title>
                    <Button
                      onClick={(e) => {
                        handleSubmit(projectName, projectDescription, current_user_email);
                      }}
                      size="md"
                      radius={'sm'}
                      className={`${isCourseAvailable && projectName !== '' ? 'bg-purple-800' : 'border-purple-800'}
                       overflow-ellipsis text-ellipsis p-2 ${isCourseAvailable && projectName !== '' ? 'text-white' : 'text-gray-500'}
                        min-w-[5rem] transform hover:border-indigo-600 hover:bg-indigo-600 hover:text-white focus:shadow-none focus:outline-none`}
                      w={`${isSmallScreen ? '40%' : '20%'}`}
                      style={{
                        alignSelf: 'flex-end',
                      }}
                      disabled={projectName === ''}
                    >
                      Create
                    </Button>
                  </Flex>
                </Flex>
              </Group>
            </div>
          </Flex>
        </Card>
        {/* )} */}
      </main>
    </>
  )
}

export default MakeNewCoursePage
