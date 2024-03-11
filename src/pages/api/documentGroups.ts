// src/pages/api/documentGroups.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../utils/supabaseClient';

export interface MaterialDocument {
  course_name: string;
  readable_filename: string;
  s3_path: string;
  base_url?: string;
  url?: string;
  doc_groups?: string[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { action, courseName, docs, docGroup } = req.body;

    try {
      if (action === 'addDocumentsToDocGroup') {
        await addDocumentsToDocGroup(courseName, docs);
      } else if (action === 'appendDocGroup') {
        await appendDocGroup(courseName, docs, docGroup);
      } else if (action === 'removeDocGroup') {
        await removeDocGroup(courseName, docs, docGroup);
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error in document group operation:', error);
      res.status(500).json({ success: false, error: 'An error occurred' });
    }
  } else {
    res.status(405).json({ success: false, error: 'Method not allowed' });
  }
}

async function addDocumentsToDocGroup(courseName: string, docs: MaterialDocument | MaterialDocument[]) {
  if (!Array.isArray(docs)) {
    docs = [docs];
  }

  for (const doc of docs) {
    try {
      if (doc.s3_path) {
        const { error } = await supabase
          .from('documents')
          .update({ doc_groups: doc.doc_groups || [] })
          .eq('course_name', courseName)
          .eq('s3_path', doc.s3_path);

        if (error) {
          console.error('Error in updating doc_groups in Supabase:', error);
          throw error;
        }
      } else if (doc.url) {
        const { error } = await supabase
          .from('documents')
          .update({ doc_groups: doc.doc_groups || [] })
          .eq('course_name', courseName)
          .eq('url', doc.url);

        if (error) {
          console.error('Error in updating doc_groups in Supabase:', error);
          throw error;
        }
      }
    } catch (error) {
      console.error('Error in updating doc_groups in Supabase:', error);
      throw error;
    }
  }
}

async function appendDocGroup(courseName: string, doc: MaterialDocument, docGroup: string) {
  if (!doc.doc_groups) {
    doc.doc_groups = [];
  }
  if (!doc.doc_groups.includes(docGroup)) {
    doc.doc_groups.push(docGroup);
  }
  await addDocumentsToDocGroup(courseName, doc);
}

async function removeDocGroup(courseName: string, doc: MaterialDocument, docGroup: string) {
  if (doc.doc_groups) {
    doc.doc_groups = doc.doc_groups.filter((group) => group !== docGroup);
  }
  await addDocumentsToDocGroup(courseName, doc);
}