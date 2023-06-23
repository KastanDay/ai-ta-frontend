import { ChatBody, Conversation, Message } from '@/types/chat'
import { createClient } from '@supabase/supabase-js'

// const supa_url = process.env.SUPABASE_URL as string
// const supa_key = process.env.SUPABASE_SECRET as string
const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SECRET as string,
)

const logConversationToSupabase = async (req: any, res: any) => {
  const { course_name, conversation } = req.body

  const { data, error } = await supabase.from('llm-convo-monitor').upsert(
    [
      {
        convo: conversation,
        convo_id: conversation.id,
        course_name: course_name,
      },
    ],
    {
      onConflict: 'convo_id',
    },
  )
  if (error) {
    console.log('error form supabase:', error)
  }
  return res.status(200).json({ success: true })
}

export default logConversationToSupabase
