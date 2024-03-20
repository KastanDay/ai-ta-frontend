import Head from 'next/head'
// import { DropzoneS3Upload } from '~/components/UIUC-Components/Upload_S3'
import {
  // Card,
  // Image,
  // Badge,
  // MantineProvider,
  // Button,
  // Group,
  // Stack,
  // createStyles,
  // FileInput,
  // rem,
  Title,
  Flex,
  createStyles,
  // Divider,
  MantineTheme,
  // TextInput,
  // Tooltip,
} from '@mantine/core'
// const rubik_puddles = Rubik_Puddles({ weight: '400', subsets: ['latin'] })
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/router'

import { useAuth, useUser } from '@clerk/nextjs'

export const GetCurrentPageName = () => {
  // /CS-125/materials --> CS-125
  return useRouter().asPath.slice(1).split('/')[0] as string
}

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
  // const { classes, } = useStyles()
  const { isLoaded, userId, sessionId, getToken } = useAuth() // Clerk Auth
  // const { isSignedIn, user } = useUser()
  const [bannerUrl, setBannerUrl] = useState<string>('')

  const router = useRouter()

  const currentPageName = GetCurrentPageName()

  // TODO: remove this hook... we should already have this from the /materials props???
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

    return <CannotEditCourse course_name={currentPageName as string} />
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
                    Project Files
                  </Title>
                </div>

                {/* Deprecated the upload button -- too much to maintain two buttons. */}
                {/* <div className="me-6 mt-4 flex flex-row items-end justify-end">
                  <DropzoneS3Upload
                    course_name={course_name}
                    redirect_to_gpt_4={false}
                    courseMetadata={courseMetadata}
                  />
                </div> */}
              </Flex>
              {/* NOMIC not bad, not great */}
              {/* <iframe className="nomic-iframe pl-20" id="iframe6a6ab0e4-06c0-41f6-8798-7891877373be" allow="clipboard-read; clipboard-write" src="https://atlas.nomic.ai/map/d5d9e9d2-6d86-47c1-98fc-9cccba688559/6a6ab0e4-06c0-41f6-8798-7891877373be"/> */}
            </div>
            <div className="flex w-[85%] flex-col items-center justify-center pb-2 pt-8">
              {metadata && <MantineYourMaterialsTable course_name={course_name} />}
              {/* This is the old table view */}
              {/* <MyTableView course_materials={course_data} /> */}

              {/* <CourseFilesList files={course_data} /> */}
            </div>
          </Flex>
        </div>
        <GlobalFooter />
      </main>
    </>
  )
}

import {
  IconAlertTriangle,
  IconCheck,
  IconDownload,
  IconLock,
} from '@tabler/icons-react'

import { CannotEditCourse } from './CannotEditCourse'
import { type CourseMetadata } from '~/types/courseMetadata'
// import { CannotViewCourse } from './CannotViewCourse'

interface CourseFile {
  name: string
  s3_path: string
  course_name: string
  readable_filename: string
  type: string
  url: string
  base_url: string
}

import { IconTrash } from '@tabler/icons-react'
import { MainPageBackground } from './MainPageBackground'
import { LoadingSpinner } from './LoadingSpinner'
import { extractEmailsFromClerk } from './clerkHelpers'
import Navbar from './navbars/Navbar'
import EditCourseCard from '~/components/UIUC-Components/EditCourseCard'
import { notifications } from '@mantine/notifications'
import GlobalFooter from './GlobalFooter'
import { montserrat_heading } from 'fonts'
import MyTableView from './YourMaterialsTable'
import { MantineYourMaterialsTable } from './MantineYourMaterialsTable'
import { fetchPresignedUrl } from '~/utils/apiUtils'
import { ProjectFilesTable } from './ProjectFilesTable'

// const CourseFilesList = ({ files }: CourseFilesListProps) => {
//   const router = useRouter()
//   const { classes, theme } = useStyles()
//   const handleDelete = async (
//     course_name: string,
//     s3_path: string,
//     url: string,
//   ) => {
//     try {
//       const API_URL = 'https://flask-production-751b.up.railway.app'
//       const response = await axios.delete(`${API_URL}/delete`, {
//         params: { course_name, s3_path, url },
//       })
//       // Handle successful deletion, show a success message
//       showToastOnFileDeleted(theme)
//       // Skip refreshing the page for now, for better UX let them click a bunch then manually refresh.
//       // await router.push(router.asPath)
//       await router.reload()
//     } catch (error) {
//       console.error(error)
//       // Show error message
//       showToastOnFileDeleted(theme, true)
//     }
//   }
// }

// return (
//   <div
//     className="mx-auto w-full justify-center rounded-md  bg-violet-100 p-5 shadow-md" // bg-violet-100
//     style={{ marginTop: '-1rem', backgroundColor: '#0F1116' }}
//   >
//     <ul role="list" className="grid grid-cols-2 gap-4">
//       {files.map((file, index) => (
//         <li
//           key={file.s3_path}
//           className="hover:shadow-xs flex items-center justify-between gap-x-6 rounded-xl bg-violet-300 py-4 pl-4 pr-1 transition duration-200 ease-in-out hover:bg-violet-200 hover:shadow-violet-200"
//           onMouseEnter={(e) => {
//             // Removed this because it causes the UI to jump around on mouse enter.
//             // e.currentTarget.style.border = 'solid 1.5px'
//             e.currentTarget.style.borderColor = theme.colors.violet[8]
//           }}
//           onMouseLeave={(e) => {
//             // e.currentTarget.style.border = 'solid 1.5px'
//           }}
//         >
//           {/* Conditionally show link in small text if exists */}
//           {file.url ? (
//             <div
//               className="min-w-0 flex-auto"
//               style={{
//                 maxWidth: '100%',
//                 overflow: 'hidden',
//                 textOverflow: 'ellipsis',
//                 whiteSpace: 'nowrap',
//               }}
//             >
//               <a href={file.url} target="_blank" rel="noopener noreferrer">
//                 <p className="truncate text-xl font-semibold leading-6 text-gray-800">
//                   {file.readable_filename}
//                 </p>
//                 <p className="mt-1 truncate text-xs leading-5 text-gray-600">
//                   {file.url || ''}
//                 </p>
//               </a>
//             </div>
//           ) : (
//             <div
//               className="min-w-0 flex-auto"
//               style={{
//                 maxWidth: '80%',
//                 overflow: 'hidden',
//                 textOverflow: 'ellipsis',
//                 whiteSpace: 'nowrap',
//               }}
//             >
//               <p className="text-xl font-semibold leading-6 text-gray-800">
//                 {file.readable_filename}
//               </p>
//               {/* SMALL LOWER TEXT FOR FILES IN LIST */}
//               {/* <p className="mt-1 truncate text-xs leading-5 text-gray-600">
//                 {file.course_name}
//               </p> */}
//             </div>
//           )}
//           <div className="me-4 flex justify-end space-x-2">
//             {/* Download button */}
//             <button
//               onClick={() =>
//                 fetchPresignedUrl(file.s3_path).then((url) => {
//                   window.open(url, '_blank')
//                 })
//               }
//               className="btn-circle btn cursor-pointer items-center justify-center border-0 bg-transparent transition duration-200 ease-in-out"
//               // style={{ outline: 'solid 1px', outlineColor: 'white' }}
//               onMouseEnter={(e) => {
//                 e.currentTarget.style.backgroundColor = theme.colors.grape[8]
//                   ; (e.currentTarget.children[0] as HTMLElement).style.color =
//                     theme.colorScheme === 'dark'
//                       ? theme.colors.gray[2]
//                       : theme.colors.gray[1]
//               }}
//               onMouseLeave={(e) => {
//                 e.currentTarget.style.backgroundColor = 'transparent'
//                   ; (e.currentTarget.children[0] as HTMLElement).style.color =
//                     theme.colors.gray[8]
//               }}
//             >
//               <IconDownload className="h-5 w-5 text-gray-800" />
//             </button>
//             {/* Delete button */}
//             <button
//               onClick={() =>
//                 handleDelete(
//                   file.course_name as string,
//                   file.s3_path as string,
//                   file.url as string,
//                 )
//               }
//               className="btn-circle btn cursor-pointer items-center justify-center border-0 bg-transparent transition duration-200 ease-in-out"
//               // style={{ outline: 'solid 1px', outlineColor: theme.white }}
//               onMouseEnter={(e) => {
//                 e.currentTarget.style.backgroundColor = theme.colors.grape[8]
//                   ; (e.currentTarget.children[0] as HTMLElement).style.color =
//                     theme.colorScheme === 'dark'
//                       ? theme.colors.gray[2]
//                       : theme.colors.gray[1]
//               }}
//               onMouseLeave={(e) => {
//                 e.currentTarget.style.backgroundColor = 'transparent'
//                   ; (e.currentTarget.children[0] as HTMLElement).style.color =
//                     theme.colors.red[6]
//               }}
//             >
//               <IconTrash className="h-5 w-5 text-red-600" />
//             </button>
//           </div>
//         </li>
//       ))}
//     </ul>
//   </div>
// )
// }

export const showToastOnFileDeleted = (
  theme: MantineTheme,
  was_error = false,
) => {
  return (
    // docs: https://mantine.dev/others/notifications/
    notifications.show({
      id: 'file-deleted-from-materials',
      withCloseButton: true,
      onClose: () => console.log('unmounted'),
      onOpen: () => console.log('mounted'),
      autoClose: 12000,
      // position="top-center",
      title: was_error ? 'Error deleting file' : 'Deleting file...',
      message: was_error
        ? "An error occurred while deleting the file. Please try again and I'd be so grateful if you email kvday2@illinois.edu to report this bug."
        : 'The file is being deleted in the background. Refresh the page to see the changes.',
      icon: was_error ? <IconAlertTriangle /> : <IconCheck />,
      styles: {
        root: {
          backgroundColor: theme.colors.nearlyWhite,
          borderColor: was_error
            ? theme.colors.errorBorder
            : theme.colors.aiPurple,
        },
        title: {
          color: theme.colors.nearlyBlack,
        },
        description: {
          color: theme.colors.nearlyBlack,
        },
        closeButton: {
          color: theme.colors.nearlyBlack,
          '&:hover': {
            backgroundColor: theme.colors.dark[1],
          },
        },
        icon: {
          backgroundColor: was_error
            ? theme.colors.errorBackground
            : theme.colors.successBackground,
          padding: '4px',
        },
      },
      loading: false,
    })
  )
}
export default MakeOldCoursePage