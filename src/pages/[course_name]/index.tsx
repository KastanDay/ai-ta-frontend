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
  const course_metadata: CourseMetadata = (await kv.get(
    course_name + '_metadata',
  )) as CourseMetadata
  course_metadata.is_private = JSON.parse(
    course_metadata.is_private as unknown as string,
  )

  console.log('in [course_name]/index.tsx -- course_name: ', course_name)
  console.log(
    'in [course_name]/index.tsx -- course_metadata: ',
    course_metadata,
  )

  if (course_metadata != null) {
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
  const clerk_user_outer = useUser()

  // DO AUTH-based redirect!
  useEffect(() => {
    if (clerk_user_outer.isLoaded) {
      if (course_metadata != null) {
        const permission_str = get_user_permission(
          course_metadata,
          clerk_user_outer,
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
    }
  }, [clerk_user_outer.isLoaded])
  // ------------------- 👆 MOST BASIC AUTH CHECK 👆 -------------------

  // here we redirect depending on Auth.
  return (
    <>
      {course_exists ? (
        <main className="items-left justify-left; course-page-main flex min-h-screen flex-col">
          <div className="container flex flex-col items-center justify-center px-4 py-16 ">
            <Text weight={800}>Checking if course exists...</Text>
            <br></br>
            <br></br>
            <LoadingSpinner />
          </div>
        </main>
      ) : (
        <MakeNewCoursePage course_name={course_name} />
      )}
    </>
  )
}
export default IfCourseExists
