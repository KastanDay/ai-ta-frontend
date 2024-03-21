'use client'

import { TextInput, Text, ScrollArea, Table, Switch } from '@mantine/core'
import { IconSearch, IconTrash } from '@tabler/icons-react'
import { useMemo, useState } from 'react'
import { showNotification } from '@mantine/notifications'
import { createGlobalStyle } from 'styled-components'

import {
  useGetDocumentGroups,
  useUpdateDocGroup,
} from '~/hooks/docGroupsQueries'

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

export function DocGroupsTable({ course_name }: { course_name: string }) {
  const [documentGroupSearch, setDocumentGroupSearch] = useState('')

  const updateDocGroup = useUpdateDocGroup(course_name)

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
                        updateDocGroup.mutate({
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
    </>
  )
}
