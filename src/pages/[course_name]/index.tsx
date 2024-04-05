// src/pages/[course_name]/index.tsx
import { type NextPage } from 'next'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { Text } from '@mantine/core'
import { type CourseMetadata } from '~/types/courseMetadata'
import { useUser } from '@clerk/nextjs'
import { LoadingSpinner } from '~/components/UIUC-Components/LoadingSpinner'
import { get_user_permission } from '~/components/UIUC-Components/runAuthCheck'
import { MainPageBackground } from '~/components/UIUC-Components/MainPageBackground'
import { fetchCourseMetadata } from '~/utils/apiUtils'
import { GetCurrentPageName } from './api'

const IfCourseExists: NextPage = () => {
  const router = useRouter()
  const course_name = GetCurrentPageName() as string
  const user = useUser()
  const [courseMetadataIsLoaded, setCourseMetadataIsLoaded] = useState(false)
  const [courseMetadata, setCourseMetadata] = useState<CourseMetadata | null>(
    null,
  )

  useEffect(() => {
    if (course_name) {
      const fetchMetadata = async () => {
        const metadata: CourseMetadata = await fetchCourseMetadata(course_name)
        setCourseMetadata(metadata)

        if (metadata === null) {
          await router.replace('/new?course_name=' + course_name)
          return
        }

        if (!metadata.is_private) {
          // Public
          console.debug('Public course, redirecting to chat page')
          await router.replace(`/${course_name}/chat`)
          return
        }
        setCourseMetadataIsLoaded(true)
      }
      fetchMetadata()
    }
  }, [course_name, router.isReady])

  useEffect(() => {
    const checkAuth = async () => {
      // AUTH
      if (courseMetadata && user.isLoaded) {
        const permission_str = get_user_permission(courseMetadata, user, router)

        if (permission_str === 'edit' || permission_str === 'view') {
          console.debug('Can view or edit')
          await router.replace(`/${course_name}/chat`)
          return
        } else {
          console.debug(
            'User does not have edit permissions, redirecting to not authorized page, permission: ',
            permission_str,
          )
          await router.replace(`/${course_name}/not_authorized`)
          return
        }
      }
    }
    checkAuth()
  }, [user.isLoaded, courseMetadata, courseMetadataIsLoaded])

  if (
    !courseMetadataIsLoaded ||
    !user.isLoaded ||
    courseMetadata == null ||
    (courseMetadata.is_private && !user.isSignedIn)
  ) {
    return (
      <MainPageBackground>
        <LoadingSpinner />
      </MainPageBackground>
    )
  }
  return <></>
  // here we redirect depending on Auth.
  //   if (courseMetadata) {
  //     return (
  //       <MainPageBackground>
  //         <LoadingSpinner />
  //         <br></br>
  //         <Text weight={800}>Checking if course exists...</Text>
  //       </MainPageBackground>
  //     )
  //   } else {
  //     router.push('/new?course_name=' + course_name)
  //     return <></>
  //   }
}
export default IfCourseExists
