'use client'

import {
  TextInput,
  Text,
  ScrollArea,
  Table,
  Switch,
  Tooltip,
} from '@mantine/core'
import { IconHelp, IconSearch } from '@tabler/icons-react'
import { useMemo, useState } from 'react'
import { createGlobalStyle } from 'styled-components'

import {
  useGetDocumentGroups,
  useUpdateDocGroup,
} from '~/hooks/docGroupsQueries'
import { useQueryClient } from '@tanstack/react-query'

const GlobalStyle = createGlobalStyle`

  .mantine-Checkbox-input:checked {
    background-color: purple;
    border-color: hsl(280,100%,80%);
  } 

  .mantine-Table-root thead tr {
    background-color: #15162a; 
  }

  .mantine-Table-root tbody tr {
    background-color: #1A1B1E
  }

  .mantine-Table-root tbody tr:nth-of-type(odd) {
      background-color: #25262b;
  }
`

export function DocGroupsTable({ course_name }: { course_name: string }) {
  const queryClient = useQueryClient()
  const [documentGroupSearch, setDocumentGroupSearch] = useState('')

  const updateDocGroup = useUpdateDocGroup(course_name, queryClient)

  const {
    data: documentGroups,
    isLoading: isLoadingDocumentGroups,
    isError: isErrorDocumentGroups,
    refetch: refetchDocumentGroups,
  } = useGetDocumentGroups(course_name)

  // Logic to filter doc_groups based on the search query
  const filteredDocumentGroups = useMemo(() => {
    if (!documentGroups) {
      return []
    }

    return [...documentGroups].filter((doc_group_obj) =>
      doc_group_obj.name
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

  return (
    <>
      <GlobalStyle />

      <ScrollArea
        style={{
          width: '100%',
          margin: 'auto',
          borderRadius: '10px',
          overflow: 'visible',
          marginBottom: '20px',
        }}
      >
        <TextInput
          placeholder="Search by Document Group"
          mb="sm"
          radius="md"
          icon={<IconSearch />}
          value={documentGroupSearch}
          onChange={handleDocumentGroupSearchChange}
        />
        <Table
          style={{
            width: '100%',
            tableLayout: 'fixed',
            borderRadius: '10px',
            overflow: 'hidden',
          }}
          withBorder
          withColumnBorders
          highlightOnHover
        >
          <thead>
            <tr>
              <th style={{ width: '70%', wordWrap: 'break-word' }}>
                Document Group
              </th>
              <th style={{ width: '15%', wordWrap: 'break-word' }}>
                Number of Docs
              </th>
              <th
                style={{
                  width: '15%',
                  wordWrap: 'break-word',
                  textAlign: 'center',
                }}
              >
                <Tooltip
                  multiline
                  color="#CC65FF"
                  arrowPosition="center"
                  arrowSize={8}
                  width={400}
                  withArrow
                  label="If a document is included in ANY enabled group, it will be included in chatbot results. Enabled groups take precedence over disabled groups."
                >
                  <span
                    style={{
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <span>Enabled</span>
                    <IconHelp size={16} style={{ marginLeft: '4px' }} />
                  </span>
                </Tooltip>
              </th>
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
                <td
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    wordWrap: 'break-word',
                  }}
                >
                  <Switch
                    checked={doc_group_obj.enabled}
                    onChange={(event) =>
                      updateDocGroup.mutate({
                        doc_group_obj,
                        enabled: event.currentTarget.checked,
                      })
                    }
                    color="grape"
                    size="lg"
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
    </>
  )
}
