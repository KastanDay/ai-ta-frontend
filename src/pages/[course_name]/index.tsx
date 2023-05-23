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



export { default, getServerSideProps } from '~/pages/api/home'
// export default CurrentPagePath;