import { Table } from '@mantine/core';
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs'
import { extractEmailsFromClerk } from '~/components/UIUC-Components/clerkHelpers'
import { getAllCourseMetadata, getCoursesByOwnerOrAdmin } from '~/pages/api/UIUC-api/getAllCourseMetadata';
import { type CourseMetadata } from '~/types/courseMetadata'
import { useRouter } from 'next/router';

interface ResponseObject {
  [key: string]: CourseMetadata;
}


const ListProjectTable: React.FC = () => {
  const clerk_user = useUser()
  const [courses, setCourses] = useState<Record<string, CourseMetadata>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const course_name = router.query.course_name as string
  useEffect(() => {
    const fetchCourseMetadata = async () => {
      const response = await fetch(
        `/api/UIUC-api/getCourseMetadata?course_name=${course_name}`,
      )
      const data = await response.json()
      setCourses(data.course_metadata)
      setLoading(false)
    }

    fetchCourseMetadata()
  }, [course_name])

  useEffect(() => {
    const fetchCourses = async () => {
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
          const response = await getAllCourseMetadata();
          if (response !== null) {
            const data = response.find((obd: ResponseObject) => obd.hasOwnProperty(course_name));
            if (data) {
              const course = data[course_name];
              if (course) {
                setCourses([{ [course_name]: course }]);
              }
            } else {
              throw new Error('No course found with the given name');
            }
          } else {
            throw new Error('No response from getAllCourseMetadata');
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
              {Object.entries(courseObj).map(([course_name, course]) => (
                <tr key={course_name}>
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

