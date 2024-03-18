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
import { IconEye, IconSearch, IconTrash, IconX } from '@tabler/icons-react'
import { DataTable } from 'mantine-datatable'
import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { showNotification } from '@mantine/notifications'
import { createGlobalStyle } from 'styled-components'

import { CourseDocument, DocumentGroup } from 'src/types/courseMaterials'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchPresignedUrl } from '~/utils/apiUtils'

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

const useStyles = createStyles((theme) => ({}))

const PAGE_SIZE = 100

export function ProjectFilesTable({ course_name }: { course_name: string }) {
  const { classes, theme } = useStyles()
  const queryClient = useQueryClient()
  const [docGroups, setDocGroups] = useState<Set<DocumentGroup>>(new Set())
  const [documentGroupSearch, setDocumentGroupSearch] = useState('')
  const [selectedRecords, setSelectedRecords] = useState<CourseDocument[]>([])
  const [query, setQuery] = useState('')
  const [debouncedQuery] = useDebouncedValue(query, 200)
  const [modalOpened, setModalOpened] = useState(false)
  const [recordsToDelete, setRecordsToDelete] = useState<CourseDocument[]>([])
  const [materials, setMaterials] = useState<CourseDocument[]>([])
  const [page, setPage] = useState(1)
  const [totalDocuments, setTotalDocuments] = useState(0)

  // ------------- Queries -------------

  const {
    data: documentGroups,
    refetch: refetchDocumentGroups,
    isLoading: isLoadingDocuments,
    isError: isErrorDocuments,
  } = useQuery<CourseDocument[]>(['documentGroups', course_name], async () => {
    try {
      const response = await fetch('/api/documentGroups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'getDocumentGroups',
          courseName: course_name,
        }),
      })
      console.log('response: ', response)
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
      const data = await response.json()
      const docGroups = data.documents

      setDocGroups(docGroups)
      return docGroups
    } catch (error) {
      console.error('Failed to fetch document groups:', error)
      showNotification({
        title: 'Error',
        message: 'Failed to fetch document groups',
        color: 'red',
        icon: <IconTrash size={24} />,
      })
    }
  })

  const { data: documents, refetch: refetchDocuments } = useQuery(
    ['documents', course_name],
    async () => {
      try {
        console.log('Fetching documents for page: ', page)
        const from = (page - 1) * PAGE_SIZE
        const to = from + PAGE_SIZE - 1

        const response = await fetch(
          `/api/materialsTable/fetchProjectMaterials?from=${from}&to=${to}&course_name=${course_name}`,
        )

        if (!response.ok) {
          throw new Error('Failed to fetch document groups')
        }

        const data = await response.json()
        console.log('response_data: ' + data)
        console.log(data)
        const documents = data.final_docs
        const totalCount = data.total_count

        setTotalDocuments(totalCount)
        setMaterials(documents)
        console.log('documentGroups:', docGroups)
        return documents
      } catch (error) {
        console.error('Failed to fetch documents:', error)
        showNotification({
          title: 'Error',
          message: 'Failed to fetch documents',
          color: 'red',
          icon: <IconTrash size={24} />,
        })
      }
    },
  )

  // ------------- Mutations -------------

  const createDocumentGroupMutation = useMutation(
    async ({ doc_group_name }: { doc_group_name: string }) => {
      const response = await fetch('/api/documentGroups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'createDocGroup',
          courseName: course_name,
          docGroup: doc_group_name,
        }),
      })
      if (!response.ok) {
        throw new Error('Failed to create document group')
      }
      return response.json()
    },
    {
      // Optimistically update the cache
      onMutate: async ({ doc_group_name }) => {
        await queryClient.cancelQueries(['documentGroups', course_name])
        const previousDocumentGroups = queryClient.getQueryData([
          'documentGroups',
          course_name,
        ])
        queryClient.setQueryData(
          ['documentGroups', course_name],
          (old: DocumentGroup[] | undefined) => {
            // Perform the optimistic update
            return [
              ...(old || []),
              {
                name: doc_group_name,
                enabled: true,
                doc_count: 1,
                course_name: course_name,
              },
            ]
          },
        )

        const previousDocuments = queryClient.getQueryData([
          'documents',
          course_name,
        ])
        queryClient.setQueryData(
          ['documents', course_name],
          (old: CourseDocument[] | undefined) => {
            // Perform the optimistic update
            return old?.map((doc) => {
              return {
                ...doc,
                doc_groups: [...(doc.doc_groups || []), doc_group_name],
              }
            })
          },
        )

        return { previousDocumentGroups }
      },
      onError: (err, variables, context) => {
        // Rollback on error
        queryClient.setQueryData(
          ['documentGroups', course_name],
          context?.previousDocumentGroups,
        )
      },
      onSettled: () => {
        // Refetch after mutation or error
        queryClient.invalidateQueries(['documentGroups', course_name])
        queryClient.invalidateQueries(['documents', course_name])
      },
    },
  )

  const appendDocumentGroupMutation = useMutation(
    async ({
      record,
      appendedGroup,
    }: {
      record: CourseDocument
      appendedGroup: string
    }) => {
      const response = await fetch('/api/documentGroups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'appendDocGroup',
          courseName: course_name,
          doc: record,
          docGroup: appendedGroup,
        }),
      })
      if (!response.ok) {
        throw new Error('Failed to append document group')
      }
      return response.json()
    },
    {
      // Optimistically update the cache
      onMutate: async ({ record, appendedGroup }) => {
        await queryClient.cancelQueries(['documentGroups', course_name])
        const previousDocumentGroups = queryClient.getQueryData([
          'documentGroups',
          course_name,
        ])
        queryClient.setQueryData(
          ['documentGroups', course_name],
          (old: DocumentGroup[] | undefined) => {
            // Perform the optimistic update
            return old?.map((docGroup) => {
              if (docGroup.name === appendedGroup) {
                return { ...docGroup, doc_count: (docGroup.doc_count || 0) + 1 }
              }
              return docGroup
            })
          },
        )

        const previousDocuments = queryClient.getQueryData([
          'documents',
          course_name,
        ])
        queryClient.setQueryData(
          ['documents', course_name],
          (old: CourseDocument[] | undefined) => {
            // Perform the optimistic update
            return old?.map((doc) => {
              if (doc.url === record.url || doc.s3_path === record.s3_path) {
                return {
                  ...doc,
                  doc_groups: [...(doc.doc_groups || []), appendedGroup],
                }
              }
              return doc
            })
          },
        )
        return { previousDocumentGroups }
      },
      onError: (err, variables, context) => {
        // Rollback on error
        queryClient.setQueryData(
          ['documentGroups', course_name],
          context?.previousDocumentGroups,
        )
      },
      onSettled: () => {
        // Refetch after mutation or error
        queryClient.invalidateQueries(['documentGroups', course_name])
        queryClient.invalidateQueries(['documents', course_name])
      },
    },
  )

  const removeDocumentGroupMutation = useMutation(
    async ({
      record,
      removedGroup,
    }: {
      record: CourseDocument
      removedGroup: string
    }) => {
      const response = await fetch('/api/documentGroups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'removeDocGroup',
          courseName: course_name,
          doc: record,
          docGroup: removedGroup,
        }),
      })
      if (!response.ok) {
        throw new Error('Failed to remove document group')
      }
      return response.json()
    },
    {
      // Optimistically update the cache
      onMutate: async ({ record, removedGroup }) => {
        await queryClient.cancelQueries(['documentGroups', course_name])
        const previousDocumentGroups = queryClient.getQueryData([
          'documentGroups',
          course_name,
        ])
        queryClient.setQueryData(
          ['documentGroups', course_name],
          (old: DocumentGroup[] | undefined) => {
            // Perform the optimistic update
            return old?.map((docGroup) => {
              if (docGroup.name === removedGroup) {
                return { ...docGroup, doc_count: (docGroup.doc_count || 0) - 1 }
              }
              return docGroup
            })
          },
        )

        const previousDocuments = queryClient.getQueryData([
          'documents',
          course_name,
        ])
        queryClient.setQueryData(
          ['documents', course_name],
          (old: CourseDocument[] | undefined) => {
            // Perform the optimistic update
            return old?.map((doc) => {
              if (doc.url === record.url || doc.s3_path === record.s3_path) {
                return {
                  ...doc,
                  doc_groups: (doc.doc_groups || []).filter(
                    (group) => group !== removedGroup,
                  ),
                }
              }
              return doc
            })
          },
        )
        return { previousDocumentGroups }
      },
      onError: (err, variables, context) => {
        // Rollback on error
        queryClient.setQueryData(
          ['documentGroups', course_name],
          context?.previousDocumentGroups,
        )
      },
      onSettled: () => {
        // Refetch after mutation or error
        queryClient.invalidateQueries(['documentGroups', course_name])
        queryClient.invalidateQueries(['documents', course_name])
      },
    },
  )

  const updateDocumentGroupStatusMutation = useMutation(
    async ({
      doc_group_obj,
      enabled,
    }: {
      doc_group_obj: DocumentGroup
      enabled: boolean
    }) => {
      const response = await fetch('/api/documentGroups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'updateDocGroupStatus',
          courseName: course_name,
          docGroup: doc_group_obj.name,
          enabled: enabled,
        }),
      })
      if (!response.ok) {
        throw new Error('Failed to update document group status')
      }
      return response.json()
    },
    {
      // Optimistically update the cache
      onMutate: async ({ doc_group_obj, enabled }) => {
        await queryClient.cancelQueries(['documentGroups', course_name])
        const previousDocumentGroups = queryClient.getQueryData([
          'documentGroups',
          course_name,
        ])
        queryClient.setQueryData(
          ['documentGroups', course_name],
          (old: DocumentGroup[] | undefined) => {
            // Perform the optimistic update
            return old?.map((docGroup) => {
              if (docGroup.name === doc_group_obj.name) {
                return { ...docGroup, enabled }
              }
              return docGroup
            })
          },
        )
        return { previousDocumentGroups }
      },
      onError: (err, variables, context) => {
        // Rollback on error
        queryClient.setQueryData(
          ['documentGroups', course_name],
          context?.previousDocumentGroups,
        )
      },
      onSettled: () => {
        // Refetch after mutation or error
        queryClient.invalidateQueries(['documentGroups', course_name])
      },
    },
  )

  const deleteDocumentMutation = useMutation(
    async (recordsToDelete: CourseDocument[]) => {
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
      await Promise.all(deletePromises)
    },
    {
      onMutate: async (recordsToDelete) => {
        await queryClient.cancelQueries(['documents', course_name])

        const previousDocuments = queryClient.getQueryData<CourseDocument[]>([
          'documents',
          course_name,
        ])

        queryClient.setQueryData<CourseDocument[]>(
          ['documents', course_name],
          (old = []) => {
            return old.filter(
              (doc) =>
                !recordsToDelete.find(
                  (record) =>
                    record.url === doc.url || record.s3_path === doc.s3_path,
                ),
            )
          },
        )

        return { previousDocuments }
      },
      onError: (err, variables, context) => {
        if (context?.previousDocuments) {
          queryClient.setQueryData(
            ['documents', course_name],
            context.previousDocuments,
          )
        }
      },
      onSettled: () => {
        queryClient.invalidateQueries(['documents', course_name])
        queryClient.invalidateQueries(['documentGroups', course_name])
      },
    },
  )

  // ------------- UseEffects -------------
  // useEffect(() => {
  //     if (documents && docGroups && ![...docGroups].some(group => group.name === "Default group")) {
  //         const defaultGroup = {
  //             name: "Default group",
  //             doc_count: totalDocuments,
  //             enabled: true,
  //             course_name: course_name,
  //         };
  //         setDocGroups(new Set([...docGroups, defaultGroup]));
  //     }
  // }, [documents, docGroups, totalDocuments, course_name]);

  useEffect(() => {
    if (debouncedQuery !== '') {
      const lowerCaseDebouncedQuery = debouncedQuery.trim().toLowerCase()
      setMaterials(
        (documents as CourseDocument[]).filter(
          ({ readable_filename, url, base_url }) => {
            return (
              `${readable_filename}`
                .toLowerCase()
                .includes(lowerCaseDebouncedQuery) ||
              `${url}`.toLowerCase().includes(lowerCaseDebouncedQuery) ||
              `${base_url}`.toLowerCase().includes(lowerCaseDebouncedQuery)
            )
          },
        ),
      )
    } else {
      setMaterials(documents as CourseDocument[])
    }
  }, [debouncedQuery, documents])

  useEffect(() => {
    console.log(
      'Invalidating documents query for page: ',
      page,
      ' docGroups:',
      docGroups,
    )
    queryClient.invalidateQueries(['documents', course_name])
    console.log(
      'After invalidating documents query for page: ',
      page,
      ' docGroups:',
      docGroups,
    )
  }, [page])

  // ------------- Functions -------------

  // Logic to filter doc_groups based on the search query
  const filteredDocumentGroups = useMemo(() => {
    return [...docGroups].filter((doc_group_obj) =>
      doc_group_obj.name
        ?.toLowerCase()
        .includes(documentGroupSearch?.toLowerCase()),
    )
  }, [docGroups, documentGroupSearch])

  // Handle doc_group search change
  const handleDocumentGroupSearchChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setDocumentGroupSearch(event.target.value)
  }

  return (
    <>
      <GlobalStyle />

      <ScrollArea
        style={{
          width: '100%',
          margin: 'auto',
          borderRadius: '10px',
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
                Number of Docs
              </th>
              <th style={{ width: '25%', wordWrap: 'break-word' }}>Enabled</th>
            </tr>
          </thead>
          <tbody>
            {filteredDocumentGroups.map((doc_group_obj, index) => (
              <tr key={index}>
                <td style={{ wordWrap: 'break-word' }}>
                  <Text>{doc_group_obj.name}</Text>
                </td>
                {/* <td style={{ wordWrap: 'break-word' }}>
                      <Text>{doc_group_obj.description}</Text>
                    </td> */}
                <td style={{ wordWrap: 'break-word' }}>
                  <Text>{doc_group_obj.doc_count}</Text>
                </td>
                <td style={{ wordWrap: 'break-word' }}>
                  <Switch
                    checked={doc_group_obj.enabled}
                    onChange={
                      (event) =>
                        updateDocumentGroupStatusMutation.mutate({
                          doc_group_obj,
                          enabled: event.currentTarget.checked,
                        })
                      // handleDocumentGroupsChange(doc_group_obj, event.currentTarget.checked)
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
        onPageChange={(p) => setPage(p)}
        totalRecords={totalDocuments}
        recordsPerPage={PAGE_SIZE}
        borderRadius="lg"
        withColumnBorders
        withBorder={true}
        striped
        highlightOnHover
        style={{
          width: '100%',
        }}
        // page={page} // TODO - Add pagination
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
                  data={[...docGroups].map((doc_group) => ({
                    value: doc_group.name || '',
                    label: doc_group.name || '',
                  }))}
                  value={record.doc_groups ? record.doc_groups : []}
                  placeholder="Select Group"
                  searchable
                  nothingFound="No options"
                  creatable
                  getCreateLabel={(query) => `+ Create ${query}`}
                  onCreate={(doc_group_name) => {
                    createDocumentGroupMutation.mutate({ doc_group_name })
                    return { value: doc_group_name, label: doc_group_name }
                  }}
                  onChange={async (newSelectedGroups) => {
                    const doc_groups = record.doc_groups
                      ? record.doc_groups
                      : []

                    const removedGroups = doc_groups.filter(
                      (group) => !newSelectedGroups.includes(group),
                    )
                    const appendedGroups = newSelectedGroups.filter(
                      (group) => !doc_groups.includes(group),
                    )

                    if (removedGroups.length > 0) {
                      for (const removedGroup of removedGroups) {
                        removeDocumentGroupMutation.mutate({
                          record,
                          removedGroup,
                        })
                      }
                    }
                    if (appendedGroups.length > 0) {
                      for (const appendedGroup of appendedGroups) {
                        appendDocumentGroupMutation.mutate({
                          record,
                          appendedGroup,
                        })
                      }
                    }
                  }}
                  // onChange={(newSelectedGroups) => handleDocumentGroupsChange(record, newSelectedGroups)}
                  sx={{ flex: 1, width: '100%' }}
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
                  const presignedUrl = await fetchPresignedUrl(
                    materials.s3_path,
                  )
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
              deleteDocumentMutation.mutate(recordsToDelete)
              // await handleDelete(recordsToDelete)
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
