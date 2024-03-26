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
  Paper,
  Center,
  Stack,
  Image,
  createStyles,
  MantineTheme,
} from '@mantine/core'
import {
  IconAlertTriangle,
  IconCheck,
  IconEye,
  IconTrash,
  IconX,
} from '@tabler/icons-react'
import { DataTable } from 'mantine-datatable'
import { useState } from 'react'
import axios from 'axios'
import { notifications, showNotification } from '@mantine/notifications'
import { createGlobalStyle } from 'styled-components'

import { CourseDocument, DocumentGroup } from 'src/types/courseMaterials'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchPresignedUrl } from '~/utils/apiUtils'
import {
  useAppendToDocGroup,
  useCreateDocumentGroup,
  useGetDocumentGroups,
  useRemoveFromDocGroup,
  useUpdateDocGroup,
} from '~/hooks/docGroupsQueries'
import { LoadingSpinner } from './LoadingSpinner'

const useStyles = createStyles((theme) => ({}))

const GlobalStyle = createGlobalStyle`
// these mantine class names may change in future versions

  .mantine-Table-root thead tr {
    background-color: #15162a; 
  }
.mantine-Pagination-control[data-active="true"] {
  background-color: blueviolet;
  color: white;
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

  // TODO: I think this is only available in V5>??? Not sure. Why are we on the old V4!!!!
  // const { mutate: appendToDocGroup, isLoading, isError, error } = useAppendToDocGroup(course_name);
  const getDocumentGroups = useGetDocumentGroups(course_name)
  const createDocumentGroup = useCreateDocumentGroup(
    course_name,
    queryClient,
    page,
  )
  const appendToDocGroup = useAppendToDocGroup(course_name, queryClient, page)
  const removeFromDocGroup = useRemoveFromDocGroup(
    course_name,
    queryClient,
    page,
  )
  const updateDocGroup = useUpdateDocGroup(course_name, queryClient)
  const { classes, theme } = useStyles()

  // ------------- Queries -------------
  const {
    data: documents,
    isLoading: isLoadingDocuments,
    isError: isErrorDocuments,
    error: documentsError,
    refetch: refetchDocuments,
  } = useQuery({
    queryKey: ['documents', course_name, page],
    keepPreviousData: true,
    queryFn: async () => {
      // console.log('Fetching documents for page: ', page)
      const from = (page - 1) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      // console.log(
      //   'Fetching documents for page: ',
      //   page,
      //   ' from:',
      //   from,
      //   ' to:',
      //   to,
      // )

      const response = await fetch(
        `/api/materialsTable/fetchProjectMaterials?from=${from}&to=${to}&course_name=${course_name}`,
      )

      if (!response.ok) {
        throw new Error('Failed to fetch document groups')
      }

      const data = await response.json()
      // console.log('Fetched documents:', data)
      return data
    },
  })

  const {
    data: documentGroups,
    isLoading: isLoadingDocumentGroups,
    isError: isErrorDocumentGroups,
    refetch: refetchDocumentGroups,
  } = useGetDocumentGroups(course_name)

  // ------------- Mutations -------------

  function handleDocumentGroupsChange(
    record: any,
    newSelectedGroups: string[],
  ) {
    const doc_groups = record.doc_groups ? record.doc_groups : []

    const removedGroups = doc_groups.filter(
      (group: any) => !newSelectedGroups.includes(group),
    )
    const appendedGroups = newSelectedGroups.filter(
      (group) => !doc_groups.includes(group),
    )

    if (removedGroups.length > 0) {
      for (const removedGroup of removedGroups) {
        removeFromDocGroup.mutate({
          record,
          removedGroup,
        })
      }
    }
    if (appendedGroups.length > 0) {
      for (const appendedGroup of appendedGroups) {
        appendToDocGroup.mutate({
          record,
          appendedGroup,
        })
      }
    }
  }

  const deleteDocumentMutation = useMutation(
    async (recordsToDelete: CourseDocument[]) => {
      console.log('Deleting records:', recordsToDelete)
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
      console.log('Deleted records')
    },
    {
      onMutate: async (recordsToDelete) => {
        console.log('in onMutate')
        await queryClient.cancelQueries(['documents', course_name])

        const previousDocuments = queryClient.getQueryData<CourseDocument[]>([
          'documents',
          course_name,
        ])

        const previousDocumentGroups = queryClient.getQueryData([
          'documentGroups',
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

        queryClient.setQueryData<DocumentGroup[]>(
          ['documentGroups', course_name],
          (old = []) => {
            return old.map((doc_group) => {
              recordsToDelete.forEach((record) => {
                if (doc_group.name in record.doc_groups) {
                  doc_group.doc_count -= 1
                }
              })
              return doc_group
            })
          },
        )

        return { previousDocuments, previousDocumentGroups }
      },
      onError: (err, variables, context) => {
        console.log('Error deleting documents:', err)
        if (context?.previousDocuments) {
          queryClient.setQueryData(
            ['documents', course_name],
            context.previousDocuments,
          )
        }

        if (context?.previousDocumentGroups) {
          queryClient.setQueryData(
            ['documentGroups', course_name],
            context.previousDocumentGroups,
          )
        }

        showToastOnFileDeleted(theme, true)
      },
      onSettled: async () => {
        showToastOnFileDeleted(theme)
        const sleep = (ms: number) =>
          new Promise((resolve) => setTimeout(resolve, ms))
        console.log('sleeping for 500ms')
        await sleep(500)
        console.log('Invalidating queries')
        queryClient.invalidateQueries(['documents', course_name])
        queryClient.invalidateQueries(['documentGroups', course_name])
      },
    },
  )

  if (isErrorDocuments) {
    showNotification({
      title: 'Error',
      message: 'Failed to fetch documents',
      color: 'red',
      icon: <IconTrash size={24} />,
    })

    return errorStateForProjectFilesTable()
  }

  const showToastOnFileDeleted = (theme: MantineTheme, was_error = false) => {
    return (
      // docs: https://mantine.dev/others/notifications/
      notifications.show({
        id: 'file-deleted-from-materials',
        withCloseButton: true,
        onClose: () => console.log('unmounted'),
        onOpen: () => console.log('mounted'),
        autoClose: 12000,
        // position="top-center",
        title: was_error ? 'Error deleting file' : 'Deleting file...',
        message: was_error
          ? "An error occurred while deleting the file. Please try again and I'd be so grateful if you email kvday2@illinois.edu to report this bug."
          : 'The file is being deleted in the background. Refresh the page to see the changes.',
        icon: was_error ? <IconAlertTriangle /> : <IconCheck />,
        styles: {
          root: {
            backgroundColor: theme.colors.nearlyWhite,
            borderColor: was_error
              ? theme.colors.errorBorder
              : theme.colors.aiPurple,
          },
          title: {
            color: theme.colors.nearlyBlack,
          },
          description: {
            color: theme.colors.nearlyBlack,
          },
          closeButton: {
            color: theme.colors.nearlyBlack,
            '&:hover': {
              backgroundColor: theme.colors.dark[1],
            },
          },
          icon: {
            backgroundColor: was_error
              ? theme.colors.errorBackground
              : theme.colors.successBackground,
            padding: '4px',
          },
        },
        loading: false,
      })
    )
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
        fetching={isLoadingDocuments || isLoadingDocumentGroups}
        recordsPerPage={PAGE_SIZE}
        customLoader={<LoadingSpinner />}
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
              style={{ minWidth: 300, maxWidth: '30vw' }}
              radius="md"
              src="https://assets.kastan.ai/this-is-fine.jpg"
              alt="No data found"
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
            accessor: 'File Name',
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
            width: '25%',
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
                  data={
                    documentGroups && documentGroups.length > 0
                      ? [...documentGroups].map((doc_group) => ({
                          value: doc_group.name || '',
                          label: doc_group.name || '',
                        }))
                      : [
                          {
                            value: 'loading',
                            label: 'Loading groups...',
                            disabled: true,
                          },
                        ]
                  }
                  value={record.doc_groups ? record.doc_groups : []}
                  placeholder={
                    documentGroups && documentGroups.length > 0
                      ? 'Select Group'
                      : 'Loading...'
                  }
                  searchable={documentGroups && documentGroups.length > 0}
                  nothingFound="No options"
                  creatable={documentGroups && documentGroups.length > 0}
                  getCreateLabel={(query) => `+ Create ${query}`}
                  onCreate={(doc_group_name) => {
                    createDocumentGroup.mutate({ doc_group_name })
                    return { value: doc_group_name, label: doc_group_name }
                  }}
                  onChange={(newSelectedGroups) =>
                    handleDocumentGroupsChange(record, newSelectedGroups)
                  }
                  // MOVED onChange into function, just for cleanliness.
                  // onChange={async (newSelectedGroups) => {
                  //   const doc_groups = record.doc_groups ? record.doc_groups : []

                  //   const removedGroups = doc_groups.filter(
                  //     (group) => !newSelectedGroups.includes(group),
                  //   )
                  //   const appendedGroups = newSelectedGroups.filter(
                  //     (group) => !doc_groups.includes(group),
                  //   )

                  //   if (removedGroups.length > 0) {
                  //     for (const removedGroup of removedGroups) {
                  //       removeFromDocGroup(course_name).mutate({
                  //         record,
                  //         removedGroup,
                  //       })
                  //     }
                  //   }
                  //   if (appendedGroups.length > 0) {
                  //     for (const appendedGroup of appendedGroups) {
                  //       useAppendToDocGroup(course_name).mutate({
                  //         record,
                  //         appendedGroup,
                  //       })
                  //     }
                  //   }
                  // }}
                  disabled={!documentGroups || documentGroups.length === 0}
                  sx={{ flex: 1, width: '100%' }}
                  classNames={{
                    value: 'tag-item self-center',
                  }}
                  styles={{
                    input: {
                      paddingTop: '12px',
                      paddingBottom: '12px',
                    },
                    value: {
                      marginTop: '2px',
                    },
                  }}
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
