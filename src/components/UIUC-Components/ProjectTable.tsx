import { Table, createStyles } from '@mantine/core';
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs'
import { extractEmailsFromClerk } from '~/components/UIUC-Components/clerkHelpers'
import { getAllCourseMetadata, getCoursesByOwnerOrAdmin } from '~/pages/api/UIUC-api/getAllCourseMetadata';
import { type CourseMetadata } from '~/types/courseMetadata'
import { useRouter } from 'next/router';


// const useStyles = createStyles({
//   rowStyle: {
//     '& tr:hover': {
//       backgroundColor: 'hsl(280,100%,70%)',
//     },
//   },
// });
const rowStyles = {
  '&:hover': {
    backgroundColor: 'hsl(280,100%,70%)',
  },
};

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
          tempRows = rawData.map((course: { [key: string]: CourseMetadata }) => {
            // raw data is a list of dicts mapping course name to CourseMetadata objects
            const courseName = Object.keys(course)[0];
            const courseMetadata = course[courseName as string];
            if (courseMetadata) {
              return (
                <tr key={courseName} style={{ rowStyles }}>
                  <td>{courseName}</td>
                  <td>{courseMetadata.course_owner}</td>
                  <td>{courseMetadata.is_private ? 'Private' : 'Public'}</td>
                  <td>{courseMetadata.course_admins.join(', ')}</td>
                  {/* <td>{courseMetadata.approved_emails_list.join(', ')}</td> */}
                  {/* maybe show the approved emails list as a dropdown */}
                </tr>
              );
            }
          });
          setRows(tempRows);
        } else {
          // remind user to create a new project
          console.log('No course found with the given name');
        }
      } else {
        console.log('User not signed in');
      }
    };
    fetchCourses();
  }, [clerk_user.isLoaded, clerk_user.isSignedIn]);

  return (
    <div style={{ overflowX: 'auto', minWidth: '800px' }}>

      <Table highlightOnHover>
        <thead >
          <tr>
            <th>Course Name</th>
            <th>Course Owner</th>
            <th>Privacy</th>
            <th>Course Admins</th>
          </tr>
        </thead>
        <tbody>
          {rows ? rows : <tr><td colSpan={4}>You haven't created any courses yet. Let's CREATE one!</td></tr>}
        </tbody>
      </Table>

    </div >
  );

};

export default ListProjectTable;


