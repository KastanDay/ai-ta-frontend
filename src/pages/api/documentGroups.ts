// src/pages/api/documentGroups.ts
import { NextApiRequest, NextApiResponse } from 'next';
import posthog from 'posthog-js';
import { CourseDocument } from 'src/types/courseMaterials';
import { getAuth } from '@clerk/nextjs/server'
import {
  addDocumentsToDocGroup,
  appendDocGroup,
  fetchDocumentGroups,
  removeDocGroup,
  updateDocGroupStatus,
} from '~/utils/dbUtils'

import {
  addDocumentsToDocGroupQdrant,
  appendDocGroupQdrant,
  removeDocGroupQdrant,
} from '~/utils/qdrantUtils'

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
        console.log('Adding documents to doc group:', doc)

        posthog.capture('add_doc_group', {
          distinct_id: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
          curr_user_id: await getAuth(req).userId,
          course_name: courseName,
          doc_readable_filename: doc.readable_filename,
          doc_groups: doc.doc_groups,
        });

        await addDocumentsToDocGroup(courseName, doc)
        await addDocumentsToDocGroupQdrant(courseName, doc)
        res.status(200).json({ success: true })
      } else if (action === 'appendDocGroup' && doc && docGroup) {
        console.log('Appending doc group:', docGroup, 'to doc:', doc)

        posthog.capture('append_doc_group', {
          distinct_id: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
          curr_user_id: await getAuth(req).userId,
          course_name: courseName,
          doc_readable_filename: doc.readable_filename,
          doc_groups: doc.doc_groups,
          doc_group: docGroup,
        });

        await appendDocGroup(courseName, doc, docGroup)
        await appendDocGroupQdrant(courseName, doc, docGroup)
        res.status(200).json({ success: true })
      } else if (action === 'removeDocGroup' && doc && docGroup) {
        console.log('Removing doc group: ', docGroup, 'from doc: ', doc)

        posthog.capture('remove_doc_group', {
          distinct_id: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
          curr_user_id: await getAuth(req).userId,
          course_name: courseName,
          doc_readable_filename: doc.readable_filename,
          doc_groups: doc.doc_groups,
          doc_group: docGroup,
        });

        await removeDocGroup(courseName, doc, docGroup)
        await removeDocGroupQdrant(courseName, doc, docGroup)
        res.status(200).json({ success: true })
      } else if (action === 'getDocumentGroups') {
        const documents = await fetchDocumentGroups(courseName)
        res.status(200).json({ success: true, documents })
      } else if (
        action === 'updateDocGroupStatus' &&
        docGroup &&
        enabled !== undefined
      ) {
        console.log('Updating doc group status: ', docGroup, 'to: ', enabled)
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
