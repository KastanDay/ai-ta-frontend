import { Table } from '@mantine/core';
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs'
import { extractEmailsFromClerk } from '~/components/UIUC-Components/clerkHelpers'
import { getAllCourseMetadata, getCoursesByOwnerOrAdmin } from '~/pages/api/UIUC-api/getAllCourseMetadata';
import router from 'next/router';
import { type CourseMetadata } from '~/types/courseMetadata'



const ListProjectTable: React.FC = () => {
  const clerk_user = useUser()
  const [courses, setCourses] = useState<Record<string, CourseMetadata>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const course_name = router.query.course_name as string


  // useEffect(() => {
  //   const fetchCourseMetadata = async () => {
  //     const response = await fetch(
  //       `/api/UIUC-api/getCourseMetadata?course_name=${course_name}`,
  //     )
  //     const data = await response.json()
  //     setCourseMetadata(data.course_metadata)
  //     setIsLoading(false)
  //   }

  //   fetchCourseMetadata()
  // }, [course_name])
  useEffect(() => {
    const fetchCourses = async () => {
      const response = await fetch(
        `/api/UIUC-api/getCourseMetadata?course_name=${course_name}`,)
      try {
        if (clerk_user.isLoaded && clerk_user.isSignedIn) {
          const emails = extractEmailsFromClerk(clerk_user.user);
          const currUserEmail = emails[0];
          if (!currUserEmail) {
            throw new Error('No email found for the user');
          }
          const result = await getCoursesByOwnerOrAdmin(currUserEmail);
          if (result) {
            setCourses(result);
            setLoading(false);
          } else {
            throw new Error('No courses found for the user');
          }
        } else {
          throw new Error('User not signed in');
        }
      } catch (err) {
        setError((err as Error).message);
        setLoading(false);
      }
    };
    fetchCourses();
  }, [course_name]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!courses || courses.length === 0) return <div>No courses found</div>;

  return (
    <div>
      {courses && courses.map((courseObj, index) => (
        <div key={index}>
          <Table striped highlightOnHover>
            <tbody>
              {Object.entries(courseObj).map(([key, course]) => (
                <tr key={key}>
                  <td>{course_name}</td>
                  <td>{course.course_owner}</td>
                  <td>{course.is_private ? 'Private' : 'Public'}</td>
                  <td>{course.course_admins}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      ))}
    </div>
  );
};

export default ListProjectTable;
