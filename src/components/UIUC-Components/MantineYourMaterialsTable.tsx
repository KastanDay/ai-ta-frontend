'use client'

import {
  ActionIcon,
  Box,
  Button,
  Modal,
  Group,
  MultiSelect,
  TextInput,
  Text,
  createStyles,
  Paper,
  Center,
  ScrollArea,
  Table,
  Switch,
} from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import {
  IconEye,
  IconSearch,
  IconTrash,
  IconX,
} from '@tabler/icons-react'
import { DataTable, type DataTableSortStatus } from 'mantine-datatable'
import { useEffect, useMemo, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import { showToastOnFileDeleted } from './MakeOldCoursePage'
import axios from 'axios'
import { showNotification } from '@mantine/notifications'
import { createGlobalStyle } from 'styled-components'
import { useColorScheme } from '@mantine/hooks'

import { CourseDocument } from 'src/types/courseMaterials'

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
}))

interface CourseFilesListProps {
  course_materials: CourseDocument[]
}

export async function getPresignedUrl(s3_path: string) {
  const response = await fetch(
    `/api/UIUC-api/getPresignedUrl?s3_path=${s3_path}`,
  )
  const data = await response.json()
  return data.presignedUrl
}

type DocumentGroupOption = {
  value: string
  label: string
  numDocs?: number
  enabled?: boolean
}

type EnabledDocsState = {
  [docId: string]: boolean
}

const PAGE_SIZE = 100

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
  const [materials, setMaterials] = useState<CourseDocument[]>([])
  const [selectedRecords, setSelectedRecords] = useState<CourseDocument[]>([])

  // Add state hooks for doc_groups and a method to fetch them
  const [documentGroups, setDocumentGroups] = useState<DocumentGroupOption[]>(
    [],
  )

  const [page, setPage] = useState(1);
  const [totalDocuments, setTotalDocuments] = useState(0);

  useEffect(() => {
    const from = (page - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE
    // get paginated records from the list
    // setRecords(employees.slice(from, to));
  }, [page])

  const getDocumentId = (document: CourseDocument): string => {
    const s3_path = document.s3_path || 'null'
    const url = document.url || 'null'
    return `${s3_path}-${url}`
  }

  const [enabledDocs, setEnabledDocs] = useState<EnabledDocsState>({})

  const hasFetchedEnabledDocGroups = useRef(false)

  const [documentGroupSearch, setDocumentGroupSearch] = useState('')

  const [defaultGroupCount, setDefaultGroupCount] = useState(0)

  // Logic to filter doc_groups based on the search query
  const filteredDocumentGroups = useMemo(() => {
    return documentGroups.filter((doc_group_obj) =>
      doc_group_obj.value
        ?.toLowerCase()
        .includes(documentGroupSearch?.toLowerCase()),
    )
  }, [documentGroups, documentGroupSearch])

  // Handle doc_group search change
  const handleDocumentGroupSearchChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setDocumentGroupSearch(event.target.value)
  }

  const fetchDocumentGroups = async (page: number) => {
    try {
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const response = await fetch(
        `/api/materialsTable/fetchProjectMaterials?from=${from}&to=${to}&course_name=${getCurrentPageName()}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch document groups');
      }

      const data = await response.json();
      console.log("response_data: " + data)
      console.log(data)
      const documents = data.final_docs;
      const totalCount = data.total_count;

      setTotalDocuments(totalCount);
      setMaterials(documents);
  
      const document_groups_response = await fetch('/api/documentGroups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'getDocumentGroups',
          courseName: getCurrentPageName(),
        }),
      });
  
      if (!document_groups_response.ok) {
        throw new Error('Failed to fetch document groups');
      }
  
      const document_groups_data = await document_groups_response.json();
      const documentGroups = document_groups_data.documents;
  
      const doc_groups_array: DocumentGroupOption[] = documentGroups
        .filter((doc_group: any) => doc_group.doc_count >= 1)
        .map((doc_group: any) => ({
          value: doc_group.name,
          label: doc_group.name,
          numDocs: doc_group.doc_count,
          enabled: doc_group.enabled,
        }));
  
      setDocumentGroups(doc_groups_array);
      // const updatedMaterials = documents.map((doc: any) => ({
      //   ...doc,
      //   doc_groups: doc.doc_groups ? doc.doc_groups.map((group: any) => group.name) : [],
      // }));
  
      // setMaterials(updatedMaterials);
    } catch (error) {
      console.error('Error fetching document groups:', error);
    }
  };

  useEffect(() => {
    fetchDocumentGroups(page); // Fetch the new documents for the current page
  }, [page]);

  // useEffect(() => {
  //   console.log("materials: " + materials);
  //   console.log(materials);
  // }, [materials]);

  // useEffect(() => {
  //   console.log("documentGroups: " + documentGroups);
  //   console.log(documentGroups);
  // }, [documentGroups]);

  const [query, setQuery] = useState('')
  const [debouncedQuery] = useDebouncedValue(query, 200)
  const [modalOpened, setModalOpened] = useState(false)
  const [recordsToDelete, setRecordsToDelete] = useState<CourseDocument[]>([])

  const handleDelete = async (recordsToDelete: CourseDocument[]) => {
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

  const handleCreateDocumentGroup = (
    doc_group_name: string,
  ): DocumentGroupOption => {
    const newDocumentGroup: DocumentGroupOption = {
      value: doc_group_name,
      label: doc_group_name,
    }
    // Check if the doc_group already exists by its value to prevent duplicates
    if (
      !documentGroups.some((doc_group) => doc_group.value === doc_group_name)
    ) {
      setDocumentGroups([...documentGroups, newDocumentGroup])
      // Optionally persist this new doc_group to your backend here
    }
    return newDocumentGroup
  }

  // Create a queue to store the fetch promises
  let fetchQueue = Promise.resolve()

  // Create a queue to store the state update functions
  let stateUpdateQueue = Promise.resolve()

  const handleAppendDocumentGroup = async (
    record: CourseDocument,
    appendedGroup: string,
  ) => {
    try {
      // Update the local state
      stateUpdateQueue = stateUpdateQueue.then(() => {
        setMaterials((prevMaterials) => {
          const updatedMaterials = prevMaterials.map((material) => {
            if (getDocumentId(material) === getDocumentId(record)) {
              const doc_groups = Array.isArray(material.doc_groups)
                ? [...material.doc_groups, appendedGroup]
                : [appendedGroup];
              return { ...material, doc_groups };
            }
            return material;
          });
          return updatedMaterials;
        });
  
        // Update documentGroups state
        setDocumentGroups((prevDocumentGroups) => {
          const existingGroup = prevDocumentGroups.find(
            (group) => group.value === appendedGroup,
          );
          if (existingGroup) {
            return prevDocumentGroups.map((group) =>
              group.value === appendedGroup
                ? { ...group, numDocs: (group.numDocs || 0) + 1 }
                : group,
            );
          } else {
            return [
              ...prevDocumentGroups,
              { value: appendedGroup, label: appendedGroup, numDocs: 1 },
            ];
          }
        });
      });
  
      // Queue the API request to update the backend
      fetchQueue = fetchQueue.then(async () => {
        const response = await fetch('/api/documentGroups', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'appendDocGroup',
            courseName: getCurrentPageName(),
            doc: record,
            docGroup: appendedGroup,
          }),
        });
  
        if (!response.ok) {
          throw new Error('Failed to append document group');
        }
      });
    } catch (error) {
      console.error('Failed to append document group:', error);
      showNotification({
        title: 'Error',
        message: 'Failed to append document group',
      });
    }
  };
  
  const handleRemoveDocumentGroup = async (
    record: CourseDocument,
    removedGroup: string,
  ) => {
    try {
      // Update the local state
      stateUpdateQueue = stateUpdateQueue.then(() => {
        setMaterials((prevMaterials) => {
          const updatedMaterials = prevMaterials.map((material) => {
            if (getDocumentId(material) === getDocumentId(record)) {
              const doc_groups = Array.isArray(material.doc_groups)
                ? material.doc_groups.filter((group) => group !== removedGroup)
                : [];
              return { ...material, doc_groups };
            }
            return material;
          });
          return updatedMaterials;
        });
  
        // Update documentGroups state
        setDocumentGroups((prevDocumentGroups) => {
          const existingGroup = prevDocumentGroups.find(
            (group) => group.value === removedGroup,
          );
          if (
            existingGroup &&
            existingGroup.numDocs &&
            existingGroup.numDocs > 1
          ) {
            return prevDocumentGroups.map((group) =>
              group.value === removedGroup
                ? { ...group, numDocs: (group.numDocs || 0) - 1 }
                : group,
            );
          } else {
            return prevDocumentGroups.filter(
              (group) => group.value !== removedGroup,
            );
          }
        });
      });
  
      // Queue the API request to update the backend
      fetchQueue = fetchQueue.then(async () => {
        const response = await fetch('/api/documentGroups', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'removeDocGroup',
            courseName: getCurrentPageName(),
            doc: record,
            docGroup: removedGroup,
          }),
        });
  
        if (!response.ok) {
          throw new Error('Failed to remove document group');
        }
      });
    } catch (error) {
      console.error('Failed to remove document group:', error);
      showNotification({
        title: 'Error',
        message: 'Failed to remove document group',
      });
    }
  };

  const handleDocumentGroupsChange = async (
    doc_group_obj: DocumentGroupOption,
    enabled: boolean
  ) => {
    try {
      const response = await fetch('/api/documentGroups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'updateDocGroupStatus',
          courseName: getCurrentPageName(),
          docGroup: doc_group_obj.value,
          enabled: enabled,
        }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to update document group status');
      }
  
      // Refetch the document groups data after a successful update
      await fetchDocumentGroups(page);
    } catch (error) {
      console.error('Failed to update document group status:', error);
      showNotification({
        title: 'Error',
        message: 'Failed to update document group status',
      });
    }
  };

  return (
    <>
      <GlobalStyle />

      <ScrollArea
        style={{
          width: '100%',
          margin: 'auto',
          overflow: 'hidden',
          marginBottom: '20px',
        }}
      >
        <TextInput
          placeholder="Search by Document Group"
          mb="md"
          icon={<IconSearch />}
          value={documentGroupSearch}
          onChange={handleDocumentGroupSearchChange}
        />
        <Table style={{ width: '100%', tableLayout: 'fixed' }}>
          <thead>
            <tr>
              <th style={{ width: '50%', wordWrap: 'break-word' }}>
                Document Group
              </th>
              {/* <th style={{ width: '40%', wordWrap: 'break-word' }}>Description</th> */}
              <th style={{ width: '25%', wordWrap: 'break-word' }}>
                Number of Documents
              </th>
              <th style={{ width: '25%', wordWrap: 'break-word' }}>Enabled</th>
            </tr>
          </thead>
          <tbody>
            {filteredDocumentGroups.map((doc_group_obj, index) => (
              <tr key={index}>
                <td style={{ wordWrap: 'break-word' }}>
                  <Text>{doc_group_obj.value}</Text>
                </td>
                {/* <td style={{ wordWrap: 'break-word' }}>
                  <Text>{doc_group_obj.description}</Text>
                </td> */}
                <td style={{ wordWrap: 'break-word' }}>
                  <Text>
                    {doc_group_obj.value === 'Default Group'
                      ? defaultGroupCount
                      : doc_group_obj.numDocs}
                  </Text>
                </td>
                <td style={{ wordWrap: 'break-word' }}>
                <Switch
                  checked={doc_group_obj.enabled}
                  onChange={(event) =>
                    handleDocumentGroupsChange(doc_group_obj, event.currentTarget.checked)
                  }
                  color="blue"
                  size="lg"
                  onLabel="Enabled"
                  offLabel="Disabled"
                />
                </td>
              </tr>
            ))}
            {filteredDocumentGroups.length === 0 && (
              <tr>
                <td colSpan={4}>
                  <Text align="center">No document groups found</Text>
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </ScrollArea>

      <DataTable
        rowStyle={(row) => {
          if (selectedRecords.includes(row)) {
            return { backgroundColor: 'hsla(280, 100%, 70%, 0.5)' }
          }
          return {}
        }}
        page={page}
        onPageChange={setPage}
        totalRecords={totalDocuments}
        recordsPerPage={PAGE_SIZE}
        borderRadius="lg"
        withColumnBorders
        withBorder={true}
        striped
        highlightOnHover
        style={{ width: '100%' }}
        height="80vh"
        records={materials}
        columns={[
          {
            accessor: 'Name',
            width: 200,
            render: ({ readable_filename }) =>
              readable_filename ? (
                <div style={{ wordWrap: 'break-word' }}>{readable_filename}</div>
              ) : (
                ''
              ),
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
            width: 200,
            render: ({ url }) => (
              <div style={{ wordWrap: 'break-word' }}>{url ? url : ''}</div>
            ),
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
            width: 200,
            render: ({ base_url }) => (
              <div style={{ wordWrap: 'break-word' }}>{base_url ? base_url : ''}</div>
            ),
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
            accessor: 'doc_group',
            title: 'Document Groups',
            width: 300,
            render: (record) => (
              <Group position="apart" spacing="xs">
                <MultiSelect
                  data={record.doc_groups ? record.doc_groups : []}
                  value={record.doc_groups ? record.doc_groups : []}
                  placeholder="Select Group"
                  searchable
                  nothingFound="No options"
                  creatable
                  getCreateLabel={(query) => `+ Create ${query}`}
                  onCreate={(doc_group_name) => {
                    const newDocumentGroup = handleCreateDocumentGroup(doc_group_name)
                    return newDocumentGroup
                  }}
                  onChange={async (newSelectedGroups) => {
                    const doc_groups = record.doc_groups ? record.doc_groups : []

                    const removedGroups = doc_groups.filter(
                      (group) => !newSelectedGroups.includes(group),
                    )
                    const appendedGroups = newSelectedGroups.filter(
                      (group) => !doc_groups.includes(group),
                    )

                    if (removedGroups.length > 0) {
                      for (const removedGroup of removedGroups) {
                        await handleRemoveDocumentGroup(record, removedGroup)
                      }
                    }
                    if (appendedGroups.length > 0) {
                      for (const appendedGroup of appendedGroups) {
                        await handleAppendDocumentGroup(record, appendedGroup)
                      }
                    }
                  }}
                  sx={{ flex: 1, width: '100%' }}
                />
              </Group>
            ),
          },
          {
            accessor: 'actions',
            title: <Box mr={6}>Actions</Box>,
            width: 68,
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
              ? `Delete ${selectedRecords.length === 1
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
        `Error fetching course metadata: ${response.statusText || response.status
        }`,
      )
    }
  } catch (error) {
    console.error('Error fetching course metadata:', error)
    throw error
  }
}
