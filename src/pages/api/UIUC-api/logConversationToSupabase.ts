import { ChatBody, Conversation, Message } from '@/types/chat'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL as string, process.env.SUPABASE_SECRET as string)

// Save the message to a separate database here
export const logConvoToSupabase = async (conversation: Conversation) => {
  // .update worked better than upsert
  const { error } = await supabase
    .from('llm-convo-monitor')
    .update({ convo: conversation })
    .eq('convo_id', conversation.id)

  if (error) {
    console.log("error form supabase:", error);
  }
};