'use client'

import {
  ActionIcon,
  Box,
  Button,
  Modal,
  Group,
  MultiSelect,
  Text,
  Paper,
  Center,
  Stack,
  Image,
  createStyles,
  MantineTheme,
  TextInput,
} from '@mantine/core'
import {
  IconAlertTriangle,
  IconCheck,
  IconEye,
  IconSearch,
  IconTrash,
  IconX,
} from '@tabler/icons-react'
import { DataTable, DataTableSortStatus } from 'mantine-datatable'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { notifications, showNotification } from '@mantine/notifications'
import { createGlobalStyle } from 'styled-components'

import { CourseDocument, DocumentGroup } from 'src/types/courseMaterials'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchPresignedUrl } from '~/utils/apiUtils'
import {
  useAppendToDocGroup,
  useGetDocumentGroups,
  useRemoveFromDocGroup,
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
  const [filterKey, setFilterKey] = useState<string>('')
  const [filterValue, setFilterValue] = useState<string>('')
  const [modalOpened, setModalOpened] = useState(false)
  const [recordsToDelete, setRecordsToDelete] = useState<CourseDocument[]>([])
  const [page, setPage] = useState(1)
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
    columnAccessor: 'created_at',
    direction: 'desc',
  })

  const appendToDocGroup = useAppendToDocGroup(course_name, queryClient, page)
  const removeFromDocGroup = useRemoveFromDocGroup(
    course_name,
    queryClient,
    page,
  )
  const { theme } = useStyles()

  // ------------- Queries -------------
  const {
    data: documents,
    isLoading: isLoadingDocuments,
    isError: isErrorDocuments,
    error: documentsError,
    refetch: refetchDocuments,
  } = useQuery({
    queryKey: [
      'documents',
      course_name,
      page,
      filterKey,
      filterValue,
      sortStatus.columnAccessor,
      sortStatus.direction,
    ],
    // keepPreviousData: true,
    queryFn: async () => {
      const from = (page - 1) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      const response = await fetch(
        `/api/materialsTable/fetchProjectMaterials?from=${from}&to=${to}&course_name=${course_name}&filter_key=${filterKey}&filter_value=${filterValue}&sort_column=${sortStatus.columnAccessor}&sort_direction=${sortStatus.direction}`,
      )
      if (!response.ok) {
        throw new Error('Failed to fetch document groups')
      }

      const data = await response.json()
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
      console.debug('Deleting records:', recordsToDelete)
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
      console.debug('Deleted records')
    },
    {
      onMutate: async (recordsToDelete) => {
        console.debug('in onMutate')
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
                    (record.s3_path && record.s3_path === doc.s3_path) ||
                    (record.url && record.url === doc.url),
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
        console.debug('Error deleting documents:', err)
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
        console.debug('sleeping for 500ms')
        await sleep(500)
        console.debug('Invalidating queries')
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
        // onClose: () => console.debug('unmounted'),
        // onOpen: () => console.debug('mounted'),
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
        sortStatus={sortStatus}
        onSortStatusChange={setSortStatus}
        fetching={isLoadingDocuments || isLoadingDocumentGroups}
        recordsPerPage={PAGE_SIZE}
        customLoader={<LoadingSpinner />}
        borderRadius="lg"
        withColumnBorders
        withBorder={true}
        striped
        highlightOnHover
        height="80vh"
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
            accessor: 'readable_filename',
            title: 'File Name',
            // render: ({ readable_filename }) =>
            //   readable_filename ? `${readable_filename}` : '',
            render: ({ readable_filename }) =>
              readable_filename ? (
                <div style={{ wordWrap: 'break-word', maxWidth: '18vw' }}>
                  {readable_filename}
                </div>
              ) : (
                ''
              ),
            width: '18vw',
            sortable: true,
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
                    onClick={() => {
                      setFilterKey('readable_filename')
                      setFilterValue('')
                    }}
                  >
                    <IconX size={14} />
                  </ActionIcon>
                }
                value={filterValue}
                onChange={(e) => {
                  setFilterKey('readable_filename')
                  setFilterValue(e.currentTarget.value)
                }}
              />
            ),
            filtering: filterKey !== null,
          },
          {
            accessor: 'url',
            title: 'URL',
            render: ({ url }) =>
              url ? (
                <div style={{ wordWrap: 'break-word', maxWidth: '18vw' }}>
                  {url}
                </div>
              ) : (
                ''
              ),
            sortable: true,
            width: '18vw',
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
                    onClick={() => {
                      setFilterKey('url')
                      setFilterValue('')
                    }}
                  >
                    <IconX size={14} />
                  </ActionIcon>
                }
                value={filterValue}
                onChange={(e) => {
                  setFilterKey('url')
                  setFilterValue(e.currentTarget.value)
                }}
              />
            ),
            filtering: filterKey !== null,
          },
          {
            accessor: 'base_url',
            title: 'The Starting URL of Web Scraping',
            render: ({ base_url }) =>
              base_url ? (
                <div style={{ wordWrap: 'break-word', maxWidth: '18vw' }}>
                  {base_url}
                </div>
              ) : (
                ''
              ),
            sortable: true,
            width: '18vw',
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
                    onClick={() => {
                      setFilterKey('base_url')
                      setFilterValue('')
                    }}
                  >
                    <IconX size={14} />
                  </ActionIcon>
                }
                value={filterValue}
                onChange={(e) => {
                  setFilterKey('base_url')
                  setFilterValue(e.currentTarget.value)
                }}
              />
            ),
            filtering: filterKey !== null,
          },
          {
            accessor: 'created_at',
            title: 'Date created',
            render: ({ created_at }) =>
              created_at ? new Date(created_at).toLocaleString() : '',
            width: 130,
            sortable: true,
            // TODO: Think about how to allow filtering on date... need different UI to select date range
            // filter: (
            //   <TextInput
            //     label="Date created"
            //     description="Show uploaded files that include the specified text"
            //     placeholder="Search files..."
            //     rightSection={
            //       <ActionIcon
            //         size="sm"
            //         variant="transparent"
            //         c="dimmed"
            //         onClick={() => {
            //           setFilterKey('readable_filename')
            //           setFilterValue('')
            //         }}
            //       >
            //         <IconX size={14} />
            //       </ActionIcon>
            //     }
            //     value={filterValue}
            //     onChange={(e) => {
            //       setFilterKey('readable_filename')
            //       setFilterValue(e.currentTarget.value)
            //     }}
            //   />
            // ),
            // filtering: filterKey !== null,
          },
          {
            accessor: 'doc_group',
            title: 'Document Groups',
            width: 200, // Increase this value to make the column wider
            render: (record) => (
              <Group position="apart" spacing="xs">
                <MultiSelect
                  data={
                    documentGroups
                      ? [...documentGroups].map((doc_group) => ({
                          value: doc_group.name || '',
                          label: doc_group.name || '',
                        }))
                      : []
                  }
                  value={record.doc_groups ? record.doc_groups : []}
                  placeholder={
                    isLoadingDocumentGroups ? 'Loading...' : 'Select Group'
                  }
                  searchable={!isLoadingDocumentGroups}
                  nothingFound={
                    isLoadingDocumentGroups ? 'Loading...' : 'No Options'
                  }
                  creatable
                  getCreateLabel={(query) => `+ Create "${query}"`}
                  onCreate={(doc_group_name) => {
                    // createDocumentGroup.mutate({ record, doc_group_name })
                    return { value: doc_group_name, label: doc_group_name }
                  }}
                  onChange={(newSelectedGroups) =>
                    handleDocumentGroupsChange(record, newSelectedGroups)
                  }
                  disabled={isLoadingDocumentGroups}
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
            width: 75,
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
                <Group spacing="xs">
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
            console.debug('New selection:', newSelectedRecords)
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
              console.debug('Deleting records:', recordsToDelete)
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