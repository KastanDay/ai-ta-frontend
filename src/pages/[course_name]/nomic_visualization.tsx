import { type NextPage } from 'next'
import { useRouter } from 'next/router'
import { type CourseMetadata } from '~/types/courseMetadata'
import { useUser } from '@clerk/nextjs'
import { MainPageBackground } from '~/components/UIUC-Components/MainPageBackground'

const IfCourseExists: NextPage = () => {
  const router = useRouter()
  const course_name = router.query.course_name as string
  const clerk_user = useUser()
  return (
    <MainPageBackground>
      <h1>test</h1>
    </MainPageBackground>
  )
}
export default IfCourseExists