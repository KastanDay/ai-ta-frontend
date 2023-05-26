// import { useRouter } from 'next/router'
// import { useState, useEffect } from 'react'
// import { checkCourseExists } from '~/pages/api/check_course_exists'

// const MyComponent = () => {
//   const router = useRouter();
//   const currentRoute = router.asPath.slice(1);
//   const [courseData, setCourseData] = useState(null);


//   // const course_data = await checkCourseExists(currentRoute)
//   useEffect(() => {
//     const fetchData = async () => {
//       const course_data = await checkCourseExists(currentRoute);
//       setCourseData(course_data);
//     };

//     fetchData();
//   }, [currentRoute]);

//   return (
//     <div>
//       <p>Current route is: {currentRoute}</p>
//       {courseData ? (
//         // Render component based on course_data
//         <p>Course data: {JSON.stringify(courseData)}</p>
//       ) : (
//         <p>Loading course data...</p>
//       )}
//     </div>
//   );
// };

// export default MyComponent;


// import { NextRequest, NextResponse } from 'next/server';
// import { get, getAll } from '@vercel/edge-config';
// const configItems = await getAll();

// // If current route is in 'configItems', return 200
// // Otherwise, return 404
// import { NextRequest, NextResponse } from 'next/server';
// import { get, getAll } from '@vercel/edge-config';
// const configItems = await getAll();

// export default async function handler(req: NextRequest): Promise<NextResponse> {
//   const { pathname } = req.nextUrl!;

//   if (configItems.includes(pathname)) {
//     return NextResponse.next();
    
//   } else {

//     return NextResponse.error(404);
//   }
// }


// import { checkExists } from '~/pages/api/UIUC-api/checkCourseExists'


import { GetServerSideProps, GetServerSidePropsContext } from 'next' // GetServerSideProps,
import { has } from '@vercel/edge-config';
import { NextPage } from 'next';

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { params } = context
  if (!params) {
  return {
    props: {
      course_data: null,
      course_name: null,
    },
  };
}

  async function checkExists (courseName: string): Promise<boolean> {
    // get the param "courseName" from the request
    console.log('IN THE CHECKCOURSEEXISTS ---- courseName', courseName)
    const courseExists = await has(courseName)
    console.log('RESULT -- courseExists: ', courseExists)
    return true ? courseExists : false;
  };


  console.log('params ----------------------', params)
  const course_name = params['course_name']
  const course_exists = await checkExists(course_name as string)

  return {
    props: {
      course_name,
      course_exists,
    },
  }
}

interface CourseMainProps {
  course_name: string
  course_exists: boolean
}

const IfCourseExists: NextPage<CourseMainProps> = (props) => {
  console.log('PROPS IN COURSE_MAIN', props)
  const course_name = props.course_name
  const course_exists = props.course_exists

  if (course_exists) {
    return (
      <>
      <p>Course does exist! YAY! Name: {course_name}</p>
      </>
    )
  } else {
    // No exist
    return (
      <>
      <p>Course does not exist. SAD 😩. Name: {course_name}</p>
      </>
    )
  }
}

export default IfCourseExists