// qdrantUtils.ts
import { CourseDocument } from '~/types/courseMaterials'
import { qdrant } from '@/utils/qdrantClient'
import posthog from 'posthog-js';
import { useUser } from '@clerk/nextjs'
import { extractEmailsFromClerk } from '~/components/UIUC-Components/clerkHelpers'

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

    // Following commented out code can be used for verifying Qdrant updates:
    // const dummyVector = new Array(1536).fill(0);

    // const searchResultBefore = await qdrant.search(collection_name ? collection_name : "", {
    //   vector: dummyVector,
    //   filter: searchFilter,
    //   with_payload: true,
    //   with_vector: false,
    // });

    // console.log("Previous vectors:");
    // for (const document of searchResultBefore) {
    //   console.log("Payload:", document.payload);
    // }

    qdrant.setPayload(collection_name ? collection_name : "", {
      payload: {
        doc_groups: doc.doc_groups,
      }, 
      filter: searchFilter,
    });

    // const searchResultAfter = await qdrant.search(collection_name ? collection_name : "", {
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
    
    const { user } = useUser()
    const user_emails = extractEmailsFromClerk(user)

    posthog.capture('add_doc_group', {
      user_id: user_emails,
      course_name: courseName,
      doc_readable_filename: doc.readable_filename,
      doc_unique_identifier: doc.url && doc.url !== '' ? doc.url : doc.s3_path && doc.s3_path !== '' ? doc.s3_path : null,
      doc_groups: doc.doc_groups,
    });

    throw error
  }
}