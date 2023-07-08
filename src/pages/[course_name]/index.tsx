import { GetServerSidePropsContext } from 'next' // GetServerSideProps, GetServerSideProps,
import { NextPage } from 'next'
import MakeNewCoursePage from '~/components/UIUC-Components/MakeNewCoursePage'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { Text } from '@mantine/core'
import { kv } from '@vercel/kv'
import { CourseMetadata } from '~/types/courseMetadata'
import { useAuth, useUser } from '@clerk/nextjs'
// import { CannotEditCourse } from '~/components/UIUC-Components/CannotEditCourse'
import { LoadingSpinner } from '~/components/UIUC-Components/LoadingSpinner'
import { CannotViewCourse } from '~/components/UIUC-Components/CannotViewCourse'
import { get_user_permission } from '~/components/UIUC-Components/runAuthCheck'
import { MainPageBackground } from '~/components/UIUC-Components/MainPageBackground'
import { AuthComponent } from '~/components/UIUC-Components/AuthToEditCourse'
import { extractEmailsFromClerk } from '~/components/UIUC-Components/clerkHelpers'
import { Query } from 'react-query'

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { params } = context
  if (!params) {
    return {
      course_name: null,
      course_exists: null,
      course_metadata: null,
    }
  }

  const course_name = params['course_name'] as string

  // const course_exists = await kv.get(course_name) // kv.get() only works server-side. Otherwise use fetch.

  // TODO turn this into a fetch, not a kv.get. Remove entire ServerSideProps thing

  const course_metadata: CourseMetadata = (await kv.get(
    course_name + '_metadata',
  )) as CourseMetadata
  console.log(
    'in [course_name]/index.tsx -- course_metadata: ',
    course_metadata,
  )

  if (course_metadata == null) {
    console.log(
      'in [course_name]/index.tsx -- course_metadata is null. course_name: ',
      course_name,
    )
    console.log(
      'in [course_name]/index.tsx -- course_metadata: ',
      course_metadata,
    )
  } else {
    console.log('in we expect no null today! -- course_metadata: ', course_name)

    if (course_metadata != null) {
      if (course_metadata.is_private == null) {
        console.log('TODO: Remove this hack once is_private is fixed.')
        course_metadata.is_private = false
      }
      course_metadata.is_private = JSON.parse(
        course_metadata.is_private as unknown as string,
      )
      console.log(
        'in [course_name]/index.tsx -- course_metadata',
        course_metadata,
      )
      return {
        props: {
          course_name,
          course_exists: true,
          course_metadata,
        },
      }
    }
  }

  console.log('in [course_name]/index.tsx - metadata', course_metadata)
  // console.log(
  //   'approved_emails_list',
  //   course_metadata?.['approved_emails_list'] ?? [],
  // )

  return {
    props: {
      course_name,
      course_exists: false,
      course_metadata,
    },
  }
}

interface CourseMainProps {
  course_name: string
  course_exists: boolean
  course_metadata: CourseMetadata
}

const IfCourseExists: NextPage<CourseMainProps> = (props) => {
  console.log('PROPS IN IfCourseExists in [course_name]/index.tsx', props)

  // ------------------- 👇 MOST BASIC AUTH CHECK 👇 -------------------
  const course_name = props.course_name as string
  const course_metadata = props.course_metadata as CourseMetadata
  const course_exists = course_metadata != null

  const router = useRouter()
  const clerk_user = useUser()

  // DO AUTH-based redirect!
  useEffect(() => {
    if (!clerk_user.isLoaded) {
      return
    }
    if (course_metadata == null) {
      console.log('Course does not exist, redirecting to materials page')
      router.replace(`/${course_name}/materials`)
      return
    }
    // course is private & not signed in, must sign in
    if (course_metadata.is_private && !clerk_user.isSignedIn) {
      console.log(
        'User not logged in',
        clerk_user.isSignedIn,
        clerk_user.isLoaded,
        course_name,
      )
      router.replace(`/sign-in?${course_name}`) // replace with your auth route
      return
    }
    if (clerk_user.isLoaded) {
      console.log(
        'in [course_name]/index.tsx -- clerk_user loaded and working :)',
      )
      if (course_metadata != null) {
        const permission_str = get_user_permission(
          course_metadata,
          clerk_user,
          router,
        )

        console.log(
          'in [course_name]/index.tsx -- permission_str',
          permission_str,
        )

        if (permission_str == 'edit' || permission_str == 'view') {
          // ✅ AUTHED
          console.log(
            'in [course_name]/index.tsx - Course exists & user is properly authed, redirecting to gpt4 page',
          )
          router.push(`/${course_name}/gpt4`)
        } else {
          // 🚫 NOT AUTHED
          router.push(`/${course_name}/not_authorized`)
        }
      } else {
        // 🆕 MAKE A NEW COURSE
        console.log('Course does not exist, redirecting to materials page')
        router.push(`/${course_name}/materials`)
      }
    } else {
      console.log('in [course_name]/index.tsx -- clerk_user NOT LOADED yet...')
    }
  }, [clerk_user.isLoaded])

  if (
    !clerk_user.isLoaded ||
    course_metadata == null ||
    (course_metadata.is_private && !clerk_user.isSignedIn)
  ) {
    return (
      <MainPageBackground>
        <LoadingSpinner />
      </MainPageBackground>
    )
  }
  // ------------------- 👆 MOST BASIC AUTH CHECK 👆 -------------------

  const curr_user_emails = extractEmailsFromClerk(clerk_user.user)

  // here we redirect depending on Auth.
  return (
    <>
      {course_exists ? (
        <MainPageBackground>
          <LoadingSpinner />
          <br></br>
          <Text weight={800}>Checking if course exists...</Text>
        </MainPageBackground>
      ) : (
        <MakeNewCoursePage
          course_name={course_name}
          current_user_email={curr_user_emails[0] as string}
        />
      )}
    </>
  )
}
export default IfCourseExists
