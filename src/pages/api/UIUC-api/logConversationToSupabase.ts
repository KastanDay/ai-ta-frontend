import { supabase } from '@/utils/supabaseClient'
import { Content, Conversation } from '~/types/chat'
import { RunTree } from 'langsmith'
import { AllLLMProviders } from '~/utils/modelProviders/LLMProvider'
import { ChatBody } from '~/types/chat'
const logConversationToSupabase = async (req: any, res: any) => {
  const { course_name, conversation, } = req.body as {
    course_name: string
    conversation: Conversation
    //llmProviders: AllLLMProviders
  }

  // Set final system and user prompts in the conversation
  const summary_system_prompt = "You are a helpful assistant that summarizes conversations. Summarize the conversation within 3 sentences"
  conversation.messages[
    conversation.messages.length - 1
  ]!.latestSystemMessage = summary_system_prompt

  const last_message = (conversation.messages[conversation.messages.length - 1]!.content[0] as Content).text
  conversation.messages[
    conversation.messages.length - 1
  ]!.finalPromtEngineeredMessage = last_message 

  const chatBody: ChatBody = {
    conversation: conversation,
    key: '',
    course_name: course_name,
    stream: false,
    // llmProviders: llmProviders,
    model: conversation.model,
  }

  // Call the new endpoint to get the conversation summary . But dont want streaming here
  // const response = await fetch('/api/allNewRoutingChat', {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify(chatBody),
  // })

  // // Extracting the JSON from the NextResponse
  // const jsonResponse = await response.json();
  
  // // Accessing result.text
  // const resultText = jsonResponse.choices[0].message.content;
  // conversation.summary = resultText
  console.log('conversation', conversation)
  console.log('conversation model', conversation.model)

  const { data, error } = await supabase.from('llm-convo-monitor').upsert(
    [
      {
        convo: conversation,
        convo_id: await conversation.id.toString(),
        course_name: course_name,
        user_email: conversation.userEmail,
      },
    ],
    {
      onConflict: 'convo_id',
    },
  )
  if (error) {
    console.log('new error form supabase in logConversationToSupabase:', error)
  }

  // console.log('👇👇👇👇👇👇👇👇👇👇👇👇👇')
  // console.log(
  //   '2nd Latest message object (user)',
  //   conversation.messages[conversation.messages.length - 2],
  // )
  // console.log(
  //   'Latest message object (assistant)',
  //   conversation.messages[conversation.messages.length - 1],
  // )
  // console.log('full convo id', conversation.id)
  // console.log(
  //   'User message',
  //   (
  //     conversation.messages[conversation.messages.length - 2]
  //       ?.content[0] as Content
  //   ).text,
  // )
  // console.log(
  //   'Assistant message',
  //   conversation.messages[conversation.messages.length - 2]?.content,
  // )
  // console.log(
  //   'Engineered prompt',
  //   conversation.messages[conversation.messages.length - 2]!
  //     .finalPromtEngineeredMessage,
  // )
  // console.log(
  //   'System message',
  //   conversation.messages[conversation.messages.length - 2]!
  //     .latestSystemMessage,
  // )
  // console.log('👆👆👆👆👆👆👆👆👆👆👆👆👆')

  // Log to Langsmith
  const rt = new RunTree({
    run_type: 'llm',
    name: 'Final Response Log',
    // inputs: { "Messages": conversation.messages },
    inputs: {
      'User input': (
        conversation.messages[conversation.messages.length - 2]
          ?.content[0] as Content
      ).text,
      'System message':
        conversation.messages[conversation.messages.length - 2]!
          .latestSystemMessage,
      'Engineered prompt':
        conversation.messages[conversation.messages.length - 2]!
          .finalPromtEngineeredMessage,
    },
    outputs: {
      Assistant:
        conversation.messages[conversation.messages.length - 1]?.content,
    },
    project_name: 'uiuc-chat-production',
    metadata: {
      projectName: course_name,
      conversation_id: conversation.id,
      tools: conversation.messages[conversation.messages.length - 2]?.tools,
    }, // "conversation_id" is a SPECIAL KEYWORD. CANNOT BE ALTERED: https://docs.smith.langchain.com/old/monitoring/faq/threads
    // id: conversation.id, // DON'T USE - breaks the threading support
  })

  // End and submit the run
  rt.end()
  await rt.postRun()
  // console.log('✅✅✅✅✅✅✅✅ AFTER ALL LANGSMITH CALLS')

  return res.status(200).json({ success: true })
}

export default logConversationToSupabase
