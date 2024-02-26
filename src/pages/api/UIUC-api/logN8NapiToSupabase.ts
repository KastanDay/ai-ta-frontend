import { ChatBody, Conversation, Message } from '@/types/chat'
import { supabase } from '@/utils/supabaseClient'

const logApiToSupabase = async (req: any, res: any) => {
  const { course_name, n8n_api_key } = req.body

  const { data, error } = await supabase.from('projects').upsert(
    [
      {
        course_name: course_name,
        n8n_api_key: n8n_api_key,
        // doc_map_id: null,
        // convo_map_id: null,
        // enabled_doc_groups: null,
        // disabled_docs: null,
      },
    ],
    {
      onConflict: 'n8n_api_key',
    },
  )
  if (error) {
    console.log('error form supabase:', error)
  }
  return res.status(200).json({ success: true })
}

export default logApiToSupabase
