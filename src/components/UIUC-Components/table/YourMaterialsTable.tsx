/* eslint-disable @typescript-eslint/ban-ts-comment */
import React, { HTMLAttributes, HTMLProps } from 'react'
import ReactDOM from 'react-dom/client'

// import './table.css'

interface CourseFile {
  name: string
  s3_path: string
  course_name: string
  readable_filename: string
  type: string
  url: string
  base_url: string
}

interface CourseFilesListProps {
  course_materials: CourseFile[]
}

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
import { showToastOnFileDeleted } from '../MakeOldCoursePage'
import { useRouter } from 'next/router'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
const useStyles = createStyles((theme) => ({}))

import { IconArrowsSort, IconCaretDown, IconCaretUp, IconSquareArrowUp } from '@tabler/icons-react'

export default function MyTableView({ course_materials }: CourseFilesListProps) {

  const [sorting, setSorting] = React.useState<SortingState>([])
  const [data, setData] = React.useState(course_materials)
  const router = useRouter()
  const { classes, theme } = useStyles()

  const handleDelete = async (
    course_name: string,
    s3_path: string,
    url: string,
  ) => {
    try {
      const API_URL = 'https://flask-production-751b.up.railway.app'
      const response = await axios.delete(`${API_URL}/delete`, {
        params: { course_name, s3_path, url },
      })
      // Handle successful deletion, show a success message
      showToastOnFileDeleted(theme)
      // Refresh the page
      await router.push(router.asPath, undefined, { scroll: false, shallow: false })
    } catch (error) {
      console.error(error)
      // Show error message
      showToastOnFileDeleted(theme, true)
    }
  }


  const rerender = React.useReducer(() => ({}), {})[1]

  console.log("course_materials")
  console.log(course_materials)

  const [rowSelection, setRowSelection] = React.useState({})

  const columns = React.useMemo<ColumnDef<CourseFile>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <IndeterminateCheckbox
            {...{
              checked: table.getIsAllRowsSelected(),
              indeterminate: table.getIsSomeRowsSelected(),
              onChange: table.getToggleAllRowsSelectedHandler(),
            }}
          />
        ),
        cell: ({ row }) => (
          <div className="px-1">
            <IndeterminateCheckbox
              {...{
                checked: row.getIsSelected(),
                disabled: !row.getCanSelect(),
                indeterminate: row.getIsSomeSelected(),
                onChange: row.getToggleSelectedHandler(),
              }}
            />
          </div>
        ),
      },
      {
        accessorFn: row => row.readable_filename,
        id: 'readable_filename',
        cell: info => info.getValue(),
        // sortType: (rowA, rowB, columnId) => {
        sortType: (rowA: Row<CourseFile>, rowB: Row<CourseFile>, columnId: string) => {
          // @ts-ignore
          const a = rowA.values[columnId];
          // @ts-ignore
          const b = rowB.values[columnId];
          return a.localeCompare(b);
        },
        header: () => <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Title
            className={`label ${montserrat_heading.variable} p-0 pl-1 pt-2 font-montserratHeading`}
            variant="gradient"
            gradient={{ from: 'gold', to: 'white', deg: 170 }}
            order={3}
          >
            File name
          </Title>
        </div>,
      },
      {
        header: ' ', // I couldn't see how to fully delete the header.
        footer: props => props.column.id,
        columns: [
          // {
          //   accessorKey: 'readable_filename',
          //   cell: info => info.getValue(),
          //   footer: props => props.column.id,
          //   header: () =>
          //     <div style={{ display: 'flex', justifyContent: 'center' }}>
          //       <Title
          //         className={`label ${montserrat_heading.variable} p-0 pl-1 pt-2 font-montserratHeading`}
          //         variant="gradient"
          //         gradient={{ from: 'gold', to: 'white', deg: 170 }}
          //         order={3}
          //       >
          //         File name
          //       </Title>
          //     </div>,
          // },
          {
            accessorKey: 'url',
            // @ts-ignore
            sortType: (rowA, rowB, columnId) => {
              const a = rowA.values[columnId];
              const b = rowB.values[columnId];
              return a.localeCompare(b);
            },
            footer: props => props.column.id,
            header: () => <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Title
                className={`label ${montserrat_heading.variable} p-0 pl-1 pt-2 font-montserratHeading`}
                variant="gradient"
                gradient={{ from: 'gold', to: 'white', deg: 170 }}
                order={3}
              >
                URL
              </Title>
            </div>,
          },
          {
            accessorKey: 'base_url',
            // @ts-ignore
            sortType: (rowA, rowB, columnId) => {
              const a = rowA.values[columnId];
              const b = rowB.values[columnId];
              return a.localeCompare(b);
            },
            footer: props => props.column.id,
            header: () => <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Title
                className={`label ${montserrat_heading.variable} p-0 pl-1 pt-2 font-montserratHeading`}
                variant="gradient"
                gradient={{ from: 'gold', to: 'white', deg: 170 }}
                order={3}
              >
                Starting URL of web scrape
              </Title>
            </div>,
          },
          // {
          //   accessorFn: row => row.s3_path,
          //   id: 's3_path',
          //   cell: info => info.getValue(),
          //   header: () => <span>S3 Path</span>,
          //   footer: props => props.column.id,
          // },
        ],
      },
    ],
    []
  )

  const table = useReactTable({
    data,
    columns,
    state: {
      rowSelection,
      sorting,
      pagination: { pageSize: 20, pageIndex: 0 }, // default number of rows on page
    },
    enableRowSelection: true,
    // enableRowSelection: row => row.original.age > 18, // or enable row selection conditionally per row
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    debugTable: true,
  })

  return (
    <div className="p-2">
      {/* <label
        className={`label ${montserrat_heading.variable} font-montserratHeading`}
      >
        <span className="label-text text-lg text-neutral-200">
          Click on the column name to sort.
        </span>
      </label> */}
      {/* <div> */}
      {/* <input
          value={globalFilter ?? ''}
          onChange={e => setGlobalFilter(e.target.value)}
          className="p-2 font-lg shadow border border-block"
          placeholder="Search all columns..."
        /> */}
      {/* </div> */}
      <div
        className="mx-auto w-full justify-center rounded-md  bg-violet-100 p-5 shadow-md" // bg-violet-100
        style={{ marginTop: '-1rem', backgroundColor: 'rgb(21, 22, 44)' }}
      >
        {/* <div className="h-2" /> */}
        <table>
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => {
                  return (
                    <th key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder ? null : (
                        <div
                          {...{
                            className: header.column.getCanSort()
                              ? 'cursor-pointer select-none'
                              : '',
                            onClick: header.column.getToggleSortingHandler(),
                          }}
                        >
                          <Group position="center" className={`pb-2`}>
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            {/* TODO: improve icon settings.. */}
                            {header.column.getCanSort() && !header.column.getIsSorted() ? <IconArrowsSort /> : null}
                            {{
                              asc: <IconCaretUp></IconCaretUp>,
                              desc: <IconCaretDown></IconCaretDown>,
                            }[header.column.getIsSorted() as string] ?? null}
                          </Group>
                          {header.column.getCanFilter() ? (
                            <div>
                              <Filter column={header.column} table={table} />
                            </div>
                          ) : null}
                        </div>
                      )}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody className={`${montserrat_paragraph.variable} font-montserratParagraph`}>
            {table.getRowModel().rows.map(row => {
              return (
                <tr key={row.id}>
                  {row.getVisibleCells().map(cell => {
                    return (
                      <td key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr>
              <td className="p-1">
                <IndeterminateCheckbox
                  {...{
                    checked: table.getIsAllPageRowsSelected(),
                    indeterminate: table.getIsSomePageRowsSelected(),
                    onChange: table.getToggleAllPageRowsSelectedHandler(),
                  }}
                />
              </td>
              <td colSpan={20}>Select entire page ({table.getRowModel().rows.length} rows)</td>
            </tr>
          </tfoot>
        </table>
        <div className="h-2" />
        <div className="flex items-center gap-2">
          <button
            className="border rounded p-1"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            {'<<'}
          </button>
          <button
            className="border rounded p-1"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            {'<'}
          </button>
          <button
            className="border rounded p-1"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            {'>'}
          </button>
          <button
            className="border rounded p-1"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            {'>>'}
          </button>
          <span className="flex items-center gap-1">
            <div>Page</div>
            <strong>
              {table.getState().pagination.pageIndex + 1} of{' '}
              {table.getPageCount()}
            </strong>
          </span>
          <span className="flex items-center gap-1">
            | Go to page:
            <input
              type="number"
              defaultValue={table.getState().pagination.pageIndex + 1}
              onChange={e => {
                const page = e.target.value ? Number(e.target.value) - 1 : 0
                table.setPageIndex(page)
              }}
              className="border p-1 rounded w-16"
            />
          </span>
          <select
            value={table.getState().pagination.pageSize}
            onChange={e => {
              table.setPageSize(Number(e.target.value))
            }}
          >
            {[20, 50, 100, 500].map(pageSize => (
              <option key={pageSize} value={pageSize}>
                Show {pageSize}
              </option>
            ))}
          </select>
        </div>
        <br />
        {Object.keys(rowSelection).length > 0 && (
          <div>
            <Group>
              {Object.keys(rowSelection).length} of{' '}
              {table.getPreFilteredRowModel().rows.length} total documents selected

              <button
                className="border rounded p-2 mb-2"
                // TODO: implement delete and download
                // @ts-ignore
                onClick={() => deleteDocs(table.getPreFilteredRowModel().rows)}
              >
                Delete Selected Documents
              </button>
            </Group>
          </div>
        )}
        <hr />
        <br />
        <div>
          <button
            className="border rounded p-2 mb-2"
            onClick={() => console.info('rowSelection', rowSelection)}
          >
            Log `rowSelection` state
          </button>
        </div>
        <div>
          <button
            className="border rounded p-2 mb-2"
            onClick={() =>
              console.info(
                'table.getSelectedRowModel().flatRows',
                table.getSelectedRowModel().flatRows
              )
            }
          >
            Log table.getSelectedRowModel().flatRows
          </button>
        </div>
      </div>
    </div>
  )
}

function Filter({
  column,
  table,
}: {
  column: Column<any, any>
  table: Table<any>
}) {
  const firstValue = table
    .getPreFilteredRowModel()
    .flatRows[0]?.getValue(column.id)

  return typeof firstValue === 'number' ? (
    <div className="flex space-x-2">
      <input
        type="number"
        value={((column.getFilterValue() as any)?.[0] ?? '') as string}
        onChange={e =>
          column.setFilterValue((old: any) => [e.target.value, old?.[1]])
        }
        placeholder={`Min`}
        className="w-24 border shadow rounded"
      />
      <input
        type="number"
        value={((column.getFilterValue() as any)?.[1] ?? '') as string}
        onChange={e =>
          column.setFilterValue((old: any) => [old?.[0], e.target.value])
        }
        placeholder={`Max`}
        className="w-24 border shadow rounded"
      />
    </div>
  ) : (
    <div className="flex justify-center">
      <TextInput
        size='xs'
        type="text"
        value={(column.getFilterValue() ?? '') as string}
        onChange={e => column.setFilterValue(e.target.value)}
        placeholder={`Search...`}
        className="w-1/2 rounded"
      />
    </div>
  )
}

function IndeterminateCheckbox({
  indeterminate,
  className = '',
  ...rest
}: { indeterminate?: boolean } & HTMLProps<HTMLInputElement>) {
  const ref = React.useRef<HTMLInputElement>(null!)

  React.useEffect(() => {
    if (typeof indeterminate === 'boolean') {
      ref.current.indeterminate = !rest.checked && indeterminate
    }
  }, [ref, indeterminate])

  return (
    <input
      type="checkbox"
      ref={ref}
      className={className + ' cursor-pointer'}
      {...rest}
    />
  )
}

// const rootElement = document.getElementById('root')
// if (!rootElement) throw new Error('Failed to find the root element')

// ReactDOM.createRoot(rootElement).render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>
// )
