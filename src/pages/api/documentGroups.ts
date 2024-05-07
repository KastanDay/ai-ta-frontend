// src/pages/api/documentGroups.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../utils/supabaseClient'

import { CourseDocument } from 'src/types/courseMaterials'
import {
  addDocumentsToDocGroup,
  appendDocGroup,
  fetchDocumentGroups,
  fetchEnabledDocGroups,
  removeDocGroup,
  updateDocGroupStatus,
} from '~/utils/dbUtils'

interface RequestBody {
  action:
    | 'addDocumentsToDocGroup'
    | 'appendDocGroup'
    | 'removeDocGroup'
    | 'getDocumentGroups'
    | 'updateDocGroupStatus'
    | 'fetchEnabledDocGroups'
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
        await addDocumentsToDocGroup(courseName, doc)
        res.status(200).json({ success: true })
      } else if (action === 'appendDocGroup' && doc && docGroup) {
        console.log('Appending doc group:', docGroup, 'to doc:', doc)
        await appendDocGroup(courseName, doc, docGroup)
        res.status(200).json({ success: true })
      } else if (action === 'removeDocGroup' && doc && docGroup) {
        console.log('Removing doc group: ', docGroup, 'from doc: ', doc)
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
        console.log('Updating doc group status: ', docGroup, 'to: ', enabled)
        await updateDocGroupStatus(courseName, docGroup, enabled)
        res.status(200).json({ success: true })
      } else if (action === 'fetchEnabledDocGroups') {
        const documents = await fetchEnabledDocGroups(courseName)
        res.status(200).json({ success: true, documents })
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
