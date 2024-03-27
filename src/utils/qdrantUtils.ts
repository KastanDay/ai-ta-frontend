// qdrantUtils.ts
import { CourseDocument } from '~/types/courseMaterials'
import { QdrantClient } from '@qdrant/js-client-rest';

// Create a Qdrant client instance
const qdrantClient = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
});

const collection_name = process.env.QDRANT_COLLECTION_NAME

export async function addDocumentsToDocGroupQdrant(
  courseName: string,
  doc: CourseDocument,
) {
  try {
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

    // const dummyVector = new Array(1536).fill(0);

    // const searchResultBefore = await qdrantClient.search(collection_name ? collection_name : "", {
    //   vector: dummyVector,
    //   filter: searchFilter,
    //   with_payload: true,
    //   with_vector: false,
    // });

    // console.log("Previous vectors:");
    // for (const document of searchResultBefore) {
    //   console.log("Payload:", document.payload);
    // }

    qdrantClient.setPayload(collection_name ? collection_name : "", {
      payload: {
        doc_groups: doc.doc_groups,
      }, 
      filter: searchFilter,
    });

    // const searchResultAfter = await qdrantClient.search(collection_name ? collection_name : "", {
    //   vector: dummyVector,
    //   filter: searchFilter,
    //   with_payload: true,
    // });

    // console.log("Updated vectors:");
    // for (const document of searchResultAfter) {
    //   console.log("Payload:", document.payload);
    // }
    } catch (error) {
    console.error('Error in addDocumentsToDocGroup:', error)
    throw error
  }
}

export async function appendDocGroupQdrant(
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
    await addDocumentsToDocGroupQdrant(courseName, doc)
  } catch (error) {
    console.error('Error in appendDocGroup:', error)
    throw error
  }
}

export async function removeDocGroupQdrant(
  courseName: string,
  doc: CourseDocument,
  docGroup: string,
) {
  try {
    if (!doc.doc_groups) {
      doc.doc_groups = []
    }
    doc.doc_groups = doc.doc_groups.filter((group: string) => group !== docGroup)
    await addDocumentsToDocGroupQdrant(courseName, doc)
  } catch (error) {
    console.error('Error in removeDocGroupQdrant:', error)
    throw error
  }
}