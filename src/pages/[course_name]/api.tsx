// src/pages/[course_name]/api.tsx
import { NextPage } from 'next'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { get_user_permission } from '~/components/UIUC-Components/runAuthCheck'
import { MainPageBackground } from '~/components/UIUC-Components/MainPageBackground'
import { LoadingSpinner } from '~/components/UIUC-Components/LoadingSpinner'
import ApiKeyManagement from '~/components/UIUC-Components/ApiKeyManagament'
import { CourseMetadata } from '~/types/courseMetadata'
import { fetchCourseMetadata } from '~/utils/apiUtils'
import { Flex } from '@mantine/core'
import Navbar from '~/components/UIUC-Components/navbars/Navbar'

export const GetCurrentPageName = () => {
  // /CS-125/materials --> CS-125
  return useRouter().asPath.slice(1).split('/')[0] as string
}

const ApiPage: NextPage = () => {
  const router = useRouter()
  const user = useUser()
  const [courseMetadata, setCourseMetadata] = useState<CourseMetadata | null>(
    null,
  )
  const [isLoading, setIsLoading] = useState(true)
  const course_name = GetCurrentPageName() as string

  // First useEffect to fetch course metadata
  useEffect(() => {
    if (!router.isReady || !course_name) {
      return
    }

    const fetchMetadata = async () => {
      setIsLoading(true)
      try {
        const metadata: CourseMetadata = await fetchCourseMetadata(course_name)
        setCourseMetadata(metadata)

        if (metadata === null) {
          await router.push('/new?course_name=' + course_name)
          return
        }
      } catch (error) {
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMetadata()
  }, [course_name, router.isReady])

  // Second useEffect to handle permissions and other dependent data
  useEffect(() => {
    if (isLoading || !user.isLoaded) {
      // Do not proceed if we are still loading or if the user data is not loaded yet.
      return
    }

    const handlePermissionsAndData = async () => {
      try {
        if (!courseMetadata || !user.isLoaded) {
          return
        }

        const permission_str = get_user_permission(courseMetadata, user, router)

        if (permission_str !== 'edit') {
          console.log(
            'User does not have edit permissions, redirecting to not authorized page, permission: ',
            permission_str,
          )
          await router.replace(`/${course_name}/not_authorized`)
          return
        }
      } catch (error) {
        console.error('Error handling permissions and data: ', error)
      }
    }
    handlePermissionsAndData()
  }, [courseMetadata, user.isLoaded, isLoading, router])

  if (isLoading || !user.isLoaded) {
    return (
      <MainPageBackground>
        <LoadingSpinner />
      </MainPageBackground>
    )
  }

  if (!user || !user.isSignedIn) {
    router.replace('/sign-in')
    return <></>
  }

  return (
    <>
      <Navbar course_name={router.query.course_name as string} />
      <main className="course-page-main min-w-screen flex min-h-screen flex-col items-center">
        <div className="items-left flex w-full flex-col justify-center py-0">
          <Flex direction="column" align="center" w="100%">
            <ApiKeyManagement
              course_name={router.query.course_name as string}
              clerk_user={user}
            />
          </Flex>
        </div>
      </main>
    </>
  )
}

export default ApiPage
