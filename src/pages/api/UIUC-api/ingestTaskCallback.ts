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
    if (req.method !== 'POST') {
      console.error('Request method not allowed')
      return NextResponse.json(
        { error: '❌❌ Request method not allowed' },
        { status: 405 },
      )
    }

    // Assuming the body is a ReadableStream, we need to read it correctly.
    // First, we convert the stream into a Response object, then use .json() to parse it.
    console.log('Task body (no parsing): ', req.body)
    let data
    try {
      const text = await new Response(req.body).text()
      data = JSON.parse(text)
      console.log('Task body (in try): ', data)
      const headerTxt = await new Response(req.headers).text()
      data = JSON.parse(text)
    } catch (error) {
      data = req.body
      console.log('Task body (in catch): ', data)
    }
    console.log('Task body: ', data)
    // console.log('Task headers: ', req.headers)

    console.log('Task headers:')
    for (const [key, value] of Object.entries(req.headers)) {
      console.log(`Header - ${key}: ${value}`)
    }

    // Data:  {
    //   success_ingest: 'courses/t/8885632f-b519-4610-b888-744aa4c2066d-6.pdf',
    //   failure_ingest: null
    // }

    // If Beam task is FAILED or TIMEOUT (not success)
    if (
      req.headers['beam-task-status'] === 'FAILED' ||
      req.headers['beam-task-status'] === 'TIMEOUT'
    ) {
      console.log('in IF for Task FAILED or TIMEOUT')
      // Remove from in progress, add to failed
      const { data, error: delErr } = await supabase
        .from('documents_in_progress')
        .delete()
        .eq('beam_task_id', req.headers['beam-task-id'])
        .select()
      console.log('Result from delete from InProgress:', data)

      // remove a few fields from data, the beam_task_id is not needed
      delete data![0].beam_task_id
      delete data![0].created_at

      data![0].error = req.headers['beam-task-status']

      console.log('Data to insert into failed:', data)

      const { error: insertErr } = await supabase
        .from('documents_failed')
        .insert(data![0])

      return NextResponse.json({ message: 'Success' }, { status: 200 })
    }

    // beam-task-status is SUCCESS (but ingest could have still failed)
    let s3_path_completed = ''
    if (data.success_ingest) {
      console.log('IN SUCCESS INGEST ___:', data.success_ingest)
      s3_path_completed = data.success_ingest
    }
    if (data.failure_ingest) {
      s3_path_completed = data.failure_ingest.s3_path
    }

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
      console.error(`No success/failure ingest in Beam callback data: ${data}}`)
    }

    return NextResponse.json({ message: 'Success' }, { status: 200 })
  } catch (error) {
    const err = `❌❌ -- Bottom of /ingestTaskCallback -- Internal Server Error during callback from Beam task completion: ${error}`
    console.error(err)
    return NextResponse.json({ error: err }, { status: 500 })
  }
}
export default handler
