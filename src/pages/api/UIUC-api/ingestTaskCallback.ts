import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '~/utils/supabaseClient'
import posthog from 'posthog-js'

// The beam function handles sending to Success and Failure cases. We just handle removing from in-progress.
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    if (req.method !== 'POST') {
      console.error('Request method not allowed')
      return res.status(405).json({ error: '❌❌ Request method not allowed' })
    }
    const data = req.body

    // Data:  {
    //   success_ingest: 'courses/t/8885632f-b519-4610-b888-744aa4c2066d-6.pdf',
    //   failure_ingest: null
    // }
    // OR:
    // Data: { error: 'Task timed out' }

    // If Beam task is FAILED or TIMEOUT (not success)
    if (
      req.headers['x-beam-task-status'] === 'FAILED' ||
      req.headers['x-beam-task-status'] === 'TIMEOUT'
    ) {
      console.log('in IF for Task FAILED or TIMEOUT')
      // Remove from in progress, add to failed
      const { data, error: delErr } = await supabase
        .from('documents_in_progress')
        .delete()
        .eq('beam_task_id', req.headers['beam-task-id'])
        .select()
      // remove a few fields from data, the beam_task_id is not needed
      delete data![0].beam_task_id
      delete data![0].created_at
      data![0].error = req.body.error

      const { error: insertErr } = await supabase
        .from('documents_failed')
        .insert(data![0])

      return res.status(200).json({ message: 'Success' })
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

    return res.status(200).json({ message: 'Success' })
  } catch (error) {
    const err = `❌❌ -- Bottom of /ingestTaskCallback -- Internal Server Error during callback from Beam task completion: ${error}`
    console.error(err)
    return res.status(200).json({ error: err })
  }
}
export default handler
