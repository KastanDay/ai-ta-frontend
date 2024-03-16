import { NextApiRequest } from 'next'
import { NextResponse } from 'next/server'
import { supabase } from '~/utils/supabaseClient'
import posthog from 'posthog-js'

export const config = {
  runtime: 'edge',
}

// The beam function handles sending to Success and Failure cases. We just handle removing from in-progress.
const handler = async (req: NextApiRequest) => {
  try {
    console.log('ingestTaskCallback.ts: handler: req.method:', req.method)
    console.log('ingestTaskCallback.ts: handler: req.body:', req.body)

    if (req.method !== 'POST') {
      console.error('Request method not allowed')
      return NextResponse.json(
        { error: '❌❌ Request method not allowed' },
        { status: 405 },
      )
    }

    // Assuming the body is a ReadableStream, we need to read it correctly.
    // First, we convert the stream into a Response object, then use .json() to parse it.
    const data = await new Response(req.body).json()
    console.log('Data: ', data)
    // Data: {"success_ingest": "courses/t/7918ea72-32b6-45b1-aec7-0da1c68b3555-1.txt", "failure_ingest": []}
    console.log('Success ingest:', data.success_ingest)
    console.log('Failure ingest:', data.failure_ingest)

    // const combinedIngests: string[] = []
    let s3_path_completed = ''
    if (data.success_ingest) {
      console.log('IN SUCCESS INGEST ___:', data.success_ingest)
      // combinedIngests.push(data.success_ingest)
      s3_path_completed = data.success_ingest
    }
    if (data.failure_ingest) {
      // combinedIngests.push(data.failure_ingest.s3_path)
      s3_path_completed = data.failure_ingest.s3_path
    }
    // const s3_path_completed = combinedIngests[0]
    // console.log('Combined ingests:', combinedIngests)
    console.log('s3_path_completed:', s3_path_completed)

    // Remove from in progress
    if (s3_path_completed) {
      const { error } = await supabase
        .from('documents_in_progress')
        .delete()
        .eq('s3_path', s3_path_completed)

      console.log('Deleted from documents_in_progress: ', data.success_ingest)
      if (error) {
        console.error(
          '❌❌ Supabase failed to delete from `documents_in_progress`:',
          error,
        )
        posthog.capture('supabase_failure_delete_documents_in_progress', {
          s3_path: s3_path_completed,
          error: error.message,
        })
      }
    } else {
      console.log(`No success ingest in Beam data: ${data}}`)
    }

    return NextResponse.json({ message: 'Success' }, { status: 200 })
  } catch (error) {
    const err = `❌❌ -- Bottom of /ingestTaskCallback -- Internal Server Error during callback from Beam task completion: ${error}`
    console.error(err)
    return NextResponse.json({ error: err }, { status: 500 })
  }
}
export default handler
