'use client'

import {
  TextInput,
  Text,
  createStyles,
  ScrollArea,
  Table,
  Switch,
} from '@mantine/core'
import { IconSearch, IconTrash } from '@tabler/icons-react'
import { useMemo, useState } from 'react'
import { showNotification } from '@mantine/notifications'
import { createGlobalStyle } from 'styled-components'

import { CourseDocument, DocumentGroup } from 'src/types/courseMaterials'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

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
  const queryClient = useQueryClient()
  const [documentGroupSearch, setDocumentGroupSearch] = useState('')

  // ------------- Queries -------------

  const {
    data: documentGroups,
    isLoading: isLoadingDocumentGroups,
    isError: isErrorDocumentGroups,
    refetch: refetchDocumentGroups,
  } = useQuery({
    queryKey: ['documentGroups', course_name],
    queryFn: async () => {
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

        // setDocGroups(docGroups)
        return docGroups as DocumentGroup[]
      } catch (error) {
        console.error('Failed to fetch document groups:', error)
        showNotification({
          title: 'Error',
          message: 'Failed to fetch document groups',
          color: 'red',
          icon: <IconTrash size={24} />,
        })
      }
    },
  })

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

  // ------------- Functions -------------

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
    </>
  )
}
