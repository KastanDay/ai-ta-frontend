import { Table, Title, Text } from '@mantine/core'
import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { extractEmailsFromClerk } from '~/components/UIUC-Components/clerkHelpers'
import { type CourseMetadata } from '~/types/courseMetadata'
import { useRouter } from 'next/router'
import { DataTable } from 'mantine-datatable'
import styled from 'styled-components'
import { montserrat_heading } from 'fonts'
import Link from 'next/link'

const StyledRow = styled.tr`
  &:hover {
    background-color: hsla(280, 100%, 70%, 0.5);
  }
`

const ListProjectTable: React.FC = () => {
  const clerk_user = useUser()
  const [courses, setProjects] = useState<
    { [key: string]: CourseMetadata }[] | null
  >(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const [rows, setRows] = useState<JSX.Element[]>([])
  const [isFullyLoaded, setIsFullyLoaded] = useState<boolean>(false)

  useEffect(() => {
    const fetchCourses = async () => {
      console.log('Fetching projects')
      if (!clerk_user.isLoaded) {
        return
      }

      if (clerk_user.isSignedIn) {
        console.log('Signed')
        const emails = extractEmailsFromClerk(clerk_user.user)
        const currUserEmail = emails[0]
        console.log(currUserEmail)
        if (!currUserEmail) {
          throw new Error('No email found for the user')
        }

        const response = await fetch(
          `/api/UIUC-api/getAllCourseMetadata?currUserEmail=${currUserEmail}`,
        )
        const rawData = await response.json()
        if (rawData) {
          const tempRows = rawData.map(
            (course: { [key: string]: CourseMetadata }) => {
              const courseName = Object.keys(course)[0]
              const courseMetadata = course[courseName as string]
              if (courseMetadata) {
                // Don't show that Kastan is an admin on ALL courses. It's confusing, unnecessary.
                const filteredAdmins = courseMetadata.course_admins.filter(
                  (admin) => admin !== 'kvday2@illinois.edu',
                )
                return (
                  <StyledRow
                    key={courseName}
                    onClick={() => router.push(`/${courseName}/chat`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>{courseName}</td>
                    <td>{courseMetadata.is_private ? 'Private' : 'Public'}</td>
                    <td>{courseMetadata.course_owner}</td>
                    <td>{filteredAdmins.join(', ')}</td>
                  </StyledRow>
                )
              }
            },
          )
          setRows(tempRows)
          setIsFullyLoaded(true)
        } else {
          console.log('No project found with the given name')
          setIsFullyLoaded(true)
        }
      } else {
        console.log('User not signed in')
        setIsFullyLoaded(true)
      }
    }
    fetchCourses()
  }, [clerk_user.isLoaded, clerk_user.isSignedIn])

  if (!clerk_user.isLoaded || !isFullyLoaded) {
    // Loading screen is actually NOT worth it :/ just return null
    // return <Skeleton animate={true} height={40} width="70%" radius="xl" />
    return null
  } else {
    if (!clerk_user.isSignedIn) {
      return (
        <>
          {/* Todo: add enticing copy for new recruits */}
          {/* <Title order={3}>
            <Link className="text-purple-500 underline" href="/new">Make your own project here</Link>
          </Title> */}
        </>
      )
    }
    // authed users:
    return (
      <>
        <Title order={3} color="white" ta="center">
          Your Projects
        </Title>
        {rows.length > 0 ? (
          <div
            style={{
              overflowX: 'auto',
              minWidth: '40%',
              maxWidth: '80%',
              backgroundColor: '#15162b',
              boxShadow: '0px 0px 10px 2px rgba(0,0,0,0,5)',
              borderRadius: '12px',
            }}
          >
            <Table withBorder>
              <thead>
                <tr>
                  <th>
                    <span
                      className={`text-md text-slate-200 ${montserrat_heading.variable} font-montserratHeading`}
                    >
                      Project Name
                    </span>
                  </th>
                  <th>
                    <span
                      className={`text-md text-slate-200 ${montserrat_heading.variable} font-montserratHeading`}
                    >
                      Privacy
                    </span>
                  </th>
                  <th>
                    <span
                      className={`text-md text-slate-200 ${montserrat_heading.variable} font-montserratHeading`}
                    >
                      Project Owner
                    </span>
                  </th>
                  <th>
                    <span
                      className={`text-md text-slate-200 ${montserrat_heading.variable} font-montserratHeading`}
                    >
                      Project Admins
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>{rows}</tbody>
            </Table>
          </div>
        ) : (
          <Text
            size="md"
            className={`${montserrat_heading.variable} font-montserratHeading`}
            bg={'bg-transparent'}
            style={{ backgroundColor: 'clear', textAlign: 'center' }}
          >
            You haven&apos;t created any projects yet. Let&apos;s{' '}
            <Link className="text-purple-500 underline" href="/new">
              go make one here
            </Link>
            , don&apos;t worry it&apos;s easy.
          </Text>
        )}
      </>
    )
  }
}

export default ListProjectTable
