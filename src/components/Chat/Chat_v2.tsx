// src/components/Chat/Chat.tsx
import React, {
  memo,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { Button, Text } from '@mantine/core'
import { useTranslation } from 'next-i18next'
import { v4 as uuidv4 } from 'uuid'
import { useRouter } from 'next/router'
import { useUser } from '@clerk/nextjs'
import { notifications } from '@mantine/notifications'
import Head from 'next/head'
import { Montserrat } from 'next/font/google'

import { saveConversations } from '@/utils/app/conversation'
import { throttle } from '@/utils/data/throttle'
import {
  constructChatBody,
  getOpenAIKey,
  handleContextSearch,
  handleImageContent,
  processChunkWithStateMachine,
  routeModelRequest,
  State,
} from '~/utils/streamProcessing'
import {
  handleFunctionCall,
  handleToolCall,
  useFetchAllWorkflows,
} from '~/utils/functionCalling/handleFunctionCalling'
import { useFetchEnabledDocGroups } from '~/hooks/docGroupsQueries'
import { CropwizardLicenseDisclaimer } from '~/pages/cropwizard-licenses'
import ChatUI, { webLLMModels } from '~/utils/modelProviders/WebLLM'
import { MLCEngine } from '@mlc-ai/web-llm'
import * as webllm from '@mlc-ai/web-llm'
import { WebllmModel } from '~/utils/modelProviders/WebLLM'
import { useQueryClient } from '@tanstack/react-query'
import { useUpdateConversation } from '~/hooks/conversationQueries'
import { useDeleteMessages } from '~/hooks/messageQueries'

import HomeContext from '~/pages/api/home/home.context'

import { ChatInput } from './ChatInput'
import { MemoizedChatMessage } from './MemoizedChatMessage'
import { ChatLoader } from './ChatLoader'

import { type CourseMetadata } from '~/types/courseMetadata'
import { type Plugin } from '@/types/plugin'
import {
  type ChatBody,
  type Conversation,
  type Message,
  Content,
  UIUCTool,
} from '@/types/chat'

import { fetchPresignedUrl } from '~/utils/apiUtils'
import { extractEmailsFromClerk } from '../UIUC-Components/clerkHelpers'
import ChatIntro from './ChatIntro'
import ChatHeader from './ChatHeader'
import ChatMessages from './ChatMessages'
import ScrollDownButton from './ScrollDownButton'
import { IconAlertCircle } from '@tabler/icons-react'

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

interface Props {
  stopConversationRef: React.MutableRefObject<boolean>
  courseMetadata: CourseMetadata
  courseName: string
  currentEmail: string
}

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

    const [bannerUrl, setBannerUrl] = useState<string | null>(null)
    const getCurrentPageName = () => {
      // /CS-125/materials --> CS-125
      return router.asPath.slice(1).split('/')[0] as string
    }
    const user_email = extractEmailsFromClerk(clerk_obj.user)[0]

    const [chat_ui] = useState(new ChatUI(new MLCEngine()))
    const [inputContent, setInputContent] = useState<string>('')
    const [enabledDocumentGroups, setEnabledDocumentGroups] = useState<
      string[]
    >([])
    const [enabledTools, setEnabledTools] = useState<string[]>([])

    const { data: documentGroupsHook, isSuccess: isSuccessDocumentGroups } =
      useFetchEnabledDocGroups(getCurrentPageName())

    const {
      data: toolsHook,
      isSuccess: isSuccessTools,
      isLoading: isLoadingTools,
      isError: isErrorTools,
      error: toolLoadingError,
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

    useEffect(() => {
      if (clerk_obj.isLoaded && clerk_obj.isSignedIn) {
        const emails = extractEmailsFromClerk(clerk_obj.user)
        // setUserEmail(emails[0] as string)
        selectedConversation!.userEmail = emails[0] as string
      }
    }, [clerk_obj.isSignedIn])

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
      },
      handleUpdateConversation,
      dispatch: homeDispatch,
    } = useContext(HomeContext)

    useEffect(() => {
      const loadModel = async () => {
        if (selectedConversation && !chat_ui.isModelLoading()) {
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
        selectedConversation &&
        webLLMModels.some((m) => m.name === selectedConversation.model.name)
      ) {
        loadModel()
      }
    }, [selectedConversation?.model.name, chat_ui, homeDispatch])

    const [currentMessage, setCurrentMessage] = useState<Message>()
    const [autoScrollEnabled, setAutoScrollEnabled] = useState<boolean>(true)
    const [showScrollDownButton, setShowScrollDownButton] =
      useState<boolean>(false)

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const chatContainerRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

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
    }, [documentGroupsHook, isSuccessDocumentGroups, homeDispatch])

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
    }, [
      toolsHook,
      isSuccessTools,
      isErrorTools,
      toolLoadingError,
      homeDispatch,
    ])

    useEffect(() => {
      setEnabledTools(
        tools.filter((action) => action.enabled).map((action) => action.name),
      )
    }, [tools])

    const onMessageReceived = async (conversation: Conversation) => {
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
        // Handle response if needed
      } catch (error) {
        console.error('Error setting course data:', error)
        // Handle error if needed
      }

      // Log conversation to Flask Backend
      try {
        const response = await fetch(
          `https://flask-production-751b.up.railway.app/onResponseCompletion`,
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
      ) => {
        setCurrentMessage(message)
        resetMessageStates()
        console.log('first message from refactored version')

        let searchQuery = Array.isArray(message.content)
          ? message.content.map((content) => content.text).join(' ')
          : message.content

        if (selectedConversation) {
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

            const updatedMessages = [...selectedConversation.messages]
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
              messages: [...selectedConversation.messages, message],
            }
            // Update the name of the conversation if it's the first message
            if (updatedConversation.messages.length === 1) {
              const { content } = message
              const contentText = Array.isArray(content)
                ? content.map((content) => content.text).join(' ')
                : content

              const customName =
                contentText.length > 30
                  ? contentText.substring(0, 30) + '...'
                  : contentText

              updatedConversation = {
                ...updatedConversation,
                name: customName,
              }
            }
          }
          // Update the conversation in the server
          handleUpdateConversation(updatedConversation, {
            key: 'messages',
            value: updatedConversation.messages,
          })
          updateConversationMutation.mutate(updatedConversation)
          homeDispatch({ field: 'loading', value: true })
          homeDispatch({ field: 'messageIsStreaming', value: true })
          const controller = new AbortController()

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
                    courseMetadata,
                    apiKey,
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
          homeDispatch({ field: 'isRetrievalLoading', value: true })
          await handleContextSearch(
            message,
            courseName,
            selectedConversation,
            searchQuery,
            enabledDocumentGroups,
          )
          homeDispatch({ field: 'isRetrievalLoading', value: false })

          // Action 3: Tool Execution
          if (tools.length > 0) {
            try {
              homeDispatch({ field: 'isRouting', value: true })
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

          const chatBody: ChatBody = constructChatBody(
            updatedConversation,
            getOpenAIKey(courseMetadata, apiKey),
            courseName,
            true,
            courseMetadata,
          )
          // Action 4: Build Prompt
          const buildPromptResponse = await fetch('/api/buildPrompt', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(chatBody),
          })
          chatBody.conversation = await buildPromptResponse.json()
          updatedConversation = chatBody.conversation!

          homeDispatch({
            field: 'selectedConversation',
            value: chatBody.conversation,
          })

          // Action 5: Run Chat Completion based on model provider
          let response:
            | AsyncIterable<webllm.ChatCompletionChunk>
            | Response
            | undefined
          let reader

          if (
            webLLMModels.some(
              (model) => model.name === chatBody.conversation?.model.name,
            )
          ) {
            // Is WebLLM model
            while (chat_ui.isModelLoading() == true) {
              await new Promise((resolve) => setTimeout(resolve, 10))
            }
            try {
              response = await chat_ui.runChatCompletion(
                chatBody.conversation!,
                getCurrentPageName(),
              )
            } catch (error) {
              errorToast({
                title: 'Error running chat completion',
                message:
                  (error as Error).message || 'An unexpected error occurred',
              })
            }
          } else {
            try {
              // Route to the specific model provider
              response = await routeModelRequest(chatBody, controller)
            } catch (error) {
              console.error('Error routing to model provider:', error)
              errorToast({
                title: 'Error routing to model provider',
                message:
                  (error as Error).message || 'An unexpected error occurred',
              })
            }
          }

          if (response instanceof Response && !response.ok) {
            const final_response = await response.json()
            homeDispatch({ field: 'loading', value: false })
            homeDispatch({ field: 'messageIsStreaming', value: false })
            console.error(
              'Error calling the LLM:',
              final_response.name,
              final_response.message,
            )
            errorToast({
              title: final_response.name,
              message:
                final_response.message ||
                'There was an unexpected error calling the LLM. Try using a different model (via the Settings button in the header).',
            })
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
              // Action 6: Stream the LLM response
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
                  isFirst = false
                  const updatedMessages: Message[] = [
                    ...updatedConversation.messages,
                    {
                      id: uuidv4(),
                      role: 'assistant',
                      content: chunkValue,
                    },
                  ]
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
                  if (updatedConversation.messages.length > 0) {
                    const lastMessageIndex =
                      updatedConversation.messages.length - 1
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
                      const updatedMessages = updatedConversation.messages.map(
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
              // After streaming
              handleUpdateConversation(updatedConversation, {
                key: 'messages',
                value: updatedConversation.messages,
              })
              updateConversationMutation.mutate(updatedConversation)

              onMessageReceived(updatedConversation)

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
        handleUpdateConversation,
        updateConversationMutation,
        homeDispatch,
        courseMetadata,
        courseName,
        currentEmail,
        deleteMessagesMutation,
        onMessageReceived,
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
            selectedConversation?.messages.length - 1
          ]?.role === 'user'
        ) {
          handleSend(currentMessage, 1, null, tools, enabledDocumentGroups)
        } else {
          handleSend(currentMessage, 2, null, tools, enabledDocumentGroups)
        }
      }
    }, [
      currentMessage,
      handleSend,
      selectedConversation,
      tools,
      enabledDocumentGroups,
    ])

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
      }
    }

    const handleScrollDown = () => {
      chatContainerRef.current?.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth',
      })
      setAutoScrollEnabled(true)
      setShowScrollDownButton(false)
    }

    const handleSettings = () => {
      homeDispatch({ field: 'showModelSettings', value: !showModelSettings })
    }

    const onClearAll = () => {
      if (
        confirm(t<string>('Are you sure you want to clear all messages?')) &&
        selectedConversation
      ) {
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
      throttledScrollDown()
      if (selectedConversation) {
        const messages = selectedConversation.messages
        if (messages.length > 1) {
          if (messages[messages.length - 1]?.role === 'assistant') {
            setCurrentMessage(messages[messages.length - 2])
          } else {
            setCurrentMessage(messages[messages.length - 1])
          }
        } else if (messages.length === 1) {
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

    const renderIntroductoryStatements = () => {
      return (
        <ChatIntro
          statements={statements}
          setInputContent={setInputContent}
          courseMetadata={courseMetadata}
          getCurrentPageName={getCurrentPageName}
        />
      )
    }

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
      return selectedConversation?.messages.map((message, index) => {
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
      },
      [selectedConversation, conversations, homeDispatch],
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
          <ChatHeader bannerUrl={bannerUrl as string} />
          <div className="mt-10 max-w-full flex-grow overflow-y-auto overflow-x-hidden">
            <ChatMessages
              selectedConversation={selectedConversation as Conversation}
              loading={loading}
              modelError={modelError?.messageLines[0] as string}
              renderIntroductoryStatements={renderIntroductoryStatements}
              handleSend={(
                message,
                deleteCount,
                plugin,
                tools,
                enabledDocumentGroups,
              ) =>
                handleSend(
                  message,
                  deleteCount,
                  null,
                  tools,
                  enabledDocumentGroups,
                )
              }
              onImageUrlsUpdate={onImageUrlsUpdate}
              tools={tools}
              enabledDocumentGroups={enabledDocumentGroups}
            />
            {showScrollDownButton && (
              <ScrollDownButton onClick={handleScrollDown} />
            )}
            <ChatInput
              stopConversationRef={stopConversationRef}
              textareaRef={textareaRef}
              onSend={(message, plugin) => {
                handleSend(message, 0, plugin, tools, enabledDocumentGroups)
              }}
              onScrollDownClick={handleScrollDown}
              onRegenerate={handleRegenerate}
              showScrollDownButton={showScrollDownButton}
              inputContent={inputContent}
              setInputContent={setInputContent}
              courseName={getCurrentPageName()}
              chat_ui={chat_ui}
            />
          </div>
        </div>
      </>
    )
  },
)

Chat.displayName = 'Chat'

export default Chat

// Error Toast Function (Remains in Chat.tsx)
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
