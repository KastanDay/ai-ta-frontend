'use client';

import { ActionIcon, Button, MultiSelect, Stack, TextInput } from '@mantine/core';
import { DatePicker, type DatesRangeValue } from '@mantine/dates';
import { useDebouncedValue } from '@mantine/hooks';
import { IconSearch, IconX } from '@tabler/icons-react';
import { DataTable } from 'mantine-datatable';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { getCourseDocuments } from '~/pages/api/UIUC-api/getDocsForMaterials';
// import { employees } from '~/data';
// const initialRecords = employees.slice(0, 100);

interface CourseFile {
  name: string
  s3_path: string
  course_name: string
  readable_filename: string
  // type: string
  url: string
  base_url: string
}

interface CourseFilesListProps {
  course_materials: CourseFile[]
}

export function ComplexUsageExample({ course_materials }: CourseFilesListProps) {
  const [materials, setMaterials] = useState(course_materials);

  // const departments = useMemo(() => {
  //   const departments = new Set(employees.map((e) => e.department.name));
  //   return [...departments];
  // }, []);
  const [query, setQuery] = useState('');
  const [ReadableFilename, setReadableFilename] = useState<string[]>([]);
  const [debouncedQuery] = useDebouncedValue(query, 200);

  useEffect(() => {
    setMaterials(
      course_materials.filter(({ readable_filename, url, base_url }) => {
        const lowerCaseDebouncedQuery = debouncedQuery.trim().toLowerCase();
        if (
          debouncedQuery !== '' &&
          !`${readable_filename}`.toLowerCase().includes(lowerCaseDebouncedQuery)
        ) {
          return false;
        }

        if (
          debouncedQuery !== '' &&
          !`${url}`.toLowerCase().includes(lowerCaseDebouncedQuery)
        ) {
          return false;
        }

        if (
          debouncedQuery !== '' &&
          !`${base_url}`.toLowerCase().includes(lowerCaseDebouncedQuery)
        ) {
          return false;
        }
        return true;
      })
    );
  }, [debouncedQuery]);

  return (
    <DataTable
      height={300}
      // withTableBorder
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
              // leftSection={<IconSearch size={16} />}
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
          accessor: 'URL',
          render: ({ url }) => `${url}`,
          filter: (
            <TextInput
              label="URL"
              description="Show all urls "
              placeholder="Search urls..."
              // leftSection={<IconSearch size={16} />}
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
              // leftSection={<IconSearch size={16} />}
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
      ]}
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