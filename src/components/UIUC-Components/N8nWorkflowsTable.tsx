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
import { createStyles, Group, TextInput, Title } from '@mantine/core'
import axios from 'axios'
import { showToastOnFileDeleted } from './MakeOldCoursePage'
import { useRouter } from 'next/router'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
const useStyles = createStyles((theme) => ({}))

import {
  IconArrowsSort,
  IconCaretDown,
  IconCaretUp,
  IconSquareArrowUp,
} from '@tabler/icons-react'
import { DataTable } from 'mantine-datatable'

const PAGE_SIZE = 15

interface WorkflowRecord {
  id: string
  name: string
  active: boolean
  tags: string
  createdAt: Date
  updatedAt: Date
}

export const N8nWorkflowsTable = () => {
  const [page, setPage] = useState(1)
  const [records, setRecords] = useState<WorkflowRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [n8nApiKey, setN8nApiKey] = useState('tbd') // !WARNING PUT IN YOUR API KEY HERE
  const [limit, setLimit] = useState(10)
  const [pagination, setPagination] = useState(true)

  useEffect(() => {
    // const from = (page - 1) * PAGE_SIZE;
    // const to = from + PAGE_SIZE;
    // setRecords(employees.slice(from, to));
    const fetchWorkflows = async () => {
      console.log('before fethc:')
      const response = await fetch(
        `/api/UIUC-api/tools/getN8nWorkflows?api_key=${n8nApiKey}&limit=${limit}&pagination=${pagination}`,
      )
      const data = await response.json()

      console.log('getn8nworkflows data:', data)
      setRecords(data)
      setIsLoading(false)
    }
    fetchWorkflows()
  }, [page, n8nApiKey, limit, pagination])

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!records) {
    alert('No records found')
    return null
  }

  console.log('records before datatable:', records)
  return (
    <DataTable
      height={300}
      withBorder
      records={records}
      // getRowProps={(record) => ({ key: record.id })}
      columns={[
        { accessor: 'name', width: 100 },
        { accessor: 'active', width: 100 },
        { accessor: 'tags', width: '100%' },
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
  )
}
