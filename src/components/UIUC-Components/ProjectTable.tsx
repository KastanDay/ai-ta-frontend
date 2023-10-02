import { Table, createStyles } from '@mantine/core';
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs'
import { extractEmailsFromClerk } from '~/components/UIUC-Components/clerkHelpers'
import { getAllCourseMetadata, getCoursesByOwnerOrAdmin } from '~/pages/api/UIUC-api/getAllCourseMetadata';
import { type CourseMetadata } from '~/types/courseMetadata'
import { useRouter } from 'next/router';
import { DataTable } from 'mantine-datatable';
import styled from 'styled-components';



const StyledRow = styled.tr`
  &:hover {
    background-color: hsla(280,100%,70%, 0.5);
  }
`;

const ListProjectTable: React.FC = () => {
  const clerk_user = useUser()
  const [courses, setCourses] = useState<{ [key: string]: CourseMetadata }[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [rows, setRows] = useState<JSX.Element[]>([]);

  useEffect(() => {
    const fetchCourses = async () => {
      console.log('Fetching courses');
      if (clerk_user.isLoaded && clerk_user.isSignedIn) {
        console.log('Signed');
        const emails = extractEmailsFromClerk(clerk_user.user);
        const currUserEmail = emails[0]
        console.log(currUserEmail);
        if (!currUserEmail) {
          throw new Error('No email found for the user');
        }

        const response = await fetch(`/api/UIUC-api/getAllCourseMetadata?currUserEmail=${currUserEmail}`);
        const rawData = await response.json();
        console.log(rawData);
        if (rawData) {
          const tempRows = rawData.map((course: { [key: string]: CourseMetadata }) => {
            const courseName = Object.keys(course)[0];
            const courseMetadata = course[courseName as string];
            if (courseMetadata) {
              return (
                <StyledRow key={courseName} onClick={() => router.push(`/${courseName}/gpt4`)} style={{ cursor: 'pointer' }}>
                  <td>{courseName}</td>
                  <td>{courseMetadata.course_owner}</td>
                  <td>{courseMetadata.is_private ? 'Private' : 'Public'}</td>
                  <td>{courseMetadata.course_admins.join(', ')}</td>
                </StyledRow>
              );
            }
          });
          setRows(tempRows);
        } else {
          console.log('No course found with the given name');
        }
      } else {
        console.log('User not signed in');
      }
    };
    fetchCourses();
  }, [clerk_user.isLoaded, clerk_user.isSignedIn]);
  return (
    <div style={{ overflowX: 'auto', minWidth: '800px', backgroundColor: '#0f1116', boxShadow: '0px 0px 10px 2px rgba(0,0,0,0,5)', borderRadius: '10px' }}>
      {/* <DataTable
        style={{ backgroundColor: 'white' }}
        sx={(theme) => ({
          backgroundColor: 'transparent',
          '&:hover': {
            backgroundColor: 'transparent',
          },
        })}
        highlightOnHover
        records={rows}
        columns={[
          { accessor: 'courseName' },
          { accessor: 'course_owner' },
          { accessor: 'is_private' },
          { accessor: 'course_admins' },
        ]}
        height={320}
        withBorder
        borderRadius="sm"
        verticalAlignment="top"
      /> */}
      {rows.length > 0 ? (
        <Table withBorder>
          <thead>
            <tr>
              <th>Course Name</th>
              <th>Course Owner</th>
              <th>Privacy</th>
              <th>Course Admins</th>
            </tr>
          </thead>
          <tbody>
            {rows}
          </tbody>
        </Table>
      ) : (
        <h3 style={{ textAlign: "center" }}>You haven't created any courses yet. Let's CREATE one!</h3>
      )}
    </div>
  );

};

export default ListProjectTable;


