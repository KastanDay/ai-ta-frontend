// src/components/UIUC-Components/ApiKeyManagement.tsx
import React, { useEffect, useState } from 'react';
import { Card, Title, Button, Text, Flex, Group, Input, useMantineTheme, Textarea } from '@mantine/core';
import { useClipboard, useMediaQuery } from '@mantine/hooks';
import { showNotification } from '@mantine/notifications';
import { type UserResource } from '@clerk/types';
import { IconCopy } from '@tabler/icons-react';
import { montserrat_heading } from 'fonts';

const ApiKeyManagement = ({ course_name, clerk_user }: {
	course_name: string, clerk_user: {
		isLoaded: boolean;
		isSignedIn: boolean;
		user: UserResource | undefined;
	}
}) => {
	const theme = useMantineTheme();
	const isSmallScreen = useMediaQuery('(max-width: 960px)');
	const { copy } = useClipboard();
	const [apiKey, setApiKey] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchApiKey = async () => {
			const response = await fetch(`/api/chat-api/keys/fetch`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				},
			});

			if (response.ok) {
				const data = await response.json();
				setApiKey(data.apiKey);
			} else {
				showNotification({
					title: 'Error',
					message: 'Failed to fetch API key.',
					color: 'red',
				});
			}
			setLoading(false);
		};

		fetchApiKey();
	}, [clerk_user.isLoaded]);

	const handleGenerate = async () => {
		const response = await fetch(`/api/chat-api/keys/generate`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
		});

		if (response.ok) {
			const data = await response.json();
			setApiKey(data.apiKey);
			showNotification({
				title: 'Success',
				message: 'API key generated successfully.',
			});
		} else {
			showNotification({
				title: 'Error',
				message: 'Failed to generate API key.',
				color: 'red',
			});
		}
	};

	const handleRotate = async () => {
		const response = await fetch(`/api/chat-api/keys/rotate`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
			},
		});

		if (response.ok) {
			const data = await response.json();
			setApiKey(data.newApiKey);
			showNotification({
				title: 'Success',
				message: 'API key rotated successfully.',
			});
		} else {
			showNotification({
				title: 'Error',
				message: 'Failed to rotate API key.',
				color: 'red',
			});
		}
	};

	const handleDelete = async () => {
		const response = await fetch(`/api/chat-api/keys/delete`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
			},
		});

		if (response.ok) {
			setApiKey(null);
			showNotification({
				title: 'Success',
				message: 'API key deleted successfully.',
			});
		} else {
			showNotification({
				title: 'Error',
				message: 'Failed to delete API key.',
				color: 'red',
			});
		}
	};

	return (
		<Card
			shadow="xs"
			padding="none"
			radius="xl"
			style={{ maxWidth: '85%', width: '100%', marginTop: '4%' }}
		>
			<Flex direction={isSmallScreen ? 'column' : 'row'} style={{ height: '100%' }}>
				<div
					style={{
						flex: isSmallScreen ? '1 1 100%' : '1 1 60%',
						padding: '1rem',
						color: 'white',
						alignItems: 'center',
					}}
					className="min-h-full bg-gradient-to-r from-purple-900 via-indigo-800 to-blue-800 justify-center"
				>
					<div className="card flex h-full flex-col">
						<Group
							// spacing="lg"
							m="3rem"
							align="center"
							variant='column'
							style={{ justifyContent: 'center', width: '75%', alignSelf: 'center' }}
						>
							<Title
								order={2}
								variant="gradient"
								gradient={{ from: 'gold', to: 'white', deg: 50 }}
								style={{ marginBottom: '1rem' }}
								align='center'
							>
								API Key Management
							</Title>
							<Title order={4} w={'90%'}>
								Access the following API endpoint for real-time chat functionality. Utilize the ChatApiBody type for your request payload. Below you will find the endpoint URL and a sample request body to integrate into your app.
							</Title>
							<Title order={3}
								align='center'
								variant="gradient"
								gradient={{ from: 'gold', to: 'white', deg: 50 }}
								style={{ marginBottom: '1rem', width: '100%' }}>Endpoint URL</Title>
							<Input
								value={`https://www.uiuc.chat/api/chat-api/stream`}
								className="mt-2 mb-4 w-[90%] min-w-[20rem]"
								radius={'xl'}
								size={'md'}
								readOnly
								rightSection={
									<Button onClick={() => copy(`${process.env.VERCEL_URL}/api/chat-api/stream`)} variant="subtle" size="sm"
										radius={'xl'}
										className='min-w-[5rem] -translate-x-1 transform rounded-s-md bg-purple-800 text-white hover:border-indigo-600 hover:bg-indigo-600 hover:text-white focus:shadow-none focus:outline-none'>
										<IconCopy />
									</Button>
								}
								rightSectionWidth={'auto'}
							/>
							<Title order={3}
								align='center'
								variant="gradient"
								gradient={{ from: 'gold', to: 'white', deg: 50 }}
								style={{ marginBottom: '1rem', width: '100%' }}>POST Request Body:</Title>
							{/* Enclose Input and Button in a div with relative positioning */}
							<Textarea
								value={
									`{
	"model": "gpt-3.5-turbo",
	"conversation": {
		"messages": [
			{
				"role": "user",
				"content": "Hello, how can I help you today?"
			}
		]
	},
	"openai_key": "your-openai-key",
	"prompt": "",
	"temperature": 0.7,
	"course_name": "${course_name}",
	"stream": true,
	"api_key": "your-api-key" // replace with your own API key with format: uc_XXXXXXXX
}`
								}
								autosize
								className="mt-4 w-[90%] min-w-[20rem] overflow-y-auto relative"
								radius={'lg'}
								size={'lg'}
								readOnly
								rightSection={
									<Button onClick={() => copy(
										`
{
	"model": "gpt-3.5-turbo",
	"conversation": {
		"messages": [
			{
				"role": "user",
				"content": "Hello, how can I help you today?"
			}
		]
	},
	"openai_key": "your-openai-key",
	"prompt": "",
	"temperature": 0.7,
	"course_name": "${course_name}",
	"stream": true,
	"api_key": "your-api-key"	// replace with your own API key with format: uc_XXXXXXXX
}`
									)} variant="subtle" size="sm"
										// radius={'xl'}
										className='absolute top-1 right-0 min-h-[3rem] -translate-x-1 transform rounded-tl-md rounded-bl-xl bg-purple-800 text-white hover:border-indigo-600 hover:bg-indigo-600 hover:text-white focus:shadow-none focus:outline-none rounded-tr-xl rounded-br-md'>
										<IconCopy />
									</Button>
								}
								rightSectionWidth={'auto'}
							/>
						</Group>
					</div>
				</div>
				<div
					style={{
						flex: isSmallScreen ? '1 1 100%' : '1 1 40%',
						padding: '1rem',
						backgroundColor: '#15162c',
						color: 'white',
					}}
				>
					<div className="card flex h-full flex-col">

						<Group position="center" m="3rem" variant='column'>
							<Title
								className={`label ${montserrat_heading.variable} font-montserratHeading`}
								variant="gradient"
								gradient={{ from: 'gold', to: 'white', deg: 170 }}
								order={2}
								style={{ marginBottom: '1rem' }}
							>
								Your API Key
							</Title>
							{apiKey && (
								<Input
									value={apiKey}
									className="mt-4 w-[80%] min-w-[5rem]"
									radius={'xl'}
									size={'md'}
									readOnly
									rightSection={
										<Button onClick={() => copy(apiKey)} variant="subtle" size="sm"
											radius={'xl'}
											className='min-w-[5rem] -translate-x-1 transform rounded-s-md bg-purple-800 text-white hover:border-indigo-600 hover:bg-indigo-600 hover:text-white focus:shadow-none focus:outline-none'>
											<IconCopy />
										</Button>
									}
									rightSectionWidth={'auto'}
								/>
							)}
						</Group>
						{!apiKey && !loading && (
							<Button onClick={handleGenerate} disabled={loading || apiKey !== null}
								size="lg"
								radius={'xl'}
								className="min-w-[5rem] rounded-md bg-purple-800 text-white hover:border-indigo-600 hover:bg-indigo-600 hover:text-white focus:shadow-none focus:outline-none self-center"
								w={'50%'}>Generate API Key</Button>
						)}
						{apiKey && !loading && (
							<>
								<Group position="center" variant='column' mt="1rem" mb={"3rem"}>
									<Button onClick={handleRotate} disabled={loading || apiKey === null}
										size="lg"
										radius={'xl'}
										className="min-w-[5rem] rounded-md bg-purple-800 text-white hover:border-indigo-600 hover:bg-indigo-600 hover:text-white focus:shadow-none focus:outline-none"
										w={'auto'}>Rotate API Key</Button>
									<Button onClick={handleDelete} disabled={loading || apiKey === null}
										size="lg"
										radius={'xl'}
										className="min-w-[5rem] rounded-md bg-purple-800 text-white hover:border-indigo-600 hover:bg-indigo-600 hover:text-white focus:shadow-none focus:outline-none"
										w={'auto'}>Delete API Key</Button>
								</Group>
							</>
						)}


					</div>
				</div>
			</Flex>
		</Card>
	);
};

export default ApiKeyManagement;