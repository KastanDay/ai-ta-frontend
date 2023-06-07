import Head from 'next/head'
import { DropzoneS3Upload } from '~/components/Upload_S3'
import { Montserrat, Inter, Rubik_Puddles, Audiowide } from "next/font/google"
import { Card, Image, Text, Title, Badge, MantineProvider, Button, Group, Stack, createStyles, FileInput, Flex, rem } from '@mantine/core'
const rubik_puddles = Rubik_Puddles({ weight: '400', subsets: ['latin'], });
const montserrat = Montserrat({ weight: '700', subsets: ['latin'], });
import Link from 'next/link'
import React from 'react'
import axios from 'axios';
const MakeOldCoursePage = ({ course_name, course_data }: { course_name: string, course_data: any }) => {

    return (
        <>
            <Head>
                <title>{course_name}</title>
                <meta name="description" content="The AI teaching assistant built for students at UIUC." />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <main className="items-center justify-left; course-page-main flex min-h-screen flex-col">
                <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
                    <Link href="/">
                        <h2 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]"> UIUC Course <span className="${inter.style.fontFamily} text-[hsl(280,100%,70%)]">AI</span> </h2>
                    </Link>
                </div>
                <div className="items-center container flex flex-col justify-center gap-12 py-2 ">
                    <Flex direction="column" align="center" justify="center">
                        <Title className={montserrat.className} variant="gradient" gradient={{ from: 'gold', to: 'white', deg: 50 }} order={2} p="xl"> Want to upload more materials? </Title>
                        <DropzoneS3Upload course_name={course_name} />
                        <Title className={montserrat.className} variant="gradient" gradient={{ from: 'gold', to: 'white', deg: 50 }} order={2} p="xl"> {course_name} Course Files  </Title>
                        <CourseFilesList files={course_data} />
                    </Flex>
                </div>
            </main>
        </>
    )
}

interface CourseFile {
    name: string;
    s3_path: string;
    course_name: string;
    readable_filename: string;
    type: string;
    url: string;
}

interface CourseFilesListProps {
    files: CourseFile[];
}
const CourseFilesList = ({ files }: CourseFilesListProps) => {


    const handleDelete = async (s3_path: string) => {
        try {
            const API_URL = 'https://flask-production-751b.up.railway.app';
            const response = await axios.delete(`${API_URL}/delete`, { data: { s3_path } });
            console.log(response);
            // Handle successful deletion, e.g., remove the item from the list or show a success message
        } catch (error) {
            console.error(error);
            // Handle errors, e.g., show an error message
        }
    };

    return (
        <div className="w-full mx-auto bg-violet-200 border border-violet-950 shadow-md shadow-amber-100 rounded-xl p-10">
            <ul role="list" className="divide-y divide-gray-100">
                {files.map((file) => (
                    <li key={file.s3_path} className={`flex justify-between items-center gap-x-6 py-5 bg-violet-950 bg border border-violet-700 shadow-md shadow-amber-100 rounded-xl`}>
                        <div className="flex gap-x-4">
                            <div className="min-w-0 flex-auto">
                                <p className="px-4 text-xl font-semibold leading-6 text-white">{file.readable_filename}</p>
                                <p className="px-4 mt-1 truncate text-xs leading-5 text-white">{file.course_name}</p>
                            </div>
                        </div>
                        <button onClick={() => handleDelete(file.s3_path as string)} className="bg-red-600 hover:bg-red-800 text-white w-6 h-6 flex items-center justify-center rounded-full mr-4">
                            <span className="text-xl font-bold">-</span>
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    )
}


export default MakeOldCoursePage
