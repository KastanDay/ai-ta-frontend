'use client'

import {
  ActionIcon,
  Box,
  Button,
  Modal,
  Group,
  MultiSelect,
  Stack,
  TextInput,
  Text,
  MantineProvider,
  createStyles,
  Paper,
  Center,
} from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import {
  IconEdit,
  IconEye,
  IconSearch,
  IconTrash,
  IconX,
} from '@tabler/icons-react'
import { DataTable, type DataTableSortStatus } from 'mantine-datatable'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import {
  modals,
  openConfirmModal,
  useModals,
  ModalsProvider,
} from '@mantine/modals'
import { showToastOnFileDeleted } from './MakeOldCoursePage'
import axios from 'axios'
import { showNotification } from '@mantine/notifications'
import { createGlobalStyle } from 'styled-components'
import { Badge } from '@mantine/core'
import { useColorScheme } from '@mantine/hooks'

const GlobalStyle = createGlobalStyle`
// these mantine class names may change in future versions

  .mantine-ja02in:checked {
    background-color: purple;
    border-color: hsl(280,100%,80%);
  } 

  .mantine-Table-root thead tr {
    background-color: #15162a; 
  }

  .mantine-7q4wt4 {
    background-color: hsl(280,100%,70%, 0);
  }

`

const useStyles = createStyles((theme) => ({
  // How to change header color
  // root: {
  //   '& tr': {
  //     backgroundColor: theme.colorScheme === 'dark' ? '#15162a' : '#fff',
  //   },
  //   '& tr:nth-child(odd)': {
  //     backgroundColor: theme.colorScheme === 'dark' ? '#15162a' : '#fff',
  //   },
  // },
  // selected: {
  //   backgroundColor: theme.colorScheme === 'dark' ? '#5a30b5' : '#d6b5f6', // purple color for selected row
  // },
  // hovered: {
  //   backgroundColor: theme.colorScheme === 'dark' ? '#5a30b5' : '#d6b5f6', // purple color for hovered row
  // },
}))

interface CourseDocuments {
  id: string; // Add this line
  course_name: string
  readable_filename: string
  url: string
  s3_path: string
  created_at: string
  base_url: string
  tags: string[]
}

interface CourseFilesListProps {
  course_materials: CourseDocuments[]
}

export async function getPresignedUrl(s3_path: string) {
  const response = await fetch(
    `/api/UIUC-api/getPresignedUrl?s3_path=${s3_path}`,
  )
  const data = await response.json()
  return data.presignedUrl
}

type TagOption = { value: string; label: string };

export function MantineYourMaterialsTable({
  course_materials,
}: CourseFilesListProps) {
  const { classes, theme } = useStyles()
  const colorScheme = useColorScheme()

  const router = useRouter()
  const getCurrentPageName = (): string => {
    const path = router.asPath
    const courseName = path.slice(1).split('/')[0] || ''
    return courseName
  }
  const [materials, setMaterials] = useState(course_materials)
  const [selectedRecords, setSelectedRecords] = useState<CourseDocuments[]>([])

  // Add state hooks for tags and a method to fetch them
  const [tags, setTags] = useState<TagOption[]>([]);
  const [loadingTags, setLoadingTags] = useState(false);

  useEffect(() => {
    const fetchTags = async () => {
      setLoadingTags(true);
      try {
        const response = await axios.get('/api/path-to-get-tags');
        // Assuming response.data is an array of strings ['tag1', 'tag2', ...]
        setTags(response.data.map((tag: string) => ({ value: tag, label: tag })));
      } catch (error) {
        console.error('Failed to fetch tags', error);
      } finally {
        setLoadingTags(false);
      }
    };
  
    fetchTags();
  }, []);  

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
      })
      const documents = await response.json()
      if (documents) {
        setMaterials(documents)
      }
    }

    fetchCourseDocuments()
  }, [])

  // const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
  //   columnAccessor: 'File Name',
  //   direction: 'asc',
  // });

  const [query, setQuery] = useState('')
  const [debouncedQuery] = useDebouncedValue(query, 200)
  const [modalOpened, setModalOpened] = useState(false)
  const [recordsToDelete, setRecordsToDelete] = useState<CourseDocuments[]>([])

  useEffect(() => {
    if (debouncedQuery !== '') {
      const lowerCaseDebouncedQuery = debouncedQuery.trim().toLowerCase()
      setMaterials(
        course_materials.filter(({ readable_filename, url, base_url }) => {
          return (
            `${readable_filename}`
              .toLowerCase()
              .includes(lowerCaseDebouncedQuery) ||
            `${url}`.toLowerCase().includes(lowerCaseDebouncedQuery) ||
            `${base_url}`.toLowerCase().includes(lowerCaseDebouncedQuery)
          )
        }),
      )
    } else {
      setMaterials(course_materials)
    }
  }, [debouncedQuery, course_materials])

  // useEffect(() => {
  //   // Clear the selected records when the component mounts
  //   setSelectedRecords([]);
  // }, []);

  const handleDelete = async (recordsToDelete: CourseDocuments[]) => {
    try {
      const API_URL = 'https://flask-production-751b.up.railway.app'
      const deletePromises = recordsToDelete.map((record) =>
        axios.delete(`${API_URL}/delete`, {
          params: {
            course_name: record.course_name,
            s3_path: record.s3_path,
            url: record.url,
          },
        }),
      )
      Promise.all(deletePromises)
        .then(() => {
          // Handle successful deletion, show a success message
          showToastOnFileDeleted(theme)
          // Start the timer to refresh the page only after all deletions are successful
          setTimeout(async () => {
            await router.reload()
          }, 3000)
        })
        .catch((error) => {
          console.error(error)
          // Show error message
          showToastOnFileDeleted(theme, true)
        })
    } catch (error) {
      console.error(error)
      // Show error message
      showToastOnFileDeleted(theme, true)
    }
  }

  // Handle tag changes for a document (assuming record has a unique identifier such as 'id')
  const handleTagsChange = async (record: CourseDocuments, selectedTags: string[]) => {
    try {
      // Assuming an endpoint that updates the tags for a document
      // and that the document's identifier is `record.id`
      await axios.post('/api/path-to-update-document-tags', {
        documentId: record.id,
        tags: selectedTags,
      });

      // Update the local state to reflect the change
      const updatedMaterials = materials.map((material) => {
        if (material.id === record.id) {
          return { ...material, tags: selectedTags };
        }
        return material;
      });
      setMaterials(updatedMaterials);

      showNotification({
        title: 'Success',
        message: 'Tags updated successfully',
      });
    } catch (error) {
      console.error('Failed to update tags', error);
      showNotification({
        title: 'Error',
        message: 'Failed to update tags',
      });
    }
  };

  const handleCreateTag = (tagName: string) => {
    const newTag: TagOption = { value: tagName, label: tagName };
    setTags(currentTags => [...currentTags, newTag]);
  
    // Directly return the new tag in a format compatible with the MultiSelect options
    // This assumes your MultiSelect component is configured to work with objects
    // having 'value' and 'label' properties, similar to your TagOption type.
    return tagName; // or return newTag if your setup can work directly with objects
  };
  
  

// No longer returning a specific type since the function is intended for side effects (state update)



  return (
    <>
      <GlobalStyle />

      <DataTable
        rowStyle={(row) => {
          if (selectedRecords.includes(row)) {
            return { backgroundColor: 'hsla(280, 100%, 70%, 0.5)' }
          }
          return {}
        }}
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
        columns={[
          {
            accessor: 'Name',
            render: ({ readable_filename }) =>
              readable_filename ? `${readable_filename}` : '',
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
            render: ({ url }) => (url ? `${url}` : ''),
            filter: (
              <TextInput
                label="URL"
                description="Show all urls that include the specified text"
                placeholder="Search urls..."
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
            accessor: 'The Starting URL of Web Scraping',
            render: ({ base_url }) => (base_url ? `${base_url}` : ''),
            filter: (
              <TextInput
                label="The Starting URL of Web Scraping"
                description="Show all urls that include the specified text"
                placeholder="Search urls..."
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
            accessor: 'tags',
            title: 'Tags',
            render: (record) => (
              <MultiSelect
                data={tags.map(tag => ({ value: tag.value, label: tag.label }))}
                value={record.tags}
                onChange={(selectedValue) => handleTagsChange(record, selectedValue)}
                placeholder="Select tags"
                searchable
                nothingFound="No options"
                creatable
                getCreateLabel={(query) => `+ Create ${query}`}
                onCreate={handleCreateTag}
                />
            ),
          },
          {
            accessor: 'actions',
            title: <Box mr={6}>Actions</Box>,
            width: 81,
            render: (materials: any, index: number) => {
              const openModal = async (action: string) => {
                let urlToOpen = materials.url
                if (!materials.url && materials.s3_path) {
                  const presignedUrl = await getPresignedUrl(materials.s3_path)
                  urlToOpen = presignedUrl
                }
                if (action === 'view' && urlToOpen) {
                  window.open(urlToOpen, '_blank')
                } else if (action === 'delete') {
                  setRecordsToDelete([materials])
                  setModalOpened(true)
                }
              }

              return (
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
              )
            },
          },
        ]}
        selectedRecords={selectedRecords}
        onSelectedRecordsChange={(newSelectedRecords) => {
          if (newSelectedRecords.length > 0) {
            setSelectedRecords(newSelectedRecords)
            console.log('New selection:', newSelectedRecords)
          } else {
            setSelectedRecords([])
          }
        }}
        idAccessor={(row: any) => (row.url ? row.url : row.s3_path)}
      />
      <Paper
        my="sm"
        py="sm"
        withBorder={false}
        radius={0}
        style={{ backgroundColor: 'transparent' }}
      >
        <Center>
          <Button
            uppercase
            leftIcon={<IconTrash size={16} />}
            disabled={!selectedRecords.length}
            onClick={() => {
              setRecordsToDelete(selectedRecords)
              setModalOpened(true)
            }}
            style={{
              backgroundColor: selectedRecords.length
                ? '#8B0000'
                : 'transparent',
            }}
          >
            {selectedRecords.length
              ? `Delete ${
                  selectedRecords.length === 1
                    ? '1 selected record'
                    : `${selectedRecords.length} selected records`
                }`
              : 'Select records to delete'}
          </Button>
        </Center>
      </Paper>
      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        title="Please confirm your action"
      >
        <Text size="sm" style={{ color: 'white' }}>
          {`Are you sure you want to delete the selected records?`}
        </Text>
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginTop: '20px',
          }}
        >
          <Button
            className="min-w-[3rem] -translate-x-1 transform rounded-s-md bg-purple-800 text-white hover:border-indigo-600 hover:bg-indigo-600 hover:text-white focus:shadow-none focus:outline-none"
            onClick={() => {
              setModalOpened(false)
            }}
            style={{
              backgroundColor: 'transparent',
              marginRight: '7px',
            }}
          >
            Cancel
          </Button>
          <Button
            className="min-w-[3rem] -translate-x-1 transform rounded-s-md bg-purple-800 text-white hover:border-indigo-600 hover:bg-indigo-600 hover:text-white focus:shadow-none focus:outline-none"
            onClick={async () => {
              setModalOpened(false)
              console.log('Deleting records:', recordsToDelete)
              await handleDelete(recordsToDelete)
              setRecordsToDelete([])
            }}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </>
  )
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
        `Error fetching course metadata: ${
          response.statusText || response.status
        }`,
      )
    }
  } catch (error) {
    console.error('Error fetching course metadata:', error)
    throw error
  }
}
