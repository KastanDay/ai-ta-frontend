'use client';

import { ActionIcon, Box, Button, Group, MultiSelect, Stack, TextInput, Text } from '@mantine/core';
import { DatePicker, type DatesRangeValue } from '@mantine/dates';
import { useDebouncedValue } from '@mantine/hooks';
import { IconEdit, IconEye, IconSearch, IconTrash, IconX } from '@tabler/icons-react';
import { DataTable, type DataTableSortStatus } from 'mantine-datatable';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { getCourseDocuments } from '~/pages/api/UIUC-api/getDocsForMaterials';
import { useRouter } from 'next/router';
import { modals, openConfirmModal, useModals, ModalsProvider } from '@mantine/modals';

// import { employees } from '~/data';
// const initialRecords = employees.slice(0, 100);

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

export function ComplexUsageExample({ course_materials }: CourseFilesListProps) {

  const router = useRouter();
  const getCurrentPageName = (): string => {
    const path = router.asPath;
    const courseName = path.slice(1).split('/')[0] || '';
    return courseName;
  }
  const [materials, setMaterials] = useState(course_materials);

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


  const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
    columnAccessor: 'File Name',
    direction: 'asc',
  });
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


  // const openModal = () => modals.openConfirmModal({
  //   title: 'Please confirm your action',
  //   children: (
  //     <Text size="sm">
  //       {`File Name: ${materials}`}
  //     </Text>
  //   ),
  //   labels: { confirm: 'Close', cancel: 'Cancel' },
  //   // onCancel: () => console.log('Cancel'),
  //   // onConfirm: () => console.log('Confirmed'),
  // });

  return (
    <DataTable
      height="65vh"
      withColumnBorders
      records={materials}
      columns={[
        {
          accessor: 'File Name',
          render: ({ readable_filename }) => `${readable_filename}`,
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
                  onClick={() => setQuery('')}>
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
          render: ({ url }) => `${url}`,
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
          accessor: 'Starting URL of Web Scape',
          render: ({ base_url }) => `${base_url}`,
          filter: (
            <TextInput
              label="Starting URL of Web Scape"
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
          title: <Box mr={6}>Row actions</Box>,
          render: (materials) => {
            const openModal = (materials: any, action: string) => modals.openConfirmModal({
              title: 'Please confirm your action',
              children: (
                <Text size="sm">
                  {`File Name: ${materials.readable_filename}`}
                </Text>
              ),
              labels: { confirm: 'Close', cancel: 'Cancel' },
            });

            return (
              <ModalsProvider>
                <Group>
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    color="green"
                    onClick={() => openModal(materials, 'view')}
                  >
                    <IconEye size={16} />
                  </ActionIcon>
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    color="red"
                    onClick={() => openModal(materials, 'delete')}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
              </ModalsProvider>
            );
          },
        },
      ]}
      sortStatus={sortStatus}
      onSortStatusChange={setSortStatus}
    />
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