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
  Select,
  ScrollArea,
  Table,
  Switch,
  Checkbox,
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

interface CourseDocument {
  id: string; // Add this line
  course_name: string
  readable_filename: string
  url: string
  s3_path: string
  created_at: string
  base_url: string
  doc_groups: string[]
}

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

type DocumentGroupOption = { value: string; label: string; description?: string; numDocs?: number };// Define the type for the enabledDocs state
type EnabledDocsState = {
  [docId: string]: boolean;
};

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
  const [selectedRecords, setSelectedRecords] = useState<CourseDocument[]>([])

  // Add state hooks for doc_groups and a method to fetch them
  const [documentGroups, setDocumentGroups] = useState<DocumentGroupOption[]>([]);
  const [loadingDocumentGroups, setLoadingDocumentGroups] = useState(false);

  // Example state for document toggle, replace with actual logic
  // Example state for document toggle, replace with actual logic
  const [enabledDocs, setEnabledDocs] = useState<EnabledDocsState>(course_materials.reduce((acc, doc) => ({
    ...acc,
    [doc.id]: true, // Set to true to enable all document groups by default
  }), {}));

  const [documentGroupSearch, setDocumentGroupSearch] = useState('');

  const [defaultGroupCount, setDefaultGroupCount] = useState(0);


  // Logic to filter doc_groups based on the search query
  const filteredDocumentGroups = useMemo(() => {
    return documentGroups.filter(doc_group_obj =>
      doc_group_obj.value.toLowerCase().includes(documentGroupSearch.toLowerCase())
    );
  }, [documentGroups, documentGroupSearch]);

  // Handle doc_group search change
  const handleDocumentGroupSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDocumentGroupSearch(event.target.value);
  };

  const handleToggleChange = (docId: string) => {
    setEnabledDocs(prevState => ({
      ...prevState,
      [docId]: !prevState[docId],
    }));
  };

  useEffect(() => {
    const doc_group_set = new Set<string>(); // Explicitly state that doc_group_set is a Set of strings
    let defaultGroupCount = 0; // Initialize a local variable to count the documents in the default group
  
    course_materials.forEach(doc => {
      if (doc.doc_groups && doc.doc_groups.length > 0) { // Check if doc_groups is defined and not empty
        doc.doc_groups.forEach(doc_group => {
          doc_group_set.add(doc_group); // Add each doc_group to the Set
        });
      } else {
        // If no doc_groups, increment the count for the default group
        defaultGroupCount++; 
      }
    });
  
    const doc_groups_array = Array.from(doc_group_set).map((doc_group: string) => ({ value: doc_group, label: doc_group }));
    setDocumentGroups(doc_groups_array);
  
    // Initialize enabledDocs state with doc_group values
    const initialEnabledDocsState = Array.from(doc_group_set).reduce((acc, doc_group) => ({
      ...acc,
      [doc_group]: true, // Set to true to enable all document groups by default
    }), {});
    setEnabledDocs(initialEnabledDocsState);
  
    // Update the state variable for default group count
    setDefaultGroupCount(defaultGroupCount);
  }, [course_materials]); // Add course_materials as a dependency

  // // Define the state variable for default group count
  // const [defaultGroupCount, setDefaultGroupCount] = useState(0);

  // // This useEffect hook processes course_materials to create a unique list of doc_groups
  // // This useEffect hook processes course_materials to create a unique list of doc_groups
  // useEffect(() => {
  //   const doc_group_set = new Set<string>(); // Explicitly state that doc_group_set is a Set of strings
  //   let defaultGroupCount = 0; // Initialize a local variable to count the documents in the default group

  //   course_materials.forEach(doc => {
  //     if (doc.doc_groups && doc.doc_groups.length > 0) { // Check if doc_groups is defined and not empty
  //       doc.doc_groups.forEach(doc_group => {
  //         doc_group_set.add(doc_group); // Add each doc_group to the Set
  //       });
  //     } else {
  //       // If no doc_groups, increment the count for the default group
  //       defaultGroupCount++; 
  //     }
  //   });

  //   const doc_groups_array = Array.from(doc_group_set).map((doc_group: string) => ({ value: doc_group, label: doc_group }));
  //   setDocumentGroups(doc_groups_array);

  //   // Initialize enabledDocs state with doc_group values
  //   const initialEnabledDocsState = Array.from(doc_group_set).reduce((acc, doc_group) => ({
  //     ...acc,
  //     [doc_group]: true, // Set to true to enable all document groups by default
  //   }), {});
  //   setEnabledDocs(initialEnabledDocsState);

  //   // Update the state variable for default group count
  //   setDefaultGroupCount(defaultGroupCount);
  // }, [course_materials]); // Add course_materials as a dependency

  // useEffect(() => {
  //   const fetchDocumentGroups = async () => {
  //     setLoadingDocumentGroups(true);
  //     try {
  //       const response = await axios.get('/api/path-to-get-doc_groups');
  //       // Assuming response.data is an array of strings ['doc_group1', 'doc_group2', ...]
  //       setDocumentGroups(response.data.map((doc_groups: string[]) => ({ value: doc_groups, label: doc_groups })));
  //     } catch (error) {
  //       console.error('Failed to fetch doc_groups', error);
  //     } finally {
  //       setLoadingDocumentGroups(false);
  //     }
  //   };
  
  //   fetchDocumentGroups();
  // }, []);  

  // useEffect(() => {
  //   const fetchCourseDocuments = async () => {
  //     const response = await fetch(`/api/UIUC-api/getCourseDocuments`, {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({
  //         course_name: getCurrentPageName(),
  //       }),
  //     })
  //     const documents = await response.json()
  //     if (documents) {
  //       setMaterials(documents)
  //     }
  //   }

  //   fetchCourseDocuments()
  // }, [])

  // const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
  //   columnAccessor: 'File Name',
  //   direction: 'asc',
  // });

  const [query, setQuery] = useState('')
  const [debouncedQuery] = useDebouncedValue(query, 200)
  const [modalOpened, setModalOpened] = useState(false)
  const [recordsToDelete, setRecordsToDelete] = useState<CourseDocument[]>([])

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

  const handleDelete = async (recordsToDelete: CourseDocument[]) => {
    try {
      const API_URL = 'https://flask-doc-groups.up.railway.app'
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

  // Handle doc_group changes for a document (assuming record has a unique identifier such as 'id')
  const handleDocumentGroupsChange = async (record: CourseDocument, selectedDocumentGroups: string[]) => {
    try {
      const response = await fetch(
        `https://flask-doc-groups.up.railway.app/addDocumentToGroup`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            course_name: getCurrentPageName(),
            document: record,
            doc_groups: record.doc_groups,
          }),
        },
      )
  
      // Check if the response from the backend is successful.
      if (!response.ok) {
        throw new Error('Failed to update the doc_group on the backend.');
      }
  
      // Assuming the backend has successfully updated the doc_group, update the local state.
      // This step ensures the UI reflects the new doc_group without needing to reload the data from the backend.
      const updatedMaterials = materials.map((material) => {
        if (material.id === record.id) {
          return { ...material, doc_groups: selectedDocumentGroups };
        }
        return material;
      });
  
      // Update the state with the new materials array.
      setMaterials(updatedMaterials);
  
      // Show a success notification to the user.
      showNotification({
        title: 'Success',
        message: 'DocumentGroup updated successfully',
      });
    } catch (error) {
      // Narrow down the error type to an instance of Error
      if (error instanceof Error) {
        console.error('Failed to update doc_group:', error.message);
        showNotification({
          title: 'Error',
          message: `Failed to update doc_group: ${error.message}`,
        });
      } else {
        // Handle cases where the error might not be an instance of Error
        console.error('Failed to update doc_group, an unknown error occurred');
        showNotification({
          title: 'Error',
          message: 'Failed to update doc_group: An unknown error occurred',
        });
      }
    }
  };

  const handleCreateDocumentGroup = (doc_group_name: string): DocumentGroupOption => {
    const newDocumentGroup: DocumentGroupOption = { value: doc_group_name, label: doc_group_name };
    // Check if the doc_group already exists by its value to prevent duplicates
    if (!documentGroups.some(doc_group => doc_group.value === doc_group_name)) {
      setDocumentGroups([...documentGroups, newDocumentGroup]);
      // Optionally persist this new doc_group to your backend here
    }
    return newDocumentGroup;
  };

  const handleRemoveDocumentGroup = async (record: CourseDocument, removedGroup: string) => {
    try {
      const response = await fetch(
        `https://flask-doc-groups.up.railway.app/removeDocumentFromGroup`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            course_name: getCurrentPageName(),
            document: record,
            doc_group: removedGroup,
          }),
        },
      );
  
      if (!response.ok) {
        throw new Error('Failed to remove the document group on the backend.');
      }
  
      const updatedMaterials = materials.map((material) => {
        if (material.id === record.id) {
          // Ensure doc_groups is an array before trying to filter it
          const doc_groups = Array.isArray(material.doc_groups) ? material.doc_groups : [];
          return { ...material, doc_groups: doc_groups.filter(group => group !== removedGroup) };
        }
        return material;
      });
    
      setMaterials(updatedMaterials);
  
      // Show a success notification to the user.
      showNotification({
        title: 'Success',
        message: 'Document group removed successfully',
      });
    } catch (error) {
      // Handle error
      if (error instanceof Error) {
        showNotification({
          title: 'Error',
          message: `Failed to remove document group: ${error.message}`,
        });
      } else {
        // Handle cases where the error might not be an instance of Error
        console.error('Failed to remove document group, an unknown error occurred');
        showNotification({
          title: 'Error',
          message: 'Failed to remove document group: An unknown error occurred',
        });
      }
    }
  };
  
  const handleAppendDocumentGroup = async (record: CourseDocument, appendedGroup: string) => {
    try {
      const response = await fetch(
        `https://flask-doc-groups.up.railway.app/appendDocumentToGroup`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            course_name: getCurrentPageName(),
            document: record,
            doc_group: appendedGroup,
          }),
        },
      );
  
      if (!response.ok) {
        throw new Error('Failed to append the document group on the backend.');
      }
  
      // Update the local state
      const updatedMaterials = materials.map((material) => {
        if (material.id === record.id) {
          // Ensure doc_groups is an array before trying to spread it
          const doc_groups = Array.isArray(material.doc_groups) ? material.doc_groups : [];
          return { ...material, doc_groups: [...doc_groups, appendedGroup] };
        }
        return material;
      });

      // Set the updated materials array
      setMaterials(updatedMaterials);
    
      // Show a success notification to the user.
      showNotification({
        title: 'Success',
        message: 'Document group appended successfully',
      });
    } catch (error) {
      // Handle error
      if (error instanceof Error) {
        showNotification({
          title: 'Error',
          message: `Failed to append document group: ${error.message}`,
        });
      } else {
        // Handle cases where the error might not be an instance of Error
        console.error('Failed to append document group, an unknown error occurred');
        showNotification({
          title: 'Error',
          message: 'Failed to append document group: An unknown error occurred',
        });
      }
    }
  };
  

// No longer returning a specific type since the function is intended for side effects (state update)



  return (
    <>
      <GlobalStyle />

      <ScrollArea style={{ width: '100%', margin: 'auto', borderRadius: '10px', overflow: 'hidden', marginBottom: '20px' }}>
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
              <th style={{ width: '50%', wordWrap: 'break-word' }}>Document Group</th>
              {/* <th style={{ width: '40%', wordWrap: 'break-word' }}>Description</th> */}
              <th style={{ width: '25%', wordWrap: 'break-word' }}>Number of Docs</th>
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
                    {doc_group_obj.value === 'Default Group' ? defaultGroupCount : doc_group_obj.numDocs}
                  </Text>
                </td>
                <td style={{ wordWrap: 'break-word' }}>
                  <Switch
                    checked={enabledDocs[doc_group_obj.value]}
                    onChange={() => handleToggleChange(doc_group_obj.value)}
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
            accessor: 'doc_group',
            title: 'Document Groups',
            width: 200, // Increase this value to make the column wider
            render: (record) => (
              <Group position="apart" spacing="xs">
                <MultiSelect
                  data={documentGroups.map(doc_group => ({ value: doc_group.value, label: doc_group.label }))}
                  value={record.doc_groups ? record.doc_groups : []} // Ensure value is always an array
                  placeholder="Select Group"
                  searchable
                  nothingFound="No options"
                  creatable
                  getCreateLabel={(query) => `+ Create ${query}`}
                  onCreate={(doc_group_name) => {
                    const newDocumentGroup = handleCreateDocumentGroup(doc_group_name);
                    return newDocumentGroup;
                  }}
                  onChange={async (newSelectedGroups) => {
                    const removedGroups = record.doc_groups.filter(group => !newSelectedGroups.includes(group));
                    if (removedGroups.length > 0) {
                      // Handle deletion of removedGroups here
                      for (const removedGroup of removedGroups) {
                        await handleRemoveDocumentGroup(record, removedGroup);
                      }
                    }
                    const appendedGroups = newSelectedGroups.filter(group => !record.doc_groups.includes(group));
                    if (appendedGroups.length > 0) {
                      // Handle addition of appendedGroups here
                      for (const appendedGroup of appendedGroups) {
                        await handleAppendDocumentGroup(record, appendedGroup);
                      }
                    }
                  }}       
                  sx={{ flex: 1, width: '100%' }} // Add width: '100%'
                />
              </Group>
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
