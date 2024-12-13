// src/components/Chat/Chat.tsx
import { IconArrowRight, IconAlertCircle } from '@tabler/icons-react'
import {
  type MutableRefObject,
  memo,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { Button, Text } from '@mantine/core'
import { useTranslation } from 'next-i18next'

import { saveConversations } from '@/utils/app/conversation'
import { throttle } from '@/utils/data/throttle'
import { v4 as uuidv4 } from 'uuid'
import {
  type ChatBody,
  type Conversation,
  type Message,
  Content,
  UIUCTool,
} from '@/types/chat'
import { type Plugin } from '@/types/plugin'

import HomeContext from '~/pages/api/home/home.context'

import { ChatInput } from './ChatInput'
import { ChatLoader } from './ChatLoader'
import { ErrorMessageDiv } from './ErrorMessageDiv'
import { MemoizedChatMessage } from './MemoizedChatMessage'
import { fetchPresignedUrl } from '~/utils/apiUtils'

import { type CourseMetadata } from '~/types/courseMetadata'

interface Props {
  stopConversationRef: MutableRefObject<boolean>
  courseMetadata: CourseMetadata
  courseName: string
  currentEmail: string
}

import { useRouter } from 'next/router'
import { useUser } from '@clerk/nextjs'
import { extractEmailsFromClerk } from '../UIUC-Components/clerkHelpers'
import ChatNavbar from '../UIUC-Components/navbars/ChatNavbar'
import { notifications } from '@mantine/notifications'
import { Montserrat } from 'next/font/google'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import {
  State,
  getOpenAIKey,
  handleContextSearch,
  processChunkWithStateMachine,
  routeModelRequest,
} from '~/utils/streamProcessing'
import {
  handleFunctionCall,
  handleToolCall,
  useFetchAllWorkflows,
} from '~/utils/functionCalling/handleFunctionCalling'
import { useFetchEnabledDocGroups } from '~/hooks/docGroupsQueries'
import { CropwizardLicenseDisclaimer } from '~/pages/cropwizard-licenses'
import Head from 'next/head'
import ChatUI, { webLLMModels } from '~/utils/modelProviders/WebLLM'
import { MLCEngine } from '@mlc-ai/web-llm'
import * as webllm from '@mlc-ai/web-llm'
import { WebllmModel } from '~/utils/modelProviders/WebLLM'
import { handleImageContent } from '~/utils/streamProcessing'
import { useQueryClient } from '@tanstack/react-query'
import { useUpdateConversation } from '~/hooks/conversationQueries'
import { motion } from 'framer-motion'
import { useDeleteMessages } from '~/hooks/messageQueries'
import { AllLLMProviders } from '~/utils/modelProviders/LLMProvider'
import util from 'util'

const montserrat_med = Montserrat({
  weight: '500',
  subsets: ['latin'],
})

const DEFAULT_DOCUMENT_GROUP = {
  id: 'DocGroup-all',
  name: 'All Documents', // This value can be stored in an env variable
  checked: true,
}
export const modelCached: WebllmModel[] = []
export const Chat = memo(
  ({
    stopConversationRef,
    courseMetadata,
    courseName,
    currentEmail,
  }: Props) => {
    const { t } = useTranslation('chat')
    const clerk_obj = useUser()
    const router = useRouter()
    const queryClient = useQueryClient()
    // const
    const [bannerUrl, setBannerUrl] = useState<string | null>(null)
    const getCurrentPageName = () => {
      // /CS-125/dashboard --> CS-125
      return router.asPath.slice(1).split('/')[0] as string
    }
    const user_email = extractEmailsFromClerk(clerk_obj.user)[0]
    // const [user_email, setUserEmail] = useState<string | undefined>(undefined)

    // const updateConversationMutation = useUpdateConversation(
    //   user_email as string,
    //   queryClient,
    // )
    const [chat_ui] = useState(new ChatUI(new MLCEngine()))

    const [inputContent, setInputContent] = useState<string>('')

    const [enabledDocumentGroups, setEnabledDocumentGroups] = useState<
      string[]
    >([])
    const [enabledTools, setEnabledTools] = useState<string[]>([])

    const {
      data: documentGroupsHook,
      isSuccess: isSuccessDocumentGroups,
      // isError: isErrorDocumentGroups,
    } = useFetchEnabledDocGroups(getCurrentPageName())

    const {
      data: toolsHook,
      isSuccess: isSuccessTools,
      isLoading: isLoadingTools,
      isError: isErrorTools,
      error: toolLoadingError,
      // refetch: refetchTools,
    } = useFetchAllWorkflows(getCurrentPageName())

    useEffect(() => {
      if (
        courseMetadata?.banner_image_s3 &&
        courseMetadata.banner_image_s3 !== ''
      ) {
        fetchPresignedUrl(courseMetadata.banner_image_s3).then((url) => {
          setBannerUrl(url)
        })
      }
    }, [courseMetadata])

    const {
      state: {
        selectedConversation,
        conversations,
        apiKey,
        pluginKeys,
        serverSideApiKeyIsSet,
        messageIsStreaming,
        modelError,
        loading,
        prompts,
        showModelSettings,
        isImg2TextLoading,
        isRouting,
        isRunningTool, // TODO change to isFunctionCallLoading
        isRetrievalLoading,
        documentGroups,
        tools,
        webLLMModelIdLoading,
        llmProviders,
      },
      handleUpdateConversation,
      handleFeedbackUpdate,
      dispatch: homeDispatch,
    } = useContext(HomeContext)

    useEffect(() => {
      const loadModel = async () => {
        if (selectedConversation?.model && !chat_ui.isModelLoading()) {
          homeDispatch({
            field: 'webLLMModelIdLoading',
            value: { id: selectedConversation.model.id, isLoading: true },
          })
          await chat_ui.loadModel(selectedConversation)
          if (!chat_ui.isModelLoading()) {
            console.log('Model has finished loading')
            homeDispatch({
              field: 'webLLMModelIdLoading',
              value: { id: selectedConversation.model.id, isLoading: false },
            })
          }
        }
      }
      if (
        selectedConversation?.model &&
        webLLMModels.some((m) => m.name === selectedConversation.model.name)
      ) {
        loadModel()
      }
    }, [selectedConversation?.model?.id, chat_ui])

    const [currentMessage, setCurrentMessage] = useState<Message>()
    const [autoScrollEnabled, setAutoScrollEnabled] = useState<boolean>(true)
    // const [showSettings, setShowSettings] = useState<boolean>(false)
    const [showScrollDownButton, setShowScrollDownButton] =
      useState<boolean>(false)

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const chatContainerRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    // const createConversationMutation = useCreateConversation(queryClient)
    const updateConversationMutation = useUpdateConversation(
      currentEmail,
      queryClient,
      courseName,
    )

    const deleteMessagesMutation = useDeleteMessages(
      currentEmail,
      queryClient,
      courseName,
    )

    // Document Groups
    useEffect(() => {
      if (isSuccessDocumentGroups) {
        const documentGroupActions = [
          DEFAULT_DOCUMENT_GROUP,
          ...(documentGroupsHook?.map((docGroup, index) => ({
            id: `DocGroup-${index}`,
            name: docGroup.name,
            checked: false,
            onTrigger: () => console.log(`${docGroup.name} triggered`),
          })) || []),
        ]

        homeDispatch({
          field: 'documentGroups',
          value: [...documentGroupActions],
        })
      }
    }, [documentGroupsHook, isSuccessDocumentGroups])

    useEffect(() => {
      setEnabledDocumentGroups(
        documentGroups
          .filter((action) => action.checked)
          .map((action) => action.name),
      )
    }, [documentGroups])

    // TOOLS
    useEffect(() => {
      if (isSuccessTools) {
        homeDispatch({
          field: 'tools',
          value: [...toolsHook],
        })
      } else if (isErrorTools) {
        errorToast({
          title: 'Error loading tools',
          message:
            (toolLoadingError as Error).message +
            '.\nPlease refresh the page or try again later. Regular chat features may still work.',
        })
      }
    }, [toolsHook, isSuccessTools])

    useEffect(() => {
      setEnabledTools(
        tools.filter((action) => action.enabled).map((action) => action.name),
      )
    }, [tools])

    const callLLMForMessageSummary = async (
      conversation: Conversation,
    ): Promise<string> => {
      const chatBody: ChatBody = {
        conversation: conversation,
        key: getOpenAIKey(courseMetadata, apiKey),
        course_name: getCurrentPageName(),
        stream: false,
        courseMetadata: courseMetadata,
        model: selectedConversation?.model,
        llmProviders: llmProviders,
      }

      try {
        const response = await fetch('/api/allNewRoutingChat?summary=true', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(chatBody),
        })
        if (!response.ok) {
          throw new Error('Failed to generate summary')
        }
        const result = await response.json()
        return result.choices[0].message.content || ''
      } catch (error) {
        console.error('Error generating conversation summary:', error)
        return ''
      }
    }

    const onMessageReceived = async (conversation: Conversation) => {
      // Call LLM for conversation summary
      const summary = await callLLMForMessageSummary(conversation)
      console.log('summary: ', summary)
      if (conversation.messages.length > 0 && summary) {
        // Ensure content is an array
        const lastMessage =
          conversation.messages[conversation.messages.length - 1]

        // Initialize content as an array if it's not already
        if (!Array.isArray(lastMessage!.content)) {
          lastMessage!.content = [{ type: 'text', text: lastMessage!.content }]
        }

        // Add to Message summary field
        lastMessage!.summary = summary

        // Add summary as a new content object
        lastMessage!.content.push({
          type: 'summary',
          text: summary,
        })
      }

      // Log conversation to Supabase
      try {
        const response = await fetch(
          `/api/UIUC-api/logConversationToSupabase`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              course_name: getCurrentPageName(),
              conversation: conversation,
            }),
          },
        )
        const data = await response.json()
        // return data.success
      } catch (error) {
        console.error('Error setting course data:', error)
        // return false
      }

      try {
        // Log conversation to our Flask Backend (especially Nomic)
        console.log(
          'conversation before onResponseCompletion Flask',
          conversation,
        )
        const response = await fetch(
          `https://flask-pr-316.up.railway.app/onResponseCompletion`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              course_name: getCurrentPageName(),
              conversation: conversation,
            }),
          },
        )
        const data = await response.json()
        if (!response.ok) throw new Error(data.message)
        return data.success
      } catch (error) {
        console.error(
          'Error in chat.tsx running onResponseCompletion():',
          error,
        )
        return false
      }
    }

    const resetMessageStates = () => {
      homeDispatch({ field: 'isRouting', value: undefined })
      homeDispatch({ field: 'isRunningTool', value: undefined })
      homeDispatch({ field: 'isImg2TextLoading', value: undefined })
      homeDispatch({ field: 'isRetrievalLoading', value: undefined })
    }

    // THIS IS WHERE MESSAGES ARE SENT.
    const handleSend = useCallback(
      async (
        message: Message,
        deleteCount = 0,
        plugin: Plugin | null = null,
        tools: UIUCTool[],
        enabledDocumentGroups: string[],
        llmProviders: AllLLMProviders,
      ) => {
        console.log(
          'handleSend called with model:',
          selectedConversation?.model,
        )
        console.log('llmProviders in handleSend', llmProviders)
        setCurrentMessage(message)
        resetMessageStates()

        let searchQuery = Array.isArray(message.content)
          ? message.content.map((content) => content.text).join(' ')
          : message.content

        if (selectedConversation) {
          // Add this type guard function
          function isValidModel(
            model: any,
          ): model is { id: string; name: string } {
            return (
              model &&
              typeof model.id === 'string' &&
              typeof model.name === 'string'
            )
          }

          // Check if model is defined and valid
          if (!isValidModel(selectedConversation.model)) {
            console.error('Selected conversation does not have a valid model.')
            errorToast({
              title: 'Model Error',
              message: 'No valid model selected for the conversation.',
            })
            return
          }

          let updatedConversation: Conversation
          if (deleteCount) {
            // Remove tools from message to clear old tools
            message.tools = []
            message.contexts = []
            message.content = Array.isArray(message.content)
              ? message.content.filter(
                  (content) => content.type !== 'tool_image_url',
                )
              : message.content

            const updatedMessages = [...(selectedConversation.messages || [])]
            const messagesToDelete = updatedMessages.slice(0, deleteCount)
            for (let i = 0; i < deleteCount; i++) {
              updatedMessages.pop()
            }
            updatedConversation = {
              ...selectedConversation,
              messages: [...updatedMessages, message],
            }
            await deleteMessagesMutation.mutate({
              convoId: selectedConversation.id,
              deletedMessages: messagesToDelete,
            })
          } else {
            updatedConversation = {
              ...selectedConversation,
              messages: [...(selectedConversation.messages || []), message],
            }
            // console.log(
            //   'updatedConversation before name:',
            //   updatedConversation,
            //   updatedConversation.messages?.length,
            // )
            // Update the name of the conversation if it's the first message
            if (updatedConversation.messages?.length === 1) {
              const { content } = message
              // Use only texts instead of content itself
              const contentText = Array.isArray(content)
                ? content.map((content) => content.text).join(' ')
                : content

              // This is where we can customize the name of the conversation
              const customName =
                contentText.length > 30
                  ? contentText.substring(0, 30) + '...'
                  : contentText

              updatedConversation = {
                ...updatedConversation,
                name: customName,
              }
              // console.log(
              //   'updatedConversation after name:',
              //   updatedConversation,
              // )
            }
          }
          handleUpdateConversation(updatedConversation, {
            key: 'messages',
            value: updatedConversation.messages,
          })
          updateConversationMutation.mutate(updatedConversation)
          console.log(
            'updatedConversation after mutation:',
            updatedConversation,
          )
          homeDispatch({ field: 'loading', value: true })
          homeDispatch({ field: 'messageIsStreaming', value: true })
          const controller = new AbortController()

          // const courseName = getCurrentPageName()

          let imgDesc = ''
          let imageUrls: string[] = []

          // Action 1: Image to Text Conversion
          if (Array.isArray(message.content)) {
            const imageContent = (message.content as Content[]).filter(
              (content) => content.type === 'image_url',
            )

            if (imageContent.length > 0) {
              homeDispatch({ field: 'isImg2TextLoading', value: true })
              try {
                const { searchQuery: newSearchQuery, imgDesc: newImgDesc } =
                  await handleImageContent(
                    message,
                    courseName,
                    updatedConversation,
                    searchQuery,
                    llmProviders,
                    controller,
                  )
                searchQuery = newSearchQuery
                imgDesc = newImgDesc
                imageUrls = imageContent.map(
                  (content) => content.image_url?.url as string,
                )
              } catch (error) {
                console.error(
                  'Error in chat.tsx running handleImageContent():',
                  error,
                )
              } finally {
                homeDispatch({ field: 'isImg2TextLoading', value: false })
              }
            }
          }

          // Action 2: Context Retrieval: Vector Search
          // TODO: add toggle to turn queryRewrite on and off on materials page
          const QUERY_REWRITE_PROMPT = `You are a vector database query optimizer that improves search queries for semantic vector retrieval.

            INPUT:
            The input will include:
            1. Previous conversation messages (if any)
            2. Current search query

            OUTPUT FORMAT:
            You must respond in ONE of these two formats ONLY:
            1. The exact string "NO_REWRITE_REQUIRED" or
            2. An XML tag containing the vector query: <vector_query>your optimized query here</vector_query>

            WHEN TO OUTPUT "NO_REWRITE_REQUIRED":
            Return "NO_REWRITE_REQUIRED" if ALL of these conditions are met:
            - Query contains specific, unique terms that would match relevant documents
            - Query includes all necessary context without requiring conversation history
            - Query has no ambiguous references (like "it", "this", "that example", "option one")
            - Query would yield effective vector embeddings without modification

            WHEN TO REWRITE THE QUERY:
            Rewrite the query if ANY of these conditions are met:
            - Query contains references to items from previous messages
            - Query uses pronouns or demonstratives without clear referents
            - Query lacks technical terms or context needed for effective matching
            - Query requires conversation history to be fully understood

            REWRITING RULES:
            When rewriting, follow these rules:
            1. Replace references to previous items with their specific content
              Example: "explain the first option" →
              <vector_query>explain the gradient descent optimization algorithm</vector_query>

            2. Add essential context from conversation history
              Example: "what are the steps" →
              <vector_query>what are the steps for implementing backpropagation in neural networks</vector_query>

            3. Resolve all pronouns and demonstratives
              Example: "how does it work" →
              <vector_query>how does the transformer attention mechanism work</vector_query>

            4. Include key technical terms and synonyms
              Example: "what causes this" →
              <vector_query>root causes and mechanisms of gradient vanishing in deep neural networks</vector_query>

            IMPORTANT OUTPUT RULES:
            - Do not include ANY explanatory text
            - Do not include multiple options
            - Do not include reasoning or notes
            - Output ONLY "NO_REWRITE_REQUIRED" or a <vector_query> tag
            - Never include both formats in one response
            - Never nest tags or use other XML tags
            - Never add punctuation or text outside the tags

            The final rewritten query must:
            - Be self-contained and understandable without conversation context
            - Maintain the original search intent
            - Include specific details that enable accurate vector matching
            - Be concise while containing all necessary context
            - Contain ONLY the search terms inside the XML tags

            Remember: This query optimization is for vector database retrieval only, not for the final LLM prompt.`

          let rewrittenQuery = searchQuery // Default to original query

          // console.log('vector_search_rewrite_disabled setting:', courseMetadata?.vector_search_rewrite_disabled)

          // Skip query rewrite if disabled in course metadata or if it's the first message
          if (
            courseMetadata?.vector_search_rewrite_disabled ||
            updatedConversation.messages.length <= 1
          ) {
            console.log(
              'Query rewrite disabled for this course or it is the first message, using original query',
            )
            rewrittenQuery = searchQuery
            homeDispatch({ field: 'wasQueryRewritten', value: false })
            homeDispatch({ field: 'queryRewriteText', value: null })
            message.wasQueryRewritten = undefined
            message.queryRewriteText = undefined
          } else {
            homeDispatch({ field: 'isQueryRewriting', value: true })
            try {
              // Get conversation context (last 6 messages or fewer)
              const contextMessages =
                selectedConversation?.messages?.slice(-6) || []

              const queryRewriteConversation: Conversation = {
                id: uuidv4(),
                name: 'Query Rewrite',
                messages: [
                  {
                    id: uuidv4(),
                    role: 'user',
                    content: `Previous conversation:\n${contextMessages
                      .map((msg) => {
                        const contentText = Array.isArray(msg.content)
                          ? msg.content
                              .filter(
                                (content) =>
                                  content.type === 'text' && content.text,
                              )
                              .map((content) => content.text!)
                              .join(' ')
                          : typeof msg.content === 'string'
                            ? msg.content
                            : ''
                        return `${msg.role}: ${contentText.trim()}`
                      })
                      .filter((text) => text.length > 0)
                      .join(
                        '\n',
                      )}\n\nCurrent query: "${searchQuery}"\n\nEnhanced query:`,
                    latestSystemMessage: QUERY_REWRITE_PROMPT,
                    finalPromtEngineeredMessage: `\n<User Query>\nPrevious conversation:\n${contextMessages
                      .map((msg) => {
                        const contentText = Array.isArray(msg.content)
                          ? msg.content
                              .filter(
                                (content) =>
                                  content.type === 'text' && content.text,
                              )
                              .map((content) => content.text!)
                              .join(' ')
                          : typeof msg.content === 'string'
                            ? msg.content
                            : ''
                        return `${msg.role}: ${contentText.trim()}`
                      })
                      .filter((text) => text.length > 0)
                      .join(
                        '\n',
                      )}\n\nCurrent query: "${searchQuery}"\n\nEnhanced query:\n</User Query>`,
                  },
                ],
                model: selectedConversation.model,
                prompt: QUERY_REWRITE_PROMPT,
                temperature: 0.2,
                folderId: null,
                userEmail: currentEmail,
                projectName: courseName,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }

              const queryRewriteBody: ChatBody = {
                conversation: {
                  ...queryRewriteConversation,
                  messages: queryRewriteConversation.messages.map((msg) => ({
                    ...msg,
                    content:
                      typeof msg.content === 'string'
                        ? msg.content.trim()
                        : Array.isArray(msg.content)
                          ? msg.content
                              .map((c) => c.text)
                              .join(' ')
                              .trim()
                          : '',
                  })),
                },
                key: getOpenAIKey(courseMetadata, apiKey),
                course_name: courseName,
                stream: false,
                courseMetadata: courseMetadata,
                llmProviders: llmProviders,
                model: selectedConversation.model,
              }

              if (!queryRewriteBody.model || !queryRewriteBody.model.id) {
                queryRewriteBody.model = selectedConversation.model
              }

              let rewriteResponse:
                | Response
                | AsyncIterable<webllm.ChatCompletionChunk>
                | undefined

              if (
                selectedConversation.model &&
                webLLMModels.some(
                  (model) => model.name === selectedConversation.model.name,
                )
              ) {
                // WebLLM model handling remains the same
                while (chat_ui.isModelLoading() === true) {
                  await new Promise((resolve) => setTimeout(resolve, 10))
                }
                try {
                  rewriteResponse = await chat_ui.runChatCompletion(
                    queryRewriteConversation,
                    getCurrentPageName(),
                  )
                } catch (error) {
                  errorToast({
                    title: 'Error running query rewrite',
                    message:
                      (error as Error).message ||
                      'An unexpected error occurred',
                  })
                }
              } else {
                // Direct call to routeModelRequest instead of going through the API route
                try {
                  rewriteResponse = await fetch('/api/queryRewrite', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(queryRewriteBody),
                  })
                } catch (error) {
                  console.error('Error calling query rewrite endpoint:', error)
                  throw error
                }
              }

              // console.log('query rewriteResponse:', rewriteResponse)

              // After processing the query rewrite response
              if (rewriteResponse instanceof Response) {
                try {
                  const responseData = await rewriteResponse.json()
                  let choices = responseData.choices

                  if (Array.isArray(choices)) {
                    // 'choices' is already an array, do nothing
                  } else if (typeof choices === 'object' && choices !== null) {
                    // Convert 'choices' object to array
                    choices = Object.values(choices)
                  } else {
                    throw new Error(
                      'Invalid format for choices in response data.',
                    )
                  }

                  rewrittenQuery =
                    choices?.[0]?.message?.content?.choices?.[0]?.message
                      ?.content ||
                    choices?.[0]?.message?.content ||
                    searchQuery
                } catch (error) {
                  console.error('Error parsing non-streaming response:', error)
                  message.wasQueryRewritten = false
                }
              }

              console.log('rewrittenQuery after parsing:', rewrittenQuery)

              if (typeof rewrittenQuery !== 'string') {
                rewrittenQuery = searchQuery
                homeDispatch({ field: 'wasQueryRewritten', value: false })
                homeDispatch({ field: 'queryRewriteText', value: null })
                message.wasQueryRewritten = false
                message.queryRewriteText = undefined
              } else {
                // Extract vector query from XML tags if present
                const vectorQueryMatch =
                  rewrittenQuery.match(
                    /<\s*vector_query\s*>(.*?)<\s*\/\s*vector_query\s*>/,
                  ) || null
                const extractedQuery = vectorQueryMatch?.[1]?.trim()

                // Check if the response is NO_REWRITE_REQUIRED or if we couldn't extract a valid query
                if (
                  rewrittenQuery.trim().toUpperCase() ===
                    'NO_REWRITE_REQUIRED' ||
                  !extractedQuery
                ) {
                  console.log(
                    'Query rewrite not required or invalid format, using original query',
                  )
                  rewrittenQuery = searchQuery
                  homeDispatch({ field: 'wasQueryRewritten', value: false })
                  homeDispatch({ field: 'queryRewriteText', value: null })
                  message.wasQueryRewritten = false
                  message.queryRewriteText = undefined
                } else {
                  // Use the extracted query
                  rewrittenQuery = extractedQuery
                  // console.log('Using rewritten query:', rewrittenQuery)
                  homeDispatch({ field: 'wasQueryRewritten', value: true })
                  homeDispatch({
                    field: 'queryRewriteText',
                    value: rewrittenQuery,
                  })
                  message.wasQueryRewritten = true
                  message.queryRewriteText = rewrittenQuery
                }
              }
            } catch (error) {
              console.error('Error in query rewriting:', error)
              homeDispatch({ field: 'wasQueryRewritten', value: false })
              homeDispatch({ field: 'queryRewriteText', value: null })
              message.wasQueryRewritten = false
              message.queryRewriteText = undefined
            } finally {
              homeDispatch({ field: 'isQueryRewriting', value: false })
            }
          }

          // console.log('Final query used for context search:', rewrittenQuery)

          homeDispatch({ field: 'isRetrievalLoading', value: true })

          // Use enhanced query for context search
          await handleContextSearch(
            message,
            courseName,
            selectedConversation,
            rewrittenQuery,
            enabledDocumentGroups,
          )

          homeDispatch({ field: 'isRetrievalLoading', value: false })

          // Action 3: Tool Execution
          if (tools.length > 0) {
            try {
              homeDispatch({ field: 'isRouting', value: true })
              // Check if any tools need to be run
              const uiucToolsToRun = await handleFunctionCall(
                message,
                tools,
                imageUrls,
                imgDesc,
                updatedConversation,
                getOpenAIKey(courseMetadata, apiKey),
              )
              homeDispatch({ field: 'isRouting', value: false })
              if (uiucToolsToRun.length > 0) {
                homeDispatch({ field: 'isRunningTool', value: true })
                // Run the tools
                await handleToolCall(
                  uiucToolsToRun,
                  updatedConversation,
                  courseName,
                )
              }

              homeDispatch({ field: 'isRunningTool', value: false })
            } catch (error) {
              console.error(
                'Error in chat.tsx running handleFunctionCall():',
                error,
              )
            } finally {
              homeDispatch({ field: 'isRunningTool', value: false })
            }
          }

          const chatBody: ChatBody = {
            conversation: updatedConversation,
            key: getOpenAIKey(courseMetadata, apiKey),
            course_name: courseName,
            stream: true,
            courseMetadata: courseMetadata,
            llmProviders: llmProviders,
            model: selectedConversation.model,
          }
          updatedConversation = chatBody.conversation!

          // Update the selected conversation
          homeDispatch({
            field: 'selectedConversation',
            value: updatedConversation,
          })

          // Action 5: Run Chat Completion based on model provider
          let response:
            | AsyncIterable<webllm.ChatCompletionChunk>
            | Response
            | undefined
          let reader

          if (
            selectedConversation.model &&
            webLLMModels.some(
              (model) => model.name === selectedConversation.model.name,
            )
          ) {
            // Is WebLLM model
            while (chat_ui.isModelLoading() == true) {
              await new Promise((resolve) => setTimeout(resolve, 10))
            }
            try {
              response = await chat_ui.runChatCompletion(
                selectedConversation,
                getCurrentPageName(),
              )
            } catch (error) {
              errorToast({
                title: 'Error running chat completion',
                message:
                  (error as Error).message ||
                  'In Chat.tsx An unexpected error occurred',
              })
            }
          } else {
            try {
              // Route to the specific model provider
              // response = await routeModelRequest(chatBody, controller)

              // CALL OUR NEW ENDPOINT... /api/chat
              response = await fetch('/api/allNewRoutingChat', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(chatBody),
              })
              console.log('response from /api/chat', response)
            } catch (error) {
              // TODO: Improve error messages here...
              console.error('Error routing to model provider:', error)
              errorToast({
                title: 'Error routing to model provider',
                message:
                  (error as Error).message || 'An unexpected error occurred',
              })
            }
          }

          if (response instanceof Response && !response.ok) {
            let final_response
            try {
              final_response = await response.json()
            } catch (error) {
              console.error('Error parsing response:', error)
              homeDispatch({ field: 'loading', value: false })
              homeDispatch({ field: 'messageIsStreaming', value: false })
              errorToast({
                title: 'Error',
                message:
                  'Received an invalid response from the server. Please try again.',
              })
              return
            }

            homeDispatch({ field: 'loading', value: false })
            homeDispatch({ field: 'messageIsStreaming', value: false })
            console.error('Error calling the LLM:', final_response)

            if (final_response.error) {
              let errorMessage = final_response.error
              let errorCode = final_response.code

              // Handle case where error is a JSON string
              if (typeof final_response.error === 'string') {
                try {
                  const parsed = JSON.parse(final_response.error)
                  errorMessage = parsed.error || parsed.message
                  errorCode = parsed.code
                } catch (e) {
                  // Keep original error message if not valid JSON
                }
              }

              errorToast({
                title: `Error calling LLM`,
                message:
                  errorMessage ||
                  `An unexpected error occurred. Try using a different model.${errorCode ? ` Error code: ${errorCode}` : ''}`,
              })
              return
            } else {
              errorToast({
                title: final_response.name || 'Error',
                message:
                  final_response.message ||
                  'There was an unexpected error calling the LLM. Try using a different model (via the Settings button in the header).',
              })
            }
            return
          }

          let data
          if (response instanceof Response) {
            data = response.body
            if (!data) {
              homeDispatch({ field: 'loading', value: false })
              homeDispatch({ field: 'messageIsStreaming', value: false })
              return
            }
            reader = data.getReader()
          }

          if (!plugin) {
            homeDispatch({ field: 'loading', value: false })

            const decoder = new TextDecoder()
            let done = false
            let isFirst = true
            let text = ''
            let chunkValue
            let finalAssistantRespose = ''
            const citationLinkCache = new Map<number, string>()
            const stateMachineContext = { state: State.Normal, buffer: '' }
            try {
              // Action 6: Stream the LLM response, based on model provider.
              while (!done) {
                if (stopConversationRef.current === true) {
                  controller.abort()
                  done = true
                  break
                }
                if (response && 'next' in response) {
                  // Run WebLLM models
                  const iterator = (
                    response as AsyncIterable<webllm.ChatCompletionChunk>
                  )[Symbol.asyncIterator]()
                  const result = await iterator.next()
                  done = result.done ?? false
                  if (
                    done ||
                    result.value == undefined ||
                    result.value.choices[0]?.delta.content == undefined
                  ) {
                    // exit early
                    continue
                  }
                  chunkValue = result.value.choices[0]?.delta.content
                  text += chunkValue
                } else {
                  // OpenAI models & Vercel AI SDK models
                  const { value, done: doneReading } = await reader!.read()
                  done = doneReading
                  chunkValue = decoder.decode(value)
                  text += chunkValue
                }

                if (isFirst) {
                  // isFirst refers to the first chunk of data received from the API (happens once for each new message from API)
                  isFirst = false
                  const updatedMessages: Message[] = [
                    ...updatedConversation.messages,
                    {
                      id: uuidv4(),
                      role: 'assistant',
                      content: chunkValue,
                      contexts: message.contexts,
                      feedback: message.feedback,
                      wasQueryRewritten: message.wasQueryRewritten,
                      queryRewriteText: message.queryRewriteText,
                    },
                  ]

                  // console.log('updatedMessages with queryRewrite info:', updatedMessages)

                  finalAssistantRespose += chunkValue
                  updatedConversation = {
                    ...updatedConversation,
                    messages: updatedMessages,
                  }
                  homeDispatch({
                    field: 'selectedConversation',
                    value: updatedConversation,
                  })
                } else {
                  if (updatedConversation.messages?.length > 0) {
                    const lastMessageIndex =
                      updatedConversation.messages?.length - 1
                    const lastMessage =
                      updatedConversation.messages[lastMessageIndex]
                    const lastUserMessage =
                      updatedConversation.messages[lastMessageIndex - 1]
                    if (
                      lastMessage &&
                      lastUserMessage &&
                      lastUserMessage.contexts
                    ) {
                      // Handle citations via state machine
                      finalAssistantRespose +=
                        await processChunkWithStateMachine(
                          chunkValue,
                          lastUserMessage,
                          stateMachineContext,
                          citationLinkCache,
                        )

                      // Update the last message with the new content
                      const updatedMessages = updatedConversation.messages?.map(
                        (msg, index) =>
                          index === lastMessageIndex
                            ? { ...msg, content: finalAssistantRespose }
                            : msg,
                      )

                      // Update the conversation with the new messages
                      updatedConversation = {
                        ...updatedConversation,
                        messages: updatedMessages,
                      }

                      // Dispatch the updated conversation
                      homeDispatch({
                        field: 'selectedConversation',
                        value: updatedConversation,
                      })
                    }
                  }
                }
              }
            } catch (error) {
              console.error('Error reading from stream:', error)
              homeDispatch({ field: 'loading', value: false })
              homeDispatch({ field: 'messageIsStreaming', value: false })
              return
            }

            if (!done) {
              throw new Error('LLM response stream ended before it was done.')
            }

            try {
              // This is after the response is done streaming
              // saveConversation(updatedConversation)
              console.debug(
                'updatedConversation after streaming:',
                updatedConversation,
              )
              handleUpdateConversation(updatedConversation, {
                key: 'messages',
                value: updatedConversation.messages,
              })
              updateConversationMutation.mutate(updatedConversation)
              console.debug(
                'updatedConversation after mutation:',
                updatedConversation,
              )

              onMessageReceived(updatedConversation) // kastan here, trying to save message AFTER done streaming. This only saves the user message...

              // } else {
              //   onMessageReceived(updatedConversation)
              // }

              // Save the conversation to the server

              // await saveConversationToServer(updatedConversation).catch(
              //   (error) => {
              //     console.error(
              //       'Error saving updated conversation to server:',
              //       error,
              //     )
              //   },
              // )

              // const updatedConversations: Conversation[] = conversations.map(
              //   (conversation) => {
              //     if (conversation.id === selectedConversation.id) {
              //       return updatedConversation
              //     }
              //     return conversation
              //   },
              // )
              // if (updatedConversations.length === 0) {
              //   updatedConversations.push(updatedConversation)
              // }
              // homeDispatch({
              //   field: 'conversations',
              //   value: updatedConversations,
              // })
              // console.log('updatedConversations: ', updatedConversations)
              // saveConversations(updatedConversations)
              homeDispatch({ field: 'messageIsStreaming', value: false })
            } catch (error) {
              console.error('An error occurred: ', error)
              controller.abort()
            }
          } else {
            if (response instanceof Response) {
              const { answer } = await response.json()
              const updatedMessages: Message[] = [
                ...updatedConversation.messages,
                {
                  id: uuidv4(),
                  role: 'assistant',
                  content: answer,
                  contexts: message.contexts,
                  feedback: message.feedback,
                  wasQueryRewritten: message.wasQueryRewritten,
                  queryRewriteText: message.queryRewriteText,
                },
              ]
              updatedConversation = {
                ...updatedConversation,
                messages: updatedMessages,
              }
              homeDispatch({
                field: 'selectedConversation',
                value: updatedConversation,
              })
              // This is after the response is done streaming for plugins

              // handleUpdateConversation(updatedConversation, {
              //   key: 'messages',
              //   value: updatedMessages,
              // })

              // await saveConversationToServer(updatedConversation).catch(
              //   (error) => {
              //     console.error(
              //       'Error saving updated conversation to server:',
              //       error,
              //     )
              //   },
              // )
              // Do we need this?
              // saveConversation(updatedConversation)
              const updatedConversations: Conversation[] = conversations.map(
                (conversation) => {
                  if (conversation.id === selectedConversation.id) {
                    return updatedConversation
                  }
                  return conversation
                },
              )
              if (updatedConversations.length === 0) {
                updatedConversations.push(updatedConversation)
              }
              homeDispatch({
                field: 'conversations',
                value: updatedConversations,
              })
              // saveConversations(updatedConversations)
              homeDispatch({ field: 'loading', value: false })
              homeDispatch({ field: 'messageIsStreaming', value: false })
            }
          }
        }
      },
      [
        apiKey,
        conversations,
        pluginKeys,
        selectedConversation,
        stopConversationRef,
        chat_ui,
      ],
    )

    const handleRegenerate = useCallback(() => {
      if (currentMessage && Array.isArray(currentMessage.content)) {
        // Find the index of the existing image description
        const imgDescIndex = (currentMessage.content as Content[]).findIndex(
          (content) =>
            content.type === 'text' &&
            (content.text as string).startsWith('Image description: '),
        )

        if (imgDescIndex !== -1) {
          // Remove the existing image description
          ;(currentMessage.content as Content[]).splice(imgDescIndex, 1)
        }
        if (
          selectedConversation?.messages[
            selectedConversation?.messages?.length - 1
          ]?.role === 'user'
        ) {
          // console.log('user')
          handleSend(
            currentMessage,
            1,
            null,
            tools,
            enabledDocumentGroups,
            llmProviders,
          )
        } else {
          // console.log('assistant')
          handleSend(
            currentMessage,
            2,
            null,
            tools,
            enabledDocumentGroups,
            llmProviders,
          )
        }
      }
    }, [currentMessage, handleSend])

    const scrollToBottom = useCallback(() => {
      if (autoScrollEnabled) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        textareaRef.current?.focus()
      }
    }, [autoScrollEnabled])

    const handleScroll = () => {
      if (chatContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } =
          chatContainerRef.current
        const bottomTolerance = 30

        if (scrollTop + clientHeight < scrollHeight - bottomTolerance) {
          setAutoScrollEnabled(false)
          setShowScrollDownButton(true)
        }
        // else {
        //   setAutoScrollEnabled(true)
        //   setShowScrollDownButton(false)
        // }
      }
    }

    const handleScrollDown = () => {
      chatContainerRef.current?.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }

    const handleSettings = () => {
      homeDispatch({ field: 'showModelSettings', value: !showModelSettings })
    }

    const onClearAll = () => {
      if (
        confirm(t<string>('Are you sure you want to clear all messages?')) &&
        selectedConversation
      ) {
        // Clear all messages, not used
        handleUpdateConversation(selectedConversation, {
          key: 'messages',
          value: [],
        })
      }
    }

    const scrollDown = () => {
      if (autoScrollEnabled) {
        messagesEndRef.current?.scrollIntoView(true)
      }
    }
    const throttledScrollDown = throttle(scrollDown, 250)

    useEffect(() => {
      if (messageIsStreaming) throttledScrollDown()
      if (selectedConversation) {
        const messages = selectedConversation.messages
        if (messages?.length > 1) {
          if (messages[messages?.length - 1]?.role === 'assistant') {
            setCurrentMessage(messages[messages?.length - 2])
          } else {
            setCurrentMessage(messages[messages?.length - 1])
          }
        } else if (messages?.length === 1) {
          setCurrentMessage(messages[0])
        } else {
          setCurrentMessage(undefined)
        }
      }
    }, [selectedConversation, throttledScrollDown])

    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          setAutoScrollEnabled(entry?.isIntersecting || false)
          if (entry?.isIntersecting) {
            textareaRef.current?.focus()
          }
        },
        {
          root: null,
          threshold: 0.5,
        },
      )
      const messagesEndElement = messagesEndRef.current
      if (messagesEndElement) {
        observer.observe(messagesEndElement)
      }
      return () => {
        if (messagesEndElement) {
          observer.unobserve(messagesEndElement)
        }
      }
    }, [messagesEndRef])

    const statements =
      courseMetadata?.example_questions &&
      courseMetadata.example_questions.length > 0
        ? courseMetadata.example_questions
        : [
            'Make a bullet point list of key takeaways from this project.',
            'What are the best practices for [Activity or Process] in [Context or Field]?',
            'Can you explain the concept of [Specific Concept] in simple terms?',
          ]

    // Add this function to create dividers with statements
    const renderIntroductoryStatements = () => {
      return (
        <div className="xs:mx-2 mt-4 max-w-3xl gap-3 px-4 last:mb-2 sm:mx-4 md:mx-auto lg:mx-auto ">
          <div className="backdrop-filter-[blur(10px)] rounded-lg border-2 border-[rgba(42,42,120,0.55)] bg-[rgba(42,42,64,0.4)] p-6">
            <Text
              className={`mb-2 text-lg text-white ${montserrat_heading.variable} font-montserratHeading`}
              style={{ whiteSpace: 'pre-wrap' }}
            >
              {courseMetadata?.course_intro_message}
            </Text>

            <h4
              className={`text-md mb-2 text-white ${montserrat_paragraph.variable} font-montserratParagraph`}
            >
              {getCurrentPageName() === 'cropwizard-1.5' && (
                <CropwizardLicenseDisclaimer />
              )}
              Start a conversation below or try the following examples
            </h4>
            <div className="mt-4 flex flex-col items-start space-y-2 overflow-hidden">
              {statements.map((statement, index) => (
                <div
                  key={index}
                  className="w-full rounded-lg border-b-2 border-[rgba(42,42,64,0.4)] hover:cursor-pointer hover:bg-[rgba(42,42,64,0.9)]"
                  onClick={() => {
                    setInputContent('') // First clear the input
                    setTimeout(() => {
                      // Then set it with a small delay
                      setInputContent(statement)
                      textareaRef.current?.focus()
                    }, 0)
                  }}
                >
                  <Button
                    variant="link"
                    className={`text-md h-auto p-2 font-bold leading-relaxed text-white hover:underline ${montserrat_paragraph.variable} font-montserratParagraph `}
                  >
                    <IconArrowRight size={25} className="mr-2 min-w-[40px]" />
                    <p className="whitespace-break-spaces">{statement}</p>
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <div
            // This is critical to keep the scrolling proper. We need padding below the messages for the chat bar to sit.
            // className="h-[162px] bg-gradient-to-b from-[#1a1a2e] via-[#2A2A40] to-[#15162c]"
            // className="h-[162px] bg-gradient-to-t from-transparent to-[rgba(14,14,21,0.4)]"
            // className="h-[162px] bg-gradient-to-b dark:from-[#2e026d] dark:via-[#15162c] dark:to-[#15162c]"
            className="h-[162px]"
            ref={messagesEndRef}
          />
        </div>
      )
    }
    // Inside Chat function before the return statement
    const renderMessageContent = (message: Message) => {
      if (Array.isArray(message.content)) {
        return (
          <>
            {message.content.map((content, index) => {
              if (content.type === 'image_url' && content.image_url) {
                return (
                  <img
                    key={index}
                    src={content.image_url.url}
                    alt="Uploaded content"
                  />
                )
              }
              return <span key={index}>{content.text}</span>
            })}
          </>
        )
      }
      return <span>{message.content}</span>
    }

    const updateMessages = (updatedMessage: Message, messageIndex: number) => {
      return selectedConversation?.messages?.map((message, index) => {
        return index === messageIndex ? updatedMessage : message
      })
    }

    const updateConversations = (updatedConversation: Conversation) => {
      return conversations.map((conversation) =>
        conversation.id === selectedConversation?.id
          ? updatedConversation
          : conversation,
      )
    }

    const onImageUrlsUpdate = useCallback(
      (updatedMessage: Message, messageIndex: number) => {
        if (!selectedConversation) {
          throw new Error('No selected conversation found')
        }

        const updatedMessages = updateMessages(updatedMessage, messageIndex)
        if (!updatedMessages) {
          throw new Error('Failed to update messages')
        }

        const updatedConversation = {
          ...selectedConversation,
          messages: updatedMessages,
        }

        homeDispatch({
          field: 'selectedConversation',
          value: updatedConversation,
        })

        const updatedConversations = updateConversations(updatedConversation)
        if (!updatedConversations) {
          throw new Error('Failed to update conversations')
        }

        homeDispatch({ field: 'conversations', value: updatedConversations })
        // saveConversations(updatedConversations)
      },
      [selectedConversation, conversations],
    )

    const handleFeedback = useCallback(
      async (
        message: Message,
        isPositive: boolean,
        category?: string,
        details?: string,
      ) => {
        if (!selectedConversation) return

        // Get conversation from localStorage and parse it
        const sourceConversationStr = localStorage.getItem(
          'selectedConversation',
        )
        let sourceConversation

        try {
          sourceConversation = sourceConversationStr
            ? JSON.parse(sourceConversationStr)
            : null
        } catch (error) {
          sourceConversation = null
        }

        if (!sourceConversation?.messages) {
          return
        }

        // Create updated conversation object using sourceConversation as the base
        const updatedConversation = {
          ...sourceConversation,
          messages: sourceConversation.messages.map((msg: Message) => {
            if (msg.id === message.id) {
              return {
                ...msg,
                feedback: {
                  isPositive,
                  category,
                  details,
                },
              }
            }
            return msg
          }),
        }

        try {
          // Update localStorage
          localStorage.setItem(
            'selectedConversation',
            JSON.stringify(updatedConversation),
          )

          // Update the conversation using handleUpdateConversation
          handleFeedbackUpdate(updatedConversation, {
            key: 'messages',
            value: updatedConversation.messages,
          })

          // Update database
          await updateConversationMutation.mutateAsync(updatedConversation)

          // Log to Supabase
          await fetch('/api/UIUC-api/logConversationToSupabase', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              course_name: getCurrentPageName(),
              conversation: updatedConversation,
              llmProviders: llmProviders,
            }),
          })
        } catch (error) {
          homeDispatch({
            field: 'conversations',
            value: conversations,
          })
          homeDispatch({
            field: 'selectedConversation',
            value: sourceConversation,
          })
          errorToast({
            title: 'Error updating feedback',
            message: 'Failed to save feedback. Please try again.',
          })
        }
      },
      [
        selectedConversation,
        conversations,
        homeDispatch,
        updateConversationMutation,
      ],
    )

    return (
      <>
        <Head>
          <title>{getCurrentPageName()} - UIUC.chat</title>
          <meta
            name="description"
            content="The AI teaching assistant built for students at UIUC."
          />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <div className="overflow-wrap relative flex h-screen w-full flex-col overflow-hidden bg-white dark:bg-[#15162c]">
          <div className="justify-center" style={{ height: '40px' }}>
            <ChatNavbar bannerUrl={bannerUrl as string} isgpt4={true} />
          </div>
          <div className="mt-10 max-w-full flex-grow overflow-y-auto overflow-x-hidden">
            {modelError ? (
              <ErrorMessageDiv error={modelError} />
            ) : (
              <>
                <motion.div
                  key={selectedConversation?.id}
                  className="mt-4 max-h-full"
                  ref={chatContainerRef}
                  onScroll={handleScroll}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                >
                  {selectedConversation &&
                  selectedConversation.messages &&
                  selectedConversation.messages?.length === 0 ? (
                    <>
                      <div className="mt-16">
                        {renderIntroductoryStatements()}
                      </div>
                    </>
                  ) : (
                    <>
                      {selectedConversation?.messages?.map((message, index) => (
                        <MemoizedChatMessage
                          key={index}
                          message={message}
                          contentRenderer={renderMessageContent}
                          messageIndex={index}
                          onEdit={(editedMessage) => {
                            handleSend(
                              editedMessage,
                              selectedConversation?.messages?.length - index,
                              null,
                              tools,
                              enabledDocumentGroups,
                              llmProviders,
                            )
                          }}
                          onFeedback={handleFeedback}
                          onImageUrlsUpdate={onImageUrlsUpdate}
                        />
                      ))}
                      {loading && <ChatLoader />}
                      <div
                        className="h-[162px] bg-gradient-to-t from-transparent to-[rgba(14,14,21,0.4)]"
                        ref={messagesEndRef}
                      />
                    </>
                  )}
                </motion.div>
                {/* <div className="w-full max-w-[calc(100% - var(--sidebar-width))] mx-auto flex justify-center"> */}
                <ChatInput
                  stopConversationRef={stopConversationRef}
                  textareaRef={textareaRef}
                  onSend={(message, plugin) => {
                    // setCurrentMessage(message)
                    handleSend(
                      message,
                      0,
                      plugin,
                      tools,
                      enabledDocumentGroups,
                      llmProviders,
                    )
                  }}
                  onScrollDownClick={handleScrollDown}
                  onRegenerate={handleRegenerate}
                  showScrollDownButton={showScrollDownButton}
                  inputContent={inputContent}
                  setInputContent={setInputContent}
                  courseName={getCurrentPageName()}
                  chat_ui={chat_ui}
                />
              </>
            )}
          </div>
        </div>
      </>
    )
    Chat.displayName = 'Chat'
  },
)

export function errorToast({
  title,
  message,
}: {
  title: string
  message: string
}) {
  notifications.show({
    id: 'error-notification-reused',
    withCloseButton: true,
    closeButtonProps: { color: 'red' },
    onClose: () => console.log('error unmounted'),
    onOpen: () => console.log('error mounted'),
    autoClose: 12000,
    title: (
      <Text size={'lg'} className={`${montserrat_med.className}`}>
        {title}
      </Text>
    ),
    message: (
      <Text className={`${montserrat_med.className} text-neutral-200`}>
        {message}
      </Text>
    ),
    color: 'red',
    radius: 'lg',
    icon: <IconAlertCircle />,
    className: 'my-notification-class',
    style: {
      backgroundColor: 'rgba(42,42,64,0.3)',
      backdropFilter: 'blur(10px)',
      borderLeft: '5px solid red',
    },
    withBorder: true,
    loading: false,
  })
}
