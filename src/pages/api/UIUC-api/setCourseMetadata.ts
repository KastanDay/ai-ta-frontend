import { kv } from '@vercel/kv';
import { CourseMetadata } from '~/types/courseMetadata';

export const runtime = 'edge';

const setCourseMetadata = async (req: any, res: any) => {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' });
    return;
  }

  const { course_name, course_owner, course_admins, approved_emails_list } = req.body;

  try {
    const course_metadata: CourseMetadata = {
      course_owner: course_owner,
      course_admins: course_admins,
      approved_emails_list: approved_emails_list,
    };
    await kv.set(course_name + '_metadata', course_metadata);
    res.status(200).json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false });
  }
};

export default setCourseMetadata;