// src/pages/api/documentGroups.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../utils/supabaseClient'

import { CourseDocument } from 'src/types/courseMaterials'

interface Document {
  id: number
  course_name: string
  s3_path?: string
  url?: string
}

interface DocGroup {
  id: number
  name: string
  course_name: string
}

interface RequestBody {
  action:
    | 'addDocumentsToDocGroup'
    | 'appendDocGroup'
    | 'removeDocGroup'
    | 'getDocumentGroups'
    | 'updateDocGroupStatus'
  courseName: string
  doc?: CourseDocument
  docGroup?: string
  enabled?: boolean
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === 'POST') {
    const { action, courseName, doc, docGroup, enabled } =
      req.body as RequestBody

    try {
      if (action === 'addDocumentsToDocGroup' && doc) {
        await addDocumentsToDocGroup(courseName, doc)
        res.status(200).json({ success: true })
      } else if (action === 'appendDocGroup' && doc && docGroup) {
        await appendDocGroup(courseName, doc, docGroup)
        res.status(200).json({ success: true })
      } else if (action === 'removeDocGroup' && doc && docGroup) {
        await removeDocGroup(courseName, doc, docGroup)
        res.status(200).json({ success: true })
      } else if (action === 'getDocumentGroups') {
        const documents = await fetchDocumentGroups(courseName)
        res.status(200).json({ success: true, documents })
      } else if (
        action === 'updateDocGroupStatus' &&
        docGroup &&
        enabled !== undefined
      ) {
        await updateDocGroupStatus(courseName, docGroup, enabled)
        res.status(200).json({ success: true })
      } else {
        res.status(400).json({ success: false, error: 'Invalid action' })
      }
    } catch (error) {
      console.error('Error in document group operation:', error)
      res.status(500).json({ success: false, error: 'An error occurred' })
    }
  } else {
    res.status(405).json({ success: false, error: 'Method not allowed' })
  }
}

async function fetchDocumentGroups(courseName: string) {
  try {
    const { data: documentGroups, error } = await supabase
      .from('doc_groups')
      .select('name, enabled, doc_count')
      .eq('course_name', courseName)
      .order('name', { ascending: true })

    if (error) {
      console.error('Error in fetching document groups from Supabase:', error)
      throw new Error('Failed to fetch document groups')
    }

    return documentGroups
  } catch (error) {
    console.error('Error in fetching document groups from Supabase:', error)
    throw error
  }
}

async function addDocumentsToDocGroup(courseName: string, doc: CourseDocument) {
  try {
    let documentId: number | null = null

    if (doc.s3_path) {
      // Check if the document already exists in the documents table
      const { data: existingDocuments, error: selectError } = await supabase
        .from('documents')
        .select('id')
        .eq('course_name', courseName)
        .eq('s3_path', doc.s3_path)

      if (selectError) {
        console.error('Error in selecting document from Supabase:', selectError)
        throw selectError
      }

      if (existingDocuments?.length > 0) {
        documentId = (existingDocuments[0] as Document).id
      } else {
        // Insert the document into the documents table
        const { data: insertedDocument, error: insertError } = await supabase
          .from('documents')
          .insert({
            course_name: courseName,
            s3_path: doc.s3_path,
            readable_filename: doc.readable_filename,
            url: doc.url,
          })
          .single()

        if (insertError) {
          console.error(
            'Error in inserting document into Supabase:',
            insertError,
          )
          throw insertError
        }

        if (insertedDocument) {
          documentId = (insertedDocument as Document).id
        }
      }
    } else if (doc.url) {
      // Check if the document already exists in the documents table
      const { data: existingDocuments, error: selectError } = await supabase
        .from('documents')
        .select('id')
        .eq('course_name', courseName)
        .eq('url', doc.url)

      if (selectError) {
        console.error('Error in selecting document from Supabase:', selectError)
        throw selectError
      }

      if (existingDocuments?.length > 0) {
        documentId = (existingDocuments[0] as Document).id
      } else {
        // Insert the document into the documents table
        const { data: insertedDocument, error: insertError } = await supabase
          .from('documents')
          .insert({
            course_name: courseName,
            url: doc.url,
            readable_filename: doc.readable_filename,
            s3_path: doc.s3_path,
          })
          .single()

        if (insertError) {
          console.error(
            'Error in inserting document into Supabase:',
            insertError,
          )
          throw insertError
        }

        if (insertedDocument) {
          documentId = (insertedDocument as Document).id
        }
      }
    }

    if (documentId && doc.doc_groups) {
      // Remove existing document-doc_group associations for the document
      const { error: deleteError } = await supabase
        .from('documents_doc_groups')
        .delete()
        .eq('document_id', documentId)

      if (deleteError) {
        console.error(
          'Error in deleting existing document-doc_group associations:',
          deleteError,
        )
        throw deleteError
      }

      for (const docGroupName of doc.doc_groups) {
        let docGroupId: number | null = null
        let retryCount = 0
        const maxRetries = 3

        while (retryCount < maxRetries) {
          // Check if the doc_group exists in the doc_groups table
          const { data: existingDocGroups, error: selectError } = await supabase
            .from('doc_groups')
            .select('id')
            .eq('name', docGroupName)
            .eq('course_name', courseName)

          if (selectError) {
            console.error(
              'Error in selecting doc_group from Supabase:',
              selectError,
            )
            throw selectError
          }

          if (existingDocGroups && existingDocGroups.length > 0) {
            docGroupId = (existingDocGroups[0] as DocGroup).id
            break
          } else {
            // Insert the doc_group into the doc_groups table
            const { data: insertedDocGroup, error: insertError } =
              await supabase
                .from('doc_groups')
                .insert({ name: docGroupName, course_name: courseName })
                .single()

            if (insertError) {
              console.error(
                'Error in inserting doc_group into Supabase:',
                insertError,
              )
              retryCount++
              await new Promise((resolve) => setTimeout(resolve, 500)) // Delay for 500ms before retrying
            } else if (insertedDocGroup) {
              docGroupId = (insertedDocGroup as DocGroup).id
              break
            }
          }
        }

        if (docGroupId !== null) {
          // Insert the document-doc_group association into the documents_doc_groups table
          const { error: insertError } = await supabase
            .from('documents_doc_groups')
            .insert({ document_id: documentId, doc_group_id: docGroupId })

          if (insertError) {
            console.error(
              'Error in inserting document-doc_group association:',
              insertError,
            )
            throw insertError
          }
        } else {
          console.error('Failed to insert doc_group after multiple retries')
          throw new Error('Failed to insert doc_group after multiple retries')
        }
      }
    }
  } catch (error) {
    console.error('Error in adding documents to doc_group:', error)
    throw error
  }
}

async function appendDocGroup(
  courseName: string,
  doc: CourseDocument,
  docGroup: string,
) {
  if (!doc.doc_groups) {
    doc.doc_groups = []
  }
  if (!doc.doc_groups.includes(docGroup)) {
    doc.doc_groups.push(docGroup)
  }
  await addDocumentsToDocGroup(courseName, doc)
}

async function removeDocGroup(
  courseName: string,
  doc: CourseDocument,
  docGroup: string,
) {
  try {
    const { data: documents, error: selectError } = await supabase
      .from('documents')
      .select('id')
      .eq('course_name', courseName)
      .eq('s3_path', doc.s3_path)
      .or(`url.eq.${doc.url}`)

    if (selectError) {
      console.error('Error in selecting document from Supabase:', selectError)
      throw selectError
    }

    if (documents && documents.length > 0) {
      const documentId = documents[0]?.id ?? null

      const { data: docGroups, error: docGroupsError } = await supabase
        .from('doc_groups')
        .select('id')
        .eq('name', docGroup)
        .eq('course_name', courseName)

      if (docGroupsError) {
        console.error(
          'Error in selecting doc_group from Supabase:',
          docGroupsError,
        )
        throw docGroupsError
      }

      if (docGroups && docGroups.length > 0) {
        const docGroupId = docGroups[0]?.id ?? null

        const { error: deleteError } = await supabase
          .from('documents_doc_groups')
          .delete()
          .eq('document_id', documentId)
          .eq('doc_group_id', docGroupId)

        if (deleteError) {
          console.error(
            'Error in deleting document-doc_group association from Supabase:',
            deleteError,
          )
          throw deleteError
        }
      }
    }
  } catch (error) {
    console.error('Error in removing document groups in Supabase:', error)
    throw error
  }
}

async function updateDocGroupStatus(
  courseName: string,
  docGroup: string,
  enabled: boolean,
) {
  try {
    const { error } = await supabase
      .from('doc_groups')
      .update({ enabled })
      .eq('name', docGroup)
      .eq('course_name', courseName)

    if (error) {
      console.error(
        'Error in updating document group status in Supabase:',
        error,
      )
      throw error
    }
  } catch (error) {
    console.error('Error in updating document group status in Supabase:', error)
    throw error
  }
}
