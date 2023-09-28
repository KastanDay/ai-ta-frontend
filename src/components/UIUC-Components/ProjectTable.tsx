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
          const transformedData = rawData.map((courseObj: { [key: string]: CourseMetadata }) => {
            const keys = Object.keys(courseObj);
            if (keys.length > 0) {
              const courseName = keys[0] as string;
              const courseDetails = courseObj[courseName];
              return { courseName, ...courseDetails };
            }
            return null;
          }).filter(Boolean);
          setCourses(transformedData);
          console.log(courses);
        } else {
          console.log('No course found with the given name');
        }
      } else {
        console.log('User not signed in');
      }
    };
    fetchCourses();
  }, []);

  if (!courses) return <div>No courses found</div>;
  const rows = courses.map((course) => (
    <tr key={course.courseName}>
      <td>{course.courseName}</td>
      <td>{course.course_owner}</td>
      <td>{course.is_private ? 'Private' : 'Public'}</td>
      <td>{course.course_admins}</td>
    </tr>
  ));

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

