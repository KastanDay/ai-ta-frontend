import { ChatBody, Conversation, Message } from '@/types/chat'
import { supabase } from '@/utils/supabaseClient'

const logConversationToSupabase = async (req: any, res: any) => {
  const { course_name, conversation } = req.body

  const { data, error } = await supabase.from('llm-convo-monitor').upsert(
    [
      {
        convo: conversation,
        convo_id: conversation.id,
        course_name: course_name,
        user_email: conversation.user_email,
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
