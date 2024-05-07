/* eslint-disable @typescript-eslint/ban-ts-comment */
import React, { useEffect, useState } from 'react'
import dayjs from 'dayjs'

import { notifications } from '@mantine/notifications'
import { Title, Text, Switch } from '@mantine/core'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import { Montserrat } from 'next/font/google'
import { useFetchAllWorkflows } from '~/utils/functionCalling/handleFunctionCalling'

import {
  // IconArrowsSort,
  // IconCaretDown,
  // IconCaretUp,
  // IconSquareArrowUp,
  IconAlertCircle,
} from '@tabler/icons-react'
import { DataTable } from 'mantine-datatable'
import { WorkflowRecord } from '~/types/tools'
import { LoadingSpinner } from './LoadingSpinner'

const PAGE_SIZE = 10

interface N8nWorkflowsTableProps {
  n8nApiKey: string
  course_name: string
  // fetchWorkflows: (
  //   limit?: number,
  //   pagination?: boolean,
  // ) => Promise<WorkflowRecord[]>
}

const montserrat_med = Montserrat({
  weight: '500',
  subsets: ['latin'],
})

export const N8nWorkflowsTable = ({
  n8nApiKey,
  course_name,
}: N8nWorkflowsTableProps) => {
  const [page, setPage] = useState(1)

  const {
    data: records,
    isLoading: isLoadingRecords,
    isSuccess: isSuccess,
    isError: isErrorTools,
    refetch: refetchWorkflows,
  } = useFetchAllWorkflows(course_name, n8nApiKey, 10, 'true', true)

  useEffect(() => {
    console.log('N8N records', records)
  }, [records])

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
      await refetchWorkflows()
      // setRecords((prevRecords) =>
      //   prevRecords.map((record) =>
      //     record.id === id ? { ...record, active: !checked } : record,
      //   ),
      // )
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
    // Refetch if API key changes
    refetchWorkflows()
  }, [n8nApiKey])

  console.debug('records before datatable:', records)

  const startIndex = (page - 1) * PAGE_SIZE
  const endIndex = startIndex + PAGE_SIZE

  // Not the right way to implement pagination... have to do it at the API/Request level
  // let currentRecords
  // if (records && records.length !== 0) {
  //   console.log('before the current', records)
  //   currentRecords = (records as WorkflowRecord[]).slice(startIndex, endIndex)
  // }
  // console.log('currentRecords b4 data:', currentRecords)

  const [isWideScreen, setIsWideScreen] = useState(window.innerWidth >= 1000)

  useEffect(() => {
    const handleResize = () => {
      setIsWideScreen(window.innerWidth >= 1000)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const dataTableStyle = {
    width: isWideScreen ? '65%' : '92%',
  }

  return (
    <>
      <Title
        order={3}
        // w={}
        // size={'xl'}
        className={`pb-3 pt-3 ${montserrat_paragraph.variable} font-montserratParagraph`}
      >
        Your n8n tools
      </Title>
      <Text w={isWideScreen ? '65%' : '92%'} className="pb-2">
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
        height={500}
        style={dataTableStyle}
        // style={{
        //   width: '50%',
        // }}
        withBorder
        fetching={isLoadingRecords}
        customLoader={<LoadingSpinner />}
        // keyField="id"
        records={records as WorkflowRecord[]}
        columns={[
          // { accessor: 'id', width: 175 },
          { accessor: 'name' },
          {
            accessor: 'active',
            width: 100,
            render: (record, index) => (
              <Switch
                checked={!!record.active}
                onChange={(event) => {
                  // TODO: double check this...
                  // setRecords((prevRecords) =>
                  //   prevRecords.map((record, idx) =>
                  //     idx === index
                  //       ? { ...record, active: event.target.checked }
                  //       : record,
                  //   ),
                  // )
                  console.log('handleActiveChange - record:', record.id)
                  console.log(
                    'handleActiveChange - event:',
                    event.target.checked,
                  )
                  handleActiveChange(record.id, event.target.checked)
                }}
              />
            ),
          },
          // {
          //   accessor: 'tags',
          //   width: 100,
          //   render: (record, index) => {
          //     return record.tags.map((tag) => tag.name).join(', ')
          //   },
          // },
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
        totalRecords={records?.length || 0}
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
