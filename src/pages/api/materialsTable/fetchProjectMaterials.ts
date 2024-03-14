import { supabase } from '@/utils/supabaseClient'
import { getAuth } from '@clerk/nextjs/server'
import posthog from 'posthog-js'
import { NextRequest, NextResponse } from 'next/server'
import { PostgrestError } from '@supabase/supabase-js'
import { CourseDocument } from '~/types/courseMaterials'

// import { CourseDocument } from 'components/UIUC-Components/MantineYourMaterialsTable.tsx'

export const config = {
  runtime: 'edge',
}

// interface CourseDocument {
//     course_name: string
//     readable_filename: string
//     url: string
//     s3_path: string
//     created_at: string
//     base_url: string
//     doc_groups: { name: string }[];
// }

/**
 * API handler to delete an API key for a user.
 *
 * @param {NextApiRequest} req - The incoming HTTP request.
 * @param {NextApiResponse} res - The outgoing HTTP response.
 * @returns A JSON response indicating the result of the delete operation.
 */
export default async function deleteKey(req: NextRequest, res: NextResponse) {
  // Check for the DELETE request method.
  if (req.method !== 'GET') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
  }

  // Parse the URL to get query parameters for pagination
  const url = new URL(req.url)
  const fromStr = url.searchParams.get('from')
  const toStr = url.searchParams.get('to')
  const course_name = url.searchParams.get('course_name')

  if (fromStr === null || toStr === null) {
    throw new Error('Missing required query parameters: from and to')
  }
  const from = parseInt(fromStr)
  const to = parseInt(toStr)

  // Get docs, paginated
  const { data: documents, error } = await supabase
    .from('documents')
    .select('readable_filename, s3_path, url, base_url, doc_groups, created_at')
    .match({ course_name: course_name })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    console.error('Failed to delete API key:', error)

    posthog.capture('fetch_materials_failed', {
      // userId: currUserId,
      error: (error as PostgrestError).message,
      course_name: course_name,
    })

    return NextResponse.json(
      { error: (error as PostgrestError).message },
      { status: 500 },
    )
  }
  const final_docs = documents as CourseDocument[]
  return NextResponse.json({ final_docs }, { status: 200 })
}
