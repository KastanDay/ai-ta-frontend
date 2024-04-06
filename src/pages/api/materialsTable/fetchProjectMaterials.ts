import { supabase } from '@/utils/supabaseClient'
import { getAuth } from '@clerk/nextjs/server'
import posthog from 'posthog-js'
import { NextRequest, NextResponse } from 'next/server'
import { PostgrestError } from '@supabase/supabase-js'
import { CourseDocument } from '~/types/courseMaterials'

export const config = {
  runtime: 'edge',
}

/**
 * API handler to delete an API key for a user.
 *
 * @param {NextApiRequest} req - The incoming HTTP request.
 * @param {NextApiResponse} res - The outgoing HTTP response.
 * @returns A JSON response indicating the result of the delete operation.
 */

export default async function fetchDocuments(
  req: NextRequest,
  res: NextResponse,
) {
  if (req.method !== 'GET') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
  }

  const url = new URL(req.url)
  const fromStr = url.searchParams.get('from')
  const toStr = url.searchParams.get('to')
  const course_name = url.searchParams.get('course_name')
  const search_key = url.searchParams.get('filter_key') as string
  const search_value = url.searchParams.get('filter_value') as string

  if (fromStr === null || toStr === null) {
    throw new Error('Missing required query parameters: from and to')
  }

  const from = parseInt(fromStr)
  const to = parseInt(toStr)

  try {
    const baseQuery = supabase
      .from('documents')
      .select(
        `
        id,
        course_name,
        readable_filename,
        s3_path,
        url,
        base_url,
        created_at,
        doc_groups (
          name
        )
      `,
      )
      .match({ course_name: course_name })
      .order('created_at', { ascending: false })
      .range(from, to)

    let query = baseQuery

    // Add filtering
    if (search_key && search_value) {
      query = baseQuery.ilike(search_key, `%${search_value}%`)
    }

    const { data: documents, error } = await query

    if (error) {
      throw error
    }

    // Fetch the total count of documents for the selected course
    const { count, error: countError } = await supabase
      .from('documents')
      .select('id', { count: 'exact', head: true })
      .match({ course_name: course_name })
      .ilike(search_key, '%' + search_value + '%') // e.g. readable_filename: 'some string'

    if (countError) {
      throw countError
    }

    const final_docs = documents.map((doc) => ({
      ...doc,
      doc_groups: doc.doc_groups.map((group) => group.name),
    })) as CourseDocument[]

    return NextResponse.json(
      { final_docs, total_count: count },
      { status: 200 },
    )
  } catch (error) {
    console.error('Failed to fetch documents:', error)
    posthog.capture('fetch_materials_failed', {
      error: (error as PostgrestError).message,
      course_name: course_name,
    })
    return NextResponse.json(
      { error: (error as PostgrestError).message },
      { status: 500 },
    )
  }
}
