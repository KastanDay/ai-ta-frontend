'use client';

import { ActionIcon, Box, Button, Group, MultiSelect, Stack, TextInput, Text, MantineProvider, createStyles, Paper, Center } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconEdit, IconEye, IconSearch, IconTrash, IconX } from '@tabler/icons-react';
import { DataTable, type DataTableSortStatus } from 'mantine-datatable';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { modals, openConfirmModal, useModals, ModalsProvider } from '@mantine/modals';
import { showToastOnFileDeleted } from './MakeOldCoursePage';
import axios from 'axios';
import { showNotification } from '@mantine/notifications';


const useStyles = createStyles((theme) => ({
  // How to change hearder color 
  // root: {
  //   '& tr': {
  //     backgroundColor: theme.colorScheme === 'dark' ? '#15162a' : '#fff',
  //   },
  //   '& tr:nth-child(odd)': {
  //     backgroundColor: theme.colorScheme === 'dark' ? '#15162a' : '#fff',
  //   },
  // },
}));

interface CourseDocuments {
  readable_filename: string;
  url: string;
  s3_path: string;
  created_at: string;
  base_url: string;
}


interface CourseFilesListProps {
  course_materials: CourseDocuments[]
}


export async function getPresignedUrl(s3_path: string) {
  const response = await fetch(`/api/UIUC-api/getPresignedUrl?s3_path=${s3_path}`);
  const data = await response.json();
  return data.presignedUrl;
}

export function MantineYourMaterialsTable({ course_materials }: CourseFilesListProps) {
  const { classes, theme } = useStyles();

  const router = useRouter();
  const getCurrentPageName = (): string => {
    const path = router.asPath;
    const courseName = path.slice(1).split('/')[0] || '';
    return courseName;
  }
  const [materials, setMaterials] = useState(course_materials);
  const [selectedRecords, setSelectedRecords] = useState<CourseDocuments[]>([]);


  useEffect(() => {
    const fetchCourseDocuments = async () => {
      const response = await fetch(`/api/UIUC-api/getCourseDocuments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          course_name: getCurrentPageName(),
        }),
      });
      const documents = await response.json();
      if (documents) {
        setMaterials(documents);
      }
    };

    fetchCourseDocuments();
  }, []);


  // const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
  //   columnAccessor: 'File Name',
  //   direction: 'asc',
  // });

  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebouncedValue(query, 200);


  useEffect(() => {
    if (debouncedQuery !== '') {
      const lowerCaseDebouncedQuery = debouncedQuery.trim().toLowerCase();
      setMaterials(
        course_materials.filter(({ readable_filename, url, base_url }) => {
          return `${readable_filename}`.toLowerCase().includes(lowerCaseDebouncedQuery) ||
            `${url}`.toLowerCase().includes(lowerCaseDebouncedQuery) ||
            `${base_url}`.toLowerCase().includes(lowerCaseDebouncedQuery);
        })
      );
    } else {
      setMaterials(course_materials);
    }
  }, [debouncedQuery, course_materials]);



  const handleDelete = async (
    course_name: string,
    s3_path: string,
    url: string,
  ) => {
    try {
      const API_URL = 'https://flask-production-751b.up.railway.app'
      const response = await axios.delete(`${API_URL}/delete`, {
        params: { course_name, s3_path, url },
      })
      // Handle successful deletion, show a success message
      showToastOnFileDeleted(theme)
      // Skip refreshing the page for now, for better UX let them click a bunch then manually refresh.
      // await router.push(router.asPath)
      await router.reload()
    } catch (error) {
      console.error(error)
      // Show error message
      showToastOnFileDeleted(theme, true)
    }
    // }
  }

  return (
    <>
      <DataTable
        borderRadius="lg"
        withColumnBorders
        withBorder={true}
        striped
        highlightOnHover
        style={{
          width: '100%',
        }}
        height="80vh"
        records={materials}
        columns={
          [
            {
              accessor: 'Name',
              render: ({ readable_filename }) => readable_filename ? `${readable_filename}` : '',
              filter: (
                <TextInput
                  label="File Name"
                  description="Show uploaded files that include the specified text"
                  placeholder="Search files..."
                  rightSection={
                    <ActionIcon
                      size="sm"
                      variant="transparent"
                      c="dimmed"
                      onClick={() => setQuery('')}
                    >
                      <IconX size={14} />
                    </ActionIcon>
                  }
                  value={query}
                  onChange={(e) => setQuery(e.currentTarget.value)}
                />
              ),
              filtering: query !== '',
            },
            {
              accessor: 'URL',
              render: ({ url }) => url ? `${url}` : '',
              filter: (
                <TextInput
                  label="URL"
                  description="Show all urls "
                  placeholder="Search urls..."
                  rightSection={
                    <ActionIcon size="sm" variant="transparent" c="dimmed" onClick={() => setQuery('')}>
                      <IconX size={14} />
                    </ActionIcon>
                  }
                  value={query}
                  onChange={(e) => setQuery(e.currentTarget.value)}
                />
              ),
              filtering: query !== '',
            },
            {
              accessor: 'Starting URL of Web Scrape',
              render: ({ base_url }) => base_url ? `${base_url}` : '',
              filter: (
                <TextInput
                  label="Starting URL of Web Scrape"
                  description="Show all urls "
                  placeholder="Search urls..."
                  rightSection={
                    <ActionIcon size="sm" variant="transparent" c="dimmed" onClick={() => setQuery('')}>
                      <IconX size={14} />
                    </ActionIcon>
                  }
                  value={query}
                  onChange={(e) => setQuery(e.currentTarget.value)}
                />
              ),
              filtering: query !== '',
            },
            {
              accessor: 'actions',
              title: <Box mr={6}>Actions</Box>,
              width: 81,
              render: (materials: any, index: number) => {
                const openModal = async (action: string) => {
                  let urlToOpen = materials.url;
                  if (!materials.url && materials.s3_path) {
                    const presignedUrl = await getPresignedUrl(materials.s3_path);
                    urlToOpen = presignedUrl;
                  }
                  if (action === 'view' && urlToOpen) {
                    console.log(urlToOpen);
                    window.open(urlToOpen, '_blank');
                  }
                  else if (action === 'delete') {
                    modals.openConfirmModal({
                      title: 'Please confirm your action',
                      children: (
                        <Text size="sm" style={{ color: 'white' }}>
                          {`Are you sure you want to delete the file: ${materials.s3_path ? materials.s3_path : materials.url}`}
                        </Text>
                      ),
                      labels: { confirm: 'Delete', cancel: 'Cancel' },
                      onConfirm: () => handleDelete(materials.course_name, materials.s3_path, materials.url),
                    });
                  }
                };

                return (
                  <ModalsProvider>
                    <Group>
                      <ActionIcon
                        size="sm"
                        variant="subtle"
                        color="green"
                        onClick={() => openModal('view')}
                      >
                        <IconEye size={16} />
                      </ActionIcon>
                      <ActionIcon
                        size="sm"
                        variant="subtle"
                        color="red"
                        onClick={() => openModal('delete')}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                  </ModalsProvider>
                );
              },
            },
          ]}
        selectedRecords={selectedRecords}
        onSelectedRecordsChange={(newSelectedRecords) => {
          if (newSelectedRecords.length > 0) {
            setSelectedRecords(newSelectedRecords);
          } else {
            setSelectedRecords([]);
          }
        }}
        idAccessor="readable_filename"
      />
      <Paper my="xl" py="xl" withBorder radius={0}>
        <Center>
          <Button
            uppercase
            leftIcon={<IconTrash size={16} />}
            color="red"
            disabled={!selectedRecords.length}
            onClick={async () => {
              if (selectedRecords.length) {
                modals.openConfirmModal({
                  title: 'Please confirm your action',
                  children: (
                    <Text size="sm" style={{ color: 'white' }}>
                      {`Are you sure you want to delete the selected records?`}
                    </Text>
                  ),
                  labels: { confirm: 'Delete', cancel: 'Cancel' },
                  onConfirm: async () => {
                    const promises = selectedRecords.map(record => handleDelete(record.readable_filename, record.s3_path, record.url));
                    await Promise.all(promises);
                  },
                });
              }
            }}
          >
            {selectedRecords.length
              ? `Delete ${selectedRecords.length === 1 ? 'one selected record' : `${selectedRecords.length} selected records`
              }`
              : 'Select records to delete'}
          </Button>
        </Center>
      </Paper>
    </>
  );
}

async function fetchCourseMetadata(course_name: string) {
  try {
    const response = await fetch(
      `/api/UIUC-api/getCourseMetadata?course_name=${course_name}`,
    )
    console.log('Response received while fetching metadata:', response)
    if (response.ok) {
      const data = await response.json()
      if (data.success === false) {
        throw new Error(
          data.message || 'An error occurred while fetching course metadata',
        )
      }
      // Parse is_private field from string to boolean
      if (
        data.course_metadata &&
        typeof data.course_metadata.is_private === 'string'
      ) {
        data.course_metadata.is_private =
          data.course_metadata.is_private.toLowerCase() === 'true'
      }
      return data.course_metadata
    } else {
      throw new Error(
        `Error fetching course metadata: ${response.statusText || response.status
        }`,
      )
    }
  } catch (error) {
    console.error('Error fetching course metadata:', error)
    throw error
  }
}