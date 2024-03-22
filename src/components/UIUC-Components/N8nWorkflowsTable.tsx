/* eslint-disable @typescript-eslint/ban-ts-comment */
import React, { HTMLAttributes, HTMLProps, useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import dayjs from 'dayjs'

import {
  Column,
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  Row,
  SortingState,
  Table,
  useReactTable,
} from '@tanstack/react-table'
import { notifications } from '@mantine/notifications'
import {
  createStyles,
  Group,
  TextInput,
  Title,
  Text,
  Switch,
} from '@mantine/core'
import axios from 'axios'
import { showToastOnFileDeleted } from './MakeOldCoursePage'
import { useRouter } from 'next/router'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import { Montserrat } from 'next/font/google'
const useStyles = createStyles((theme) => ({}))

import {
  IconArrowsSort,
  IconCaretDown,
  IconCaretUp,
  IconSquareArrowUp,
  IconAlertCircle,
} from '@tabler/icons-react'
import { DataTable } from 'mantine-datatable'
import { WorkflowRecord } from '~/types/tools'

const PAGE_SIZE = 5

interface N8nWorkflowsTableProps {
  n8nApiKey: string
  isLoading: boolean
  course_name: string
  fetchWorkflows: (
    limit: number,
    pagination: boolean,
  ) => Promise<WorkflowRecord[]>
}

const montserrat_med = Montserrat({
  weight: '500',
  subsets: ['latin'],
})

export const N8nWorkflowsTable = ({
  n8nApiKey,
  fetchWorkflows,
  course_name,
}: N8nWorkflowsTableProps) => {
  const [page, setPage] = useState(1)
  const [records, setRecords] = useState<WorkflowRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  // const [n8nApiKey, setN8nApiKey] = useState(
  //   '',
  // ) // !WARNING PUT IN YOUR API KEY HERE
  const [limit, setLimit] = useState(10)
  const [pagination, setPagination] = useState(true)

  const handleActiveChange = async (id: string, checked: boolean) => {
    // Make API call
    console.log('id:', id)
    console.log('checked:', checked)

    const response = await fetch(
      `/api/UIUC-api/tools/activateWorkflow?api_key=${n8nApiKey}&id=${id}&activate=${checked}`,
    )

    console.log('response:', response)
    // Handle response
    if (!response.ok) {
      const errorData = await response.json()
      console.log('errorData:', errorData)
      setRecords((prevRecords) =>
        prevRecords.map((record) =>
          record.id === id ? { ...record, active: !checked } : record,
        ),
      )
      notifications.show({
        id: 'error-notification',
        withCloseButton: true,
        closeButtonProps: { color: 'red' },
        onClose: () => console.log('error unmounted'),
        onOpen: () => console.log('error mounted'),
        autoClose: 12000,
        title: (
          <Text size={'lg'} className={`${montserrat_med.className}`}>
            Error with activation
          </Text>
        ),
        message: (
          <Text className={`${montserrat_med.className} text-neutral-200`}>
            {errorData.error}
          </Text>
        ),
        color: 'red',
        radius: 'lg',
        icon: <IconAlertCircle />,
        className: 'my-notification-class',
        style: {
          backgroundColor: 'rgba(42,42,64,0.3)',
          backdropFilter: 'blur(10px)',
          borderLeft: '5px solid red',
        },
        withBorder: true,
        loading: false,
      })
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      const data = await fetchWorkflows(limit, pagination)
      console.log('data before setting the records:', data)
      if (data) {
        setRecords(data)
      }
      setIsLoading(false)
    }

    fetchData()
  }, [n8nApiKey, limit, pagination, fetchWorkflows])

  if (isLoading) {
    return <div>Loading...</div>
  }

  // if (!records) {
  //   notifications.show({
  //     id: 'error-notification',
  //     withCloseButton: true,
  //     closeButtonProps: { color: 'red' },
  //     onClose: () => console.log('error unmounted'),
  //     onOpen: () => console.log('error mounted'),
  //     autoClose: 12000,
  //     title: (
  //       <Text size={'lg'} className={`${montserrat_med.className}`}>
  //         Error fetching workflows
  //       </Text>
  //     ),
  //     message: (
  //       <Text className={`${montserrat_med.className} text-neutral-200`}>
  //         No records found. Please check your API key and try again.
  //       </Text>
  //     ),
  //     color: 'red',
  //     radius: 'lg',
  //     icon: <IconAlertCircle />,
  //     className: 'my-notification-class',
  //     style: {
  //       backgroundColor: 'rgba(42,42,64,0.3)',
  //       backdropFilter: 'blur(10px)',
  //       borderLeft: '5px solid red',
  //     },
  //     withBorder: true,
  //     loading: false,
  //   })
  //   return
  // }

  console.log('records before datatable:', records)
  const startIndex = (page - 1) * PAGE_SIZE
  const endIndex = startIndex + PAGE_SIZE
  let currentRecords
  if (records && records.length !== 0) {
    console.log('before the current', records)
    currentRecords = (records as WorkflowRecord[]).slice(startIndex, endIndex)
  }
  console.log('currentRecords b4 data:', currentRecords)
  return (
    <>
      <Title
        order={3}
        // w={'80%'}
        // size={'xl'}
        className={`pb-3 pt-3 ${montserrat_paragraph.variable} font-montserratParagraph`}
      >
        Your n8n tools
      </Title>
      <Text className="pb-2">
        These tools can be automatically invoked by the LLM to fetch additional
        data to answer user questions on the{' '}
        <a
          href={`/${course_name}/chat`}
          // target="_blank"
          rel="noopener noreferrer"
          style={{
            color: '#8B5CF6',
            textDecoration: 'underline',
          }}
        >
          chat page
        </a>
        .
      </Text>
      <DataTable
        height={300}
        withBorder
        // keyField="id"
        records={currentRecords}
        columns={[
          { accessor: 'id', width: 175 },
          { accessor: 'name', width: 100 },
          {
            accessor: 'active',
            width: 100,
            render: (record, index) => (
              <Switch
                checked={record.active}
                onChange={(event) => {
                  setRecords((prevRecords) =>
                    prevRecords.map((record, idx) =>
                      idx === index
                        ? { ...record, active: event.target.checked }
                        : record,
                    ),
                  )
                  console.log('record:', record.id)
                  console.log('event:', event.target.checked)
                  handleActiveChange(record.id, event.target.checked)
                }}
              />
            ),
          },
          {
            accessor: 'tags',
            width: 100,
            render: (record, index) => {
              return record.tags.map((tag) => tag.name).join(', ')
            },
          },
          {
            accessor: 'createdAt',
            // textAlign: 'left',
            width: 120,
            render: (record, index) => {
              const { createdAt } = record as { createdAt: Date }
              return dayjs(createdAt).format('MMM D YYYY, h:mm A')
            },
          },
          {
            accessor: 'updatedAt',
            // textAlign: 'left',
            width: 120,
            render: (record, index) => {
              const { updatedAt } = record as { updatedAt: Date }
              return dayjs(updatedAt).format('MMM D YYYY, h:mm A')
            },
          },
        ]}
        // totalRecords={records.length}
        totalRecords={records.length}
        recordsPerPage={PAGE_SIZE}
        page={page}
        onPageChange={(p) => setPage(p)}
        // 👇 uncomment the next line to use a custom pagination size
        // paginationSize="md"
        // 👇 uncomment the next line to use a custom loading text
        loadingText="Loading..."
        // 👇 uncomment the next line to display a custom text when no records were found
        noRecordsText="No records found"
        // 👇 uncomment the next line to use a custom pagination text
        // paginationText={({ from, to, totalRecords }) => `Records ${from} - ${to} of ${totalRecords}`}
        // 👇 uncomment the next lines to use custom pagination colors
        // paginationActiveBackgroundColor="green"
        // paginationActiveTextColor="#e6e348"
      />
    </>
  )
}
