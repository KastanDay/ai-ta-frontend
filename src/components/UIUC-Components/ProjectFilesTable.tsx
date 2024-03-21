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
  Table,
  Switch,
  Stack,
  Image,
} from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { IconEye, IconTrash, IconX } from '@tabler/icons-react'
import { DataTable } from 'mantine-datatable'
import { useState } from 'react'
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

const PAGE_SIZE = 100

export function ProjectFilesTable({ course_name }: { course_name: string }) {
  const queryClient = useQueryClient()
  const [selectedRecords, setSelectedRecords] = useState<CourseDocument[]>([])
  const [query, setQuery] = useState('')
  const [modalOpened, setModalOpened] = useState(false)
  const [recordsToDelete, setRecordsToDelete] = useState<CourseDocument[]>([])
  const [page, setPage] = useState(1)

  // ------------- Queries -------------
  const {
    data: documents,
    isLoading: isLoadingDocuments,
    isError: isErrorDocuments,
    refetch: refetchDocuments,
  } = useQuery({
    queryKey: ['documents', page],
    keepPreviousData: true,
    queryFn: async () => {
      console.log('Fetching documents for page: ', page)
      const from = (page - 1) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      console.log(
        'Fetching documents for page: ',
        page,
        ' from:',
        from,
        ' to:',
        to,
      )

      const response = await fetch(
        `/api/materialsTable/fetchProjectMaterials?from=${from}&to=${to}&course_name=${course_name}`,
      )

      if (!response.ok) {
        throw new Error('Failed to fetch document groups')
      }

      const data = await response.json()
      console.log('Fetched documents:', data)
      return data
    },
  })

  // ------------- Mutations -------------

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
  //   // TODO: What is this for???
  //   if (debouncedQuery !== '') {
  //     const lowerCaseDebouncedQuery = debouncedQuery.trim().toLowerCase()
  //     // setMaterials(
  //     documents.final_docs = (documents as CourseDocument[]).filter(
  //       ({ readable_filename, url, base_url }) => {
  //         return (
  //           `${readable_filename}`
  //             .toLowerCase()
  //             .includes(lowerCaseDebouncedQuery) ||
  //           `${url}`.toLowerCase().includes(lowerCaseDebouncedQuery) ||
  //           `${base_url}`.toLowerCase().includes(lowerCaseDebouncedQuery)
  //         )
  //       },
  //     ),
  //   }
  // }, [debouncedQuery, documents])

  if (isErrorDocuments) {
    showNotification({
      title: 'Error',
      message: 'Failed to fetch documents',
      color: 'red',
      icon: <IconTrash size={24} />,
    })

    return errorStateForProjectFilesTable()
  }

  return (
    <>
      <GlobalStyle />
      <DataTable
        records={documents?.final_docs}
        // records={[]}
        totalRecords={documents?.total_count}
        page={page}
        onPageChange={setPage}
        fetching={isLoadingDocuments}
        recordsPerPage={PAGE_SIZE}
        loaderVariant="oval"
        loaderColor="grape"
        borderRadius="lg"
        withColumnBorders
        withBorder={true}
        striped
        highlightOnHover
        height="80vh"
        // emptyState={
        // Error state:
        noRecordsIcon={
          <Stack align="center" p={30}>
            <Text c="dimmed" size="md">
              Ah! We hit a wall when fetching your documents. The database must
              be on fire 🔥
            </Text>
            <Image
              // width={"20vw"}
              style={{ minWidth: 300, maxWidth: '30vw' }}
              radius="md"
              src="https://assets.kastan.ai/this-is-fine.jpg"
              alt="No data found"
              // style={{ filter: 'grayscale(1)' }}
            />
            <Text c="dimmed" size="md">
              So.. please try again later.
            </Text>
          </Stack>
        }
        rowStyle={(row) => {
          if (selectedRecords.includes(row)) {
            return { backgroundColor: 'hsla(280, 100%, 70%, 0.5)' }
          }
          return {}
        }}
        style={{
          width: '100%',
        }}
        columns={[
          {
            accessor: 'NEW TABLE (Name)',
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
              <Text>Hi there</Text>
              // <Group position="apart" spacing="xs">
              //   <MultiSelect
              //     data={[...documentGroups].map((doc_group) => ({
              //       value: doc_group.name || '',
              //       label: doc_group.name || '',
              //     }))}
              //     value={record.doc_groups ? record.doc_groups : []}
              //     placeholder="Select Group"
              //     searchable
              //     nothingFound="No options"
              //     creatable
              //     getCreateLabel={(query) => `+ Create ${query}`}
              //     onCreate={(doc_group_name) => {
              //       createDocumentGroupMutation.mutate({ doc_group_name })
              //       return { value: doc_group_name, label: doc_group_name }
              //     }}
              //     onChange={async (newSelectedGroups) => {
              //       const doc_groups = record.doc_groups
              //         ? record.doc_groups
              //         : []

              //       const removedGroups = doc_groups.filter(
              //         (group) => !newSelectedGroups.includes(group),
              //       )
              //       const appendedGroups = newSelectedGroups.filter(
              //         (group) => !doc_groups.includes(group),
              //       )

              //       if (removedGroups.length > 0) {
              //         for (const removedGroup of removedGroups) {
              //           removeDocumentGroupMutation.mutate({
              //             record,
              //             removedGroup,
              //           })
              //         }
              //       }
              //       if (appendedGroups.length > 0) {
              //         for (const appendedGroup of appendedGroups) {
              //           appendDocumentGroupMutation.mutate({
              //             record,
              //             appendedGroup,
              //           })
              //         }
              //       }
              //     }}
              //     // onChange={(newSelectedGroups) => handleDocumentGroupsChange(record, newSelectedGroups)}
              //     sx={{ flex: 1, width: '100%' }}
              //   />
              // </Group>
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
        // Accessor not necessary when documents have an `id` property
        // idAccessor={(row: any) => (row.url ? row.url : row.s3_path)}
      />{' '}
      {/* End DataTable */}
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

function errorStateForProjectFilesTable() {
  return (
    <DataTable
      records={[]}
      borderRadius="lg"
      withColumnBorders
      withBorder={true}
      striped
      highlightOnHover
      height="80vh"
      // Error state:
      noRecordsIcon={
        <Stack align="center" p={30}>
          <Text c="dimmed" size="md">
            Ah! We hit a wall when fetching your documents. The database must be
            on fire 🔥
          </Text>
          <Image
            // width={"20vw"}
            style={{ minWidth: 300, maxWidth: '30vw' }}
            radius="lg"
            src="https://assets.kastan.ai/this-is-fine.jpg"
            alt="No data found"
            // style={{ filter: 'grayscale(1)' }}
          />
          <Text c="dimmed" size="md">
            So.. please try again later.
          </Text>
        </Stack>
      }
      style={{
        width: '100%',
      }}
      columns={[
        {
          accessor: 'Name',
        },
        {
          accessor: 'URL',
        },
        {
          accessor: 'The Starting URL of Web Scraping',
        },
        {
          accessor: 'doc_group',
        },
        {
          accessor: 'actions',
        },
      ]}
    />
  )
}
