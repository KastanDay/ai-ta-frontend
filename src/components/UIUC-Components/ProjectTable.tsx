import { Table } from '@mantine/core';
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs'
import { extractEmailsFromClerk } from '~/components/UIUC-Components/clerkHelpers'
import { getAllCourseMetadata, getCoursesByOwnerOrAdmin } from '~/pages/api/UIUC-api/getAllCourseMetadata';
import { type CourseMetadata } from '~/types/courseMetadata'
import { useRouter } from 'next/router';



const ListProjectTable: React.FC = () => {
  const clerk_user = useUser()
  const [courses, setCourses] = useState<{ [key: string]: CourseMetadata }[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [rows, setRows] = useState<JSX.Element[] | null>(null);


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
          let tempRows;
          // if (!courses) return <div>No courses found</div>;
          tempRows = rawData.map((course: { [key: string]: CourseMetadata }) => {

            // raw data is a list of dicts mapping course name to CourseMetadata objects
            const courseName = Object.keys(course)[0];
            const courseMetadata = course[courseName as string];
            if (courseMetadata) {
              return (
                <tr key={courseName}>
                  <td>{courseName}</td>
                  <td>{courseMetadata.course_owner}</td>
                  <td>{courseMetadata.is_private ? 'Private' : 'Public'}</td>
                  <td>{courseMetadata.course_admins.join(', ')}</td>
                </tr>
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
    <div style={{ overflowX: 'auto', minWidth: '500px' }}>
      <Table striped>
        <thead>
          <tr>
            <th>Course Name</th>
            <th>Course Owner</th>
            <th>Privacy</th>
            <th>Course Admins</th>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </Table>
    </div>
  );

};


export default ListProjectTable;

