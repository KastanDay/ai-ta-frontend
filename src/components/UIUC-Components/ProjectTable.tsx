import { Table, Title, createStyles } from '@mantine/core'
import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { extractEmailsFromClerk } from '~/components/UIUC-Components/clerkHelpers'
import {
  getAllCourseMetadata,
  getCoursesByOwnerOrAdmin,
} from '~/pages/api/UIUC-api/getAllCourseMetadata'
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
  const [courses, setCourses] = useState<
    { [key: string]: CourseMetadata }[] | null
  >(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const [rows, setRows] = useState<JSX.Element[]>([])
  const [isLoaded, setIsLoaded] = useState<boolean>(false)

  useEffect(() => {
    const fetchCourses = async () => {
      console.log('Fetching courses')
      if (clerk_user.isLoaded && clerk_user.isSignedIn) {
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
        console.log(rawData)
        if (rawData) {
          const tempRows = rawData.map(
            (course: { [key: string]: CourseMetadata }) => {
              const courseName = Object.keys(course)[0]
              const courseMetadata = course[courseName as string]
              if (courseMetadata) {
                return (
                  <StyledRow
                    key={courseName}
                    onClick={() => router.push(`/${courseName}/gpt4`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>{courseName}</td>
                    <td>{courseMetadata.is_private ? 'Private' : 'Public'}</td>
                    <td>{courseMetadata.course_owner}</td>
                    <td>{courseMetadata.course_admins.join(', ')}</td>
                  </StyledRow>
                )
              }
            },
          )
          setRows(tempRows)
          setIsLoaded(true)
        } else {
          console.log('No course found with the given name')
          setIsLoaded(true)
        }
      } else {
        console.log('User not signed in')
      }
    }
    fetchCourses()
  }, [clerk_user.isLoaded, clerk_user.isSignedIn])

  if (!isLoaded) {
    // Todo add skeleton here, for typical looking boxes
    return null
  }

  return (
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
      {rows.length > 0 ? (
        <Table withBorder>
          <thead>
            <tr>
              <th>
                <span
                  className={`text-md text-slate-200 ${montserrat_heading.variable} font-montserratHeading`}
                >
                  Course Name
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
                  Course Owner
                </span>
              </th>
              <th>
                <span
                  className={`text-md text-slate-200 ${montserrat_heading.variable} font-montserratHeading`}
                >
                  Course Admins
                </span>
              </th>
            </tr>
          </thead>
          <tbody>{rows}</tbody>
        </Table>
      ) : (
        <h3 style={{ textAlign: 'center' }}>
          You haven&apos;t created any courses yet. Let&apos;s
          <Link href="/new">go make one here</Link>, don&apos;t worry it&apos;s
          easy.
        </h3>
      )}
    </div>
  )
}

export default ListProjectTable
