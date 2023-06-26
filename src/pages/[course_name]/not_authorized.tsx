import { NextPage } from 'next'
import { useRouter } from 'next/router'
import { CannotViewCourse } from '~/components/UIUC-Components/CannotViewCourse'

const NotAuthorizedPage: NextPage = (props) => {
  const router = useRouter()
  const getCurrentPageName = () => {
    // /CS-125/materials --> CS-125
    return router.asPath.slice(1).split('/')[0]
  }

  return (
    <>
      <CannotViewCourse course_name={getCurrentPageName() as string} />
    </>
  )
}
export default NotAuthorizedPage
