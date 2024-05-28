import { supabase } from '@/utils/supabaseClient'
import { traceable } from 'langsmith/traceable'
import { Conversation } from '~/types/chat'
import { buildPrompt } from '../chat'

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

  // TODO get userMessage from BuildPrompt
  // const userMessage = buildPrompt(conversation, openaiKey, course_name, metadata)

  // console.log('👇👇👇👇👇👇👇👇👇👇👇👇👇')
  // console.log('full userMessage', userMessage)
  // console.log('👆👆👆👆👆👆👆👆👆👆👆👆👆')

  // TODO: Log to langsmith
  // const chatModel = traceable(
  //   async (lastUserMessageAsSubmitted) => {
  //     return
  //   },
  //   { run_type: "llm", name: "logConversationSupabase", metadata: { projectName: course_name, contexts: lastContexts }, inputs: { lastUserMessageAsSubmitted }, outputs: { lastAIMessage } }
  // )
  // await chatModel(lastUserMessageAsSubmitted)

  return res.status(200).json({ success: true })
}

export default logConversationToSupabase
