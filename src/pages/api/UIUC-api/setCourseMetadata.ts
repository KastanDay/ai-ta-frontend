// import { kv } from '@vercel/kv';
// import { NextResponse } from 'next/server';
// import { CourseMetadata } from '~/types/courseMetadata';

// // NextResponse

// export const runtime = 'edge';

// const setCourseMetadata = async (req: any, res: any) => {
//   // console.log('setCourseMetadata: req', req);
//   // console.log('------------------------------------');
//   // console.log('setCourseMetadata: res', res);
//   if (req.method !== 'POST') {
//     res.status(405).json({ success: false, message: 'Method not allowed' });
//     return NextResponse.json({ success: false, message: 'Method not allowed, only POST requests.'} )
//   }

//   // const { course_name, course_owner, course_admins, approved_emails_list } = req.body;

//   const course_name = req.nextUrl.searchParams.get('course_name')
//   const course_owner = req.nextUrl.searchParams.get('course_owner')
//   const course_admins = req.nextUrl.searchParams.get('course_admins')
//   const approved_emails_list = req.nextUrl.searchParams.get('approved_emails_list')

//   console.log('setCourseMetadata: course_name', course_name);
//   console.log('setCourseMetadata: course_owner', course_owner);
//   console.log('setCourseMetadata: course_admins', course_admins);
//   console.log('setCourseMetadata: approved_emails_list', approved_emails_list);

//   try {
//     const course_metadata: CourseMetadata = {
//       course_owner: course_owner,
//       course_admins: course_admins,
//       approved_emails_list: approved_emails_list,
//     };
//     console.log("Right before setting course_metadata with: ", course_metadata)
//     await kv.set(course_name + '_metadata', course_metadata);
//     console.log("SUCCES setting metadata! --")
//     // res.status(200).json({ success: true });
//     // this is the EDGE RUNTIME way of doing it
//     return NextResponse.json({ success: true })
//   } catch (error) {
//     console.log(error);
//     // res.status(500).json({ success: false });
//     // this is the EDGE RUNTIME way of doing it
//     return NextResponse.json({ success: false })
//   }
// };

// export default setCourseMetadata;

// import { kv } from '@vercel/kv';
// import { NextResponse } from 'next/server';
// import { CourseMetadata } from '~/types/courseMetadata';

// export const runtime = 'edge';

// const setCourseMetadata = async (req: any, res: any) => {
//   if (req.method !== 'POST') {
//     res.status(405).json({ success: false, message: 'Method not allowed' });
//     return NextResponse.json({ success: false, message: 'Method not allowed, only POST requests.'} )
//   }

//   // Extract data from the request body
//   const { course_name, course_owner, course_admins, approved_emails_list } = req.body;

//   console.log('setCourseMetadata: course_name', course_name);
//   console.log('setCourseMetadata: course_owner', course_owner);
//   console.log('setCourseMetadata: course_admins', course_admins);
//   console.log('setCourseMetadata: approved_emails_list', approved_emails_list);

//   try {
//     const course_metadata: CourseMetadata = {
//       course_owner: course_owner,
//       course_admins: course_admins,
//       approved_emails_list: approved_emails_list,
//     };
//     console.log("Right before setting course_metadata with: ", course_metadata)
//     await kv.set(course_name + '_metadata', course_metadata);
//     console.log("SUCCES setting metadata! --")
//     return NextResponse.json({ success: true })
//   } catch (error) {
//     console.log(error);
//     return NextResponse.json({ success: false })
//   }
// };

// export default setCourseMetadata;

import { kv } from '@vercel/kv'
import { NextResponse } from 'next/server'
import { CourseMetadata } from '~/types/courseMetadata'

export const runtime = 'edge'

const setCourseMetadata = async (req: any, res: any) => {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' })
    return NextResponse.json({
      success: false,
      message: 'Method not allowed, only POST requests.',
    })
  }

  const course_name = req.nextUrl.searchParams.get('course_name')
  const course_owner = req.nextUrl.searchParams.get('course_owner')
  const course_admins = JSON.parse(
    req.nextUrl.searchParams.get('course_admins') || '[]',
  )
  const approved_emails_list = JSON.parse(
    req.nextUrl.searchParams.get('approved_emails_list') || '[]',
  )

  console.log('setCourseMetadata: course_name', course_name)
  console.log('setCourseMetadata: course_owner', course_owner)
  console.log('setCourseMetadata: course_admins', course_admins)
  console.log('setCourseMetadata: approved_emails_list', approved_emails_list)

  try {
    const course_metadata: CourseMetadata = {
      course_owner: course_owner,
      course_admins: course_admins,
      approved_emails_list: approved_emails_list,
    }
    console.log('Right before setting course_metadata with: ', course_metadata)
    await kv.set(course_name + '_metadata', course_metadata)
    console.log('SUCCES setting metadata! --')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.log(error)
    return NextResponse.json({ success: false })
  }
}

export default setCourseMetadata
