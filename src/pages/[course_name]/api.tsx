// src/pages/[course_name]/api.tsx
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { get_user_permission } from '~/components/UIUC-Components/runAuthCheck';
import { MainPageBackground } from '~/components/UIUC-Components/MainPageBackground';
import { LoadingSpinner } from '~/components/UIUC-Components/LoadingSpinner';
import ApiKeyManagement from '~/components/UIUC-Components/ApiKeyManagament';
import { CourseMetadata } from '~/types/courseMetadata';
import { extractEmailsFromClerk } from '~/components/UIUC-Components/clerkHelpers';
import { fetchCourseMetadata, fetchPresignedUrl } from '~/utils/apiUtils';
import { Flex } from '@mantine/core';
import Navbar from '~/components/UIUC-Components/navbars/Navbar';

export const GetCurrentPageName = () => {
	// /CS-125/materials --> CS-125
	return useRouter().asPath.slice(1).split('/')[0] as string
}

const ApiPage: NextPage = () => {
	const router = useRouter();
	const user = useUser();
	const [courseMetadata, setCourseMetadata] = useState<CourseMetadata | null>(null);
	const [courseExists, setCourseExists] = useState<boolean>(false);
	const [isLoading, setIsLoading] = useState(true);
	const [permission, setPermission] = useState<string | null>(null);
	const [bannerUrl, setBannerUrl] = useState<string>('')
	const [currentEmail, setCurrentEmail] = useState('')

	const course_name = GetCurrentPageName() as string

	// First useEffect to fetch course metadata
	useEffect(() => {
		const fetchMetadata = async () => {
			if (!course_name) {
				return;
			}

			setIsLoading(true);

			try {
				const response = await fetch(`/api/UIUC-api/getCourseExists?course_name=${course_name}`);
				const courseExistsData = await response.json();
				setCourseExists(courseExistsData);

				if (courseExistsData) {
					const metadata: CourseMetadata = await fetchCourseMetadata(course_name);
					setCourseMetadata(metadata);
				}
			} catch (error) {
				console.error(error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchMetadata();
	}, [course_name]);

	// Second useEffect to handle permissions and other dependent data
	useEffect(() => {
		if (!courseMetadata || !user.isLoaded) {
			return;
		}

		const handlePermissionsAndData = async () => {
			try {
				const userEmail = extractEmailsFromClerk(user.user);
				setCurrentEmail(userEmail[0] as string);

				const permission_str = get_user_permission(courseMetadata, user, router);
				console.log("Permission: ", permission_str);
				setPermission(permission_str);

				if (courseMetadata.banner_image_s3) {
					const url = await fetchPresignedUrl(courseMetadata.banner_image_s3);
					setBannerUrl(url as string);
					console.log("Got banner image: ", url);
				}

				if (!courseExists) {
					console.log("Course does not exist, redirecting to new course page");
					router.replace(`/${router.query.course_name}/new`);
				}

				if (permission_str !== 'edit') {
					console.log("User does not have edit permissions, redirecting to not authorized page, permission: ", permission);
					router.replace(`/${router.query.course_name}/not_authorized`);
				}

			} catch (error) {
				console.error("Error handling permissions and data: ", error);
			}
		};

		handlePermissionsAndData();
	}, [courseMetadata, user.isLoaded, isLoading]);


	if (isLoading || !user.isLoaded) {
		return <MainPageBackground><LoadingSpinner /></MainPageBackground>;
	}

	if (!user || !user.isSignedIn) {
		router.replace('/sign-in');
		return null;
	}

	return (
		<>
			<Navbar course_name={router.query.course_name as string} />
			<main className="course-page-main min-w-screen flex min-h-screen flex-col items-center">
				<div className="items-left flex w-full flex-col justify-center py-0">
					<Flex direction="column" align="center" w="100%">
						<ApiKeyManagement course_name={router.query.course_name as string} clerk_user={user} />
					</Flex>
				</div>
			</main>
		</>
	);
};

export default ApiPage;