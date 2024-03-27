// dbUtils.ts
import { CourseDocument } from '~/types/courseMaterials'
import { supabase } from './supabaseClient'
import { QdrantClient } from '@qdrant/js-client-rest';

// Create a Qdrant client instance
const qdrantClient = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
});

const collection_name = process.env.QDRANT_COLLECTION_NAME

export async function fetchDocumentGroups(courseName: string) {
  try {
    const { data: documentGroups, error } = await supabase
      .from('doc_groups')
      .select('id, name, enabled, doc_count')
      .eq('course_name', courseName)
      .order('name', { ascending: true })

    if (error) {
      console.error('Failed to fetch document groups:', error.message)
      throw new Error(`Failed to fetch document groups: ${error.message}`)
    }
    return documentGroups
  } catch (error) {
    console.error('Error in fetchDocumentGroups:', error)
    throw error
  }
}

export async function addDocumentsToDocGroup(
  courseName: string,
  doc: CourseDocument,
) {
  try {
    // Update Supabase
    const { data, error } = await supabase.rpc('add_document_to_group', {
      p_course_name: courseName,
      p_s3_path: doc.s3_path,
      p_url: doc.url,
      p_readable_filename: doc.readable_filename,
      p_doc_groups: doc.doc_groups,
    })

    if (!data) {
      console.error(
        'Failed to add documents to doc group:',
        data,
        ' with error:',
        error,
      )
      throw new Error(`Failed to add documents to doc group: ${error}`)
    }

    // Update Qdrant
    const searchFilter = {
      must: [
        {
          key: "course_name",
          match: {
            value: courseName
          }
        },
        {
          key: "url",
          match: {
            value: doc.url ? doc.url : ''
          }
        },
        {
          key: "s3_path",
          match: {
            value: doc.s3_path ? doc.s3_path : ''
          }
        }
      ],
    };

    qdrantClient.setPayload(collection_name ? collection_name : "", {
      payload: {
        course_name: courseName,
        s3_path: doc.s3_path,
        readable_filename: doc.readable_filename,
        url: doc.url,
        base_url: doc.base_url,
        doc_groups: doc.doc_groups,
      }, 
      filter: searchFilter,
    });
  } catch (error) {
    console.error('Error in addDocumentsToDocGroup:', error)
    throw error
  }
}

export async function appendDocGroup(
  courseName: string,
  doc: CourseDocument,
  docGroup: string,
) {
  try {
    if (!doc.doc_groups) {
      doc.doc_groups = []
    }
    if (!doc.doc_groups.includes(docGroup)) {
      doc.doc_groups.push(docGroup)
    }
    await addDocumentsToDocGroup(courseName, doc)
  } catch (error) {
    console.error('Error in appendDocGroup:', error)
    throw error
  }
}

export async function removeDocGroup(
  courseName: string,
  doc: CourseDocument,
  docGroup: string,
) {
  try {
    // Update Supabase
    await supabase.rpc('remove_document_from_group', {
      p_course_name: courseName,
      p_s3_path: doc.s3_path,
      p_url: doc.url,
      p_doc_group: docGroup,
    })

    // Update Qdrant
    const searchFilter = {
      must: [
        {
          key: "course_name",
          match: {
            value: courseName
          }
        },
        {
          key: "url",
          match: {
            value: doc.url ? doc.url : ''
          }
        },
        {
          key: "s3_path",
          match: {
            value: doc.s3_path ? doc.url : ''
          }
        }
      ],
    };


    qdrantClient.setPayload(collection_name ? collection_name : "", {
      payload: {
        course_name: courseName,
        s3_path: doc.s3_path,
        readable_filename: doc.readable_filename,
        url: doc.url,
        base_url: doc.base_url,
        doc_groups: doc.doc_groups.filter((group: string) => group !== docGroup),
      }, 
      filter: searchFilter,
    });
  } catch (error) {
    console.error('Error in removeDocGroup:', error)
    throw error
  }
}

export async function updateDocGroupStatus(
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
      console.error('Failed to update document group status:', error.message)
      throw new Error(
        `Failed to update document group status: ${error.message}`,
      )
    }
  } catch (error) {
    console.error('Error in updateDocGroupStatus:', error)
    throw error
  }
}
