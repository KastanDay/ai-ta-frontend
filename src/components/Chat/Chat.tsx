// src/components/Chat/Chat.tsx
import {
  IconBrain,
  IconClearAll,
  IconCloudUpload,
  IconExternalLink,
  IconRobot,
  IconSettings,
  // IconFileTextAi,
  // IconX,
  // IconDownload,
  // IconClearAll,
  // IconSettings,
} from '@tabler/icons-react'
import {
  type MutableRefObject,
  memo,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import toast from 'react-hot-toast'
import { Text, Title } from '@mantine/core'
import { useTranslation } from 'next-i18next'

import { getEndpoint } from '@/utils/app/api'
import {
  saveConversation,
  saveConversations,
  updateConversation,
} from '@/utils/app/conversation'
import { throttle } from '@/utils/data/throttle'

import {
  ContextWithMetadata,
  type ChatBody,
  type Conversation,
  type Message,
} from '@/types/chat'
import { type Plugin } from '@/types/plugin'

import HomeContext from '~/pages/api/home/home.context'

import Spinner from '../Spinner'
import { ChatInput } from './ChatInput'
import { ChatLoader } from './ChatLoader'
import { ErrorMessageDiv } from './ErrorMessageDiv'
import { ModelSelect } from './ModelSelect'
import { SystemPrompt } from './SystemPrompt'
import { TemperatureSlider } from './Temperature'
import { MemoizedChatMessage } from './MemoizedChatMessage'
import { ModelParams } from './ModelParams'
import { fetchPresignedUrl } from '~/components/UIUC-Components/ContextCards'

// import { useSearchQuery } from '~/components/UIUC-Components/ContextCards'
// import SearchQuery from '~/components/UIUC-Components/StatefulSearchQuery'
import { type CourseMetadata } from '~/types/courseMetadata'
// import { logConvoToSupabase } from '~/pages/api/UIUC-api/logConversationToSupabase'

interface Props {
  stopConversationRef: MutableRefObject<boolean>
  courseMetadata: CourseMetadata
}

import { useRouter } from 'next/router'
import CustomBanner from '../UIUC-Components/CustomBanner'
import { fetchContexts } from '~/pages/api/getContexts'
import { useUser } from '@clerk/nextjs'
import { extractEmailsFromClerk } from '../UIUC-Components/clerkHelpers'
import { OpenAIModelID, OpenAIModels } from '~/types/openai'
import axios from 'axios'

export const Chat = memo(({ stopConversationRef, courseMetadata }: Props) => {
  const { t } = useTranslation('chat')

  const clerk_obj = useUser()

  // how to get the current route inside ANY component
  const router = useRouter()
  const [bannerUrl, setBannerUrl] = useState<string | null>(null)
  const getCurrentPageName = () => {
    // /CS-125/materials --> CS-125
    return router.asPath.slice(1).split('/')[0] as string
  }

  const redirectToMaterialsPage = () => {
    router.push(`/${getCurrentPageName()}/materials`)
  }

  useEffect(() => {
    if (courseMetadata?.banner_image_s3) {
      console.log('Fetching course banner url')
      fetchPresignedUrl(courseMetadata.banner_image_s3).then((url) => {
        console.log('Setting course banner url')
        setBannerUrl(url)
      })
    }
  }, [courseMetadata])

  const {
    state: {
      selectedConversation,
      conversations,
      models,
      apiKey,
      pluginKeys,
      serverSideApiKeyIsSet,
      messageIsStreaming,
      modelError,
      loading,
      prompts,
    },
    handleUpdateConversation,
    dispatch: homeDispatch,
  } = useContext(HomeContext)

  const [currentMessage, setCurrentMessage] = useState<Message>()
  const [autoScrollEnabled, setAutoScrollEnabled] = useState<boolean>(true)
  const [showSettings, setShowSettings] = useState<boolean>(false)
  const [showScrollDownButton, setShowScrollDownButton] =
    useState<boolean>(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const onMessageReceived = async (conversation: Conversation) => {
    // Log conversation to Supabase
    try {
      const response = await fetch(`/api/UIUC-api/logConversationToSupabase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          course_name: getCurrentPageName(),
          conversation: conversation,
        }),
      })
      const data = await response.json()
      // return data.success
    } catch (error) {
      console.error('Error setting course data:', error)
      // return false
    }

    // TODO: DELETE ME AFTER PR72 on the backend IS MERGED. Update the one below
    try {
      // const API_URL = 'https://flask-production-751b.up.railway.app'
      // const API_URL_PREVIEW = 'https://flask-ai-ta-backend-pr-72.up.railway.app'
      const API_URL_PREVIEW = 'https://smee.io/zx6ghuGrFuIIUHSs'

      const response = await fetch(`${API_URL_PREVIEW}/onResponseCompletion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          course_name: getCurrentPageName(),
          conversation: conversation,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message)
      // return data.success
    } catch (error) {
      console.error('Error in chat.tsx running onResponseCompletion():', error)
      // return false
    }

    // Log conversation to our Flask Backend (BOTH ASMITA local && the PR72)
    try {
      // TODO: Change me when pr72 is merged
      // const API_URL = 'https://flask-production-751b.up.railway.app'
      const API_URL_PREVIEW = 'https://flask-ai-ta-backend-pr-72.up.railway.app'

      const response = await fetch(`${API_URL_PREVIEW}/onResponseCompletion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          course_name: getCurrentPageName(),
          conversation: conversation,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message)
      return data.success
    } catch (error) {
      console.error('Error in chat.tsx running onResponseCompletion():', error)
      return false
    }
  }

  // THIS IS WHERE MESSAGES ARE SENT.
  const handleSend = useCallback(
    async (message: Message, deleteCount = 0, plugin: Plugin | null = null) => {
      // New way with React Context API
      // TODO: MOVE THIS INTO ChatMessage
      // console.log('IN handleSend: ', message)
      // setSearchQuery(message.content)
      const searchQuery = message.content

      if (selectedConversation) {
        let updatedConversation: Conversation
        if (deleteCount) {
          const updatedMessages = [...selectedConversation.messages]
          for (let i = 0; i < deleteCount; i++) {
            updatedMessages.pop()
          }
          updatedConversation = {
            ...selectedConversation,
            messages: [...updatedMessages, message],
          }
        } else {
          updatedConversation = {
            ...selectedConversation,
            messages: [...selectedConversation.messages, message],
          }
        }
        homeDispatch({
          field: 'selectedConversation',
          value: updatedConversation,
        })
        homeDispatch({ field: 'loading', value: true })
        homeDispatch({ field: 'messageIsStreaming', value: true })

        // Run context search, attach to Message object.
        if (getCurrentPageName() != 'gpt4') {
          // THE ONLY place we fetch contexts (except ExtremePromptStuffing is still in api/chat.ts)
          const token_limit =
            OpenAIModels[selectedConversation?.model.id as OpenAIModelID]
              .tokenLimit
          await fetchContexts(
            getCurrentPageName(),
            searchQuery,
            token_limit,
          ).then((curr_contexts) => {
            message.contexts = curr_contexts as ContextWithMetadata[]
          })
        }

        const chatBody: ChatBody = {
          model: updatedConversation.model,
          messages: updatedConversation.messages,
          key: apiKey,
          prompt: updatedConversation.prompt,
          temperature: updatedConversation.temperature,
          course_name: getCurrentPageName(),
        }
        const endpoint = getEndpoint(plugin) // THIS is where we could support EXTREME prompt stuffing.
        let body
        if (!plugin) {
          body = JSON.stringify(chatBody)
        } else {
          body = JSON.stringify({
            ...chatBody,
            googleAPIKey: pluginKeys
              .find((key) => key.pluginId === 'google-search')
              ?.requiredKeys.find((key) => key.key === 'GOOGLE_API_KEY')?.value,
            googleCSEId: pluginKeys
              .find((key) => key.pluginId === 'google-search')
              ?.requiredKeys.find((key) => key.key === 'GOOGLE_CSE_ID')?.value,
          })
        }
        const controller = new AbortController()
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
          body,
        })
        if (!response.ok) {
          homeDispatch({ field: 'loading', value: false })
          homeDispatch({ field: 'messageIsStreaming', value: false })
          toast.error(response.statusText)
          return
        }
        const data = response.body
        if (!data) {
          homeDispatch({ field: 'loading', value: false })
          homeDispatch({ field: 'messageIsStreaming', value: false })
          return
        }
        if (!plugin) {
          if (updatedConversation.messages.length === 1) {
            const { content } = message
            const customName =
              content.length > 30 ? content.substring(0, 30) + '...' : content
            updatedConversation = {
              ...updatedConversation,
              name: customName,
            }
          }
          homeDispatch({ field: 'loading', value: false })
          const reader = data.getReader()
          const decoder = new TextDecoder()
          let done = false
          let isFirst = true
          let text = ''
          while (!done) {
            if (stopConversationRef.current === true) {
              controller.abort()
              done = true
              break
            }
            const { value, done: doneReading } = await reader.read()
            done = doneReading
            const chunkValue = decoder.decode(value)
            text += chunkValue
            if (isFirst) {
              // isFirst refers to the first chunk of data received from the API (happens once for each new message from API)
              isFirst = false
              const updatedMessages: Message[] = [
                ...updatedConversation.messages,
                {
                  role: 'assistant',
                  content: chunkValue,
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
            } else {
              const updatedMessages: Message[] =
                updatedConversation.messages.map((message, index) => {
                  if (index === updatedConversation.messages.length - 1) {
                    return {
                      ...message,
                      content: text,
                      // responseTimeSec: // TODO: try to track this.. mostly in ChatMessage.tsx
                    }
                  }
                  return message
                })
              updatedConversation = {
                ...updatedConversation,
                messages: updatedMessages,
              }
              homeDispatch({
                field: 'selectedConversation',
                value: updatedConversation,
              })
            }
          }
          saveConversation(updatedConversation)
          // todo: add clerk user info to onMessagereceived for logging.
          if (clerk_obj.isLoaded && clerk_obj.isSignedIn) {
            console.log('clerk_obj.isLoaded && clerk_obj.isSignedIn')
            const emails = extractEmailsFromClerk(clerk_obj.user)
            updatedConversation.user_email = emails[0]
            onMessageReceived(updatedConversation) // kastan here, trying to save message AFTER done streaming. This only saves the user message...
          } else {
            console.log('NOT LOADED OR SIGNED IN')
            onMessageReceived(updatedConversation)
          }

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
          homeDispatch({ field: 'conversations', value: updatedConversations })
          saveConversations(updatedConversations)
          homeDispatch({ field: 'messageIsStreaming', value: false })
        } else {
          const { answer } = await response.json()
          const updatedMessages: Message[] = [
            ...updatedConversation.messages,
            { role: 'assistant', content: answer, contexts: message.contexts },
          ]
          updatedConversation = {
            ...updatedConversation,
            messages: updatedMessages,
          }
          homeDispatch({
            field: 'selectedConversation',
            value: updatedConversation,
          })
          saveConversation(updatedConversation)
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
          homeDispatch({ field: 'conversations', value: updatedConversations })
          saveConversations(updatedConversations)
          homeDispatch({ field: 'loading', value: false })
          homeDispatch({ field: 'messageIsStreaming', value: false })
        }
      }
    },
    [
      apiKey,
      conversations,
      pluginKeys,
      selectedConversation,
      stopConversationRef,
    ],
  )

  const scrollToBottom = useCallback(() => {
    if (autoScrollEnabled) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      textareaRef.current?.focus()
    }
  }, [autoScrollEnabled])

  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current
      const bottomTolerance = 30

      if (scrollTop + clientHeight < scrollHeight - bottomTolerance) {
        setAutoScrollEnabled(false)
        setShowScrollDownButton(true)
      } else {
        setAutoScrollEnabled(true)
        setShowScrollDownButton(false)
      }
    }
  }

  const handleScrollDown = () => {
    chatContainerRef.current?.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }

  const handleSettings = () => {
    setShowSettings(!showSettings)
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

  // WHY IS THIS COMMENTED OUT???

  // useEffect(() => {
  //   console.log('currentMessage', currentMessage);
  //   if (currentMessage) {
  //     handleSend(currentMessage);
  //     homeDispatch({ field: 'currentMessage', value: undefined });
  //   }
  // }, [currentMessage]);

  useEffect(() => {
    throttledScrollDown()
    selectedConversation &&
      setCurrentMessage(
        selectedConversation.messages[selectedConversation.messages.length - 2],
      )
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

  const statements = courseMetadata?.course_intro_message
    ? courseMetadata.course_intro_message.split('\n')
    : [
      'Make a bullet point list of key takeaways of the course.',
      'What is [your favorite topic] and why is it worth learning about?',
      'How can I effectively prepare for the upcoming exam?',
      'How many assignments in the course?',
    ]

  // Add this function to create dividers with statements
  const renderDividers = () => {
    return statements.map((statement, index) => (
      <div key={index} className="flex w-full flex-col items-center px-1">
        <div className="card rounded-box grid min-h-[6rem] w-full place-items-center justify-items-center bg-base-300/50 text-lg text-black dark:text-white sm:w-3/5">
          <div className="overflow-auto p-4 text-center">
            <p>{statement}</p>
          </div>
        </div>
        {index !== statements.length - 1 && (
          <div className="divider mx-auto w-full sm:w-3/5"></div>
        )}
      </div>
    ))
  }

  return (
    <div className="relative flex-1 overflow-hidden bg-white dark:bg-[#343541]">
      {!(apiKey || serverSideApiKeyIsSet) ? (
        <div className="mx-auto flex h-full w-[300px] flex-col justify-center space-y-6 sm:w-[600px]">
          <div className="text-center text-4xl font-bold text-black dark:text-white">
            UIUC Course AI
          </div>
          <div className="text-center text-lg text-black dark:text-white"></div>
          <div className="text-center text-gray-500 dark:text-gray-400">
            <div className="rounded border border-2 border-solid border-red-500 p-4">
              <Title>⚠️</Title>
              <div className="mb-2">
                <Title
                  // className={montserrat.className}
                  variant="gradient"
                  gradient={{ from: 'red', to: 'white', deg: 50 }}
                  order={3}
                  p="xl"
                >
                  Please set your OpenAI API key in the bottom left of the
                  sidebar.
                </Title>
              </div>
              <div>
                <Text size={'md'}>
                  If you don&apos;t have an OpenAI API key, you can get one here:{' '}
                  <a
                    href="https://platform.openai.com/account/api-keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    openai.com
                  </a>
                </Text>
              </div>
            </div>
          </div>
        </div>
      ) : modelError ? (
        <ErrorMessageDiv error={modelError} />
      ) : (
        <>
          <div
            className="max-h-full overflow-x-hidden"
            ref={chatContainerRef}
            onScroll={handleScroll}
          >
            {/* Always render the 'model, upload, disclaimer' banner */}
            <div className="sticky top-0 z-10 flex w-full flex-col justify-center bg-neutral-100 text-sm text-neutral-500 dark:border-none dark:bg-[#444654] dark:text-neutral-200">
              <div className="flex justify-center border border-b-neutral-300 bg-neutral-100 py-2 text-sm text-neutral-500 dark:border-none dark:bg-[#444654] dark:text-neutral-200">
                <button
                  className="ml-2 cursor-pointer hover:opacity-50"
                  onClick={handleSettings}
                >
                  <div className="flex items-center">
                    {t('Model')}: {selectedConversation?.model.name}
                    <span className="w-2" />
                    <IconRobot size={18} />
                  </div>
                </button>
                <span className="w-3" />
                |
                <span className="w-3" />
                <button
                  className="ml-2 cursor-pointer hover:opacity-50"
                  onClick={redirectToMaterialsPage}
                >
                  <div className="flex items-center">
                    <Text
                      variant="gradient"
                      weight={600}
                      gradient={{ from: 'gold', to: 'white', deg: 50 }}
                    >
                      Upload materials
                    </Text>
                    &nbsp;&nbsp;
                    <IconCloudUpload size={18} />
                  </div>
                </button>
                &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;
                <a
                  className="ml-2 cursor-pointer hover:opacity-50"
                  href="/disclaimer"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="flex items-center">
                    <span>
                      <Text
                        variant="gradient"
                        weight={400}
                        gradient={{ from: 'white', to: 'white', deg: 50 }}
                      >
                        Disclaimer: it&apos;s not perfect
                      </Text>
                    </span>
                    &nbsp;&nbsp;
                    <IconExternalLink size={18} />
                  </div>
                </a>
              </div>
            </div>
            {showSettings && (
              <div className="flex flex-col space-y-10 md:mx-auto md:max-w-xl md:gap-6 md:py-3 md:pt-6 lg:max-w-2xl lg:px-0 xl:max-w-3xl">
                <div className="flex h-full flex-col space-y-4 border-b border-neutral-200 p-4 dark:border-neutral-600 md:rounded-lg md:border">
                  <ModelSelect />
                </div>
              </div>
            )}
            {selectedConversation?.messages.length === 0 ? (
              <>
                {bannerUrl && (
                  <div style={{ width: '100%' }}>
                    <img
                      src={bannerUrl}
                      alt="Banner"
                      style={{ width: '100%' }}
                    />
                  </div>
                )}
                <div className="mx-auto flex flex-col space-y-5 px-3 pt-5 sm:max-w-[600px] md:space-y-10 md:pt-12">
                  <div className="text-center text-3xl font-semibold text-gray-800 dark:text-gray-100">
                    {models.length === 0 ? (
                      <div>
                        <Spinner size="16px" className="mx-auto" />
                      </div>
                    ) : (
                      'UIUC Course AI'
                    )}
                  </div>

                  {models.length > 0 && (
                    <div className="flex h-full flex-col space-y-4 rounded-3xl p-4 focus:border-t-info/100 dark:border-neutral-600">
                      <ModelParams
                        selectedConversation={selectedConversation}
                        prompts={prompts}
                        handleUpdateConversation={handleUpdateConversation}
                        t={t}
                      />
                    </div>
                  )}
                </div>
                <div className="mt-16">{renderDividers()}</div>
              </>
            ) : (
              <>
                <CustomBanner bannerUrl={bannerUrl as string} />{' '}
                {selectedConversation?.messages.map((message, index) => (
                  <MemoizedChatMessage
                    key={index}
                    message={message}
                    messageIndex={index}
                    onEdit={(editedMessage) => {
                      setCurrentMessage(editedMessage)
                      handleSend(
                        editedMessage,
                        selectedConversation?.messages.length - index,
                      )
                    }}
                  />
                ))}
                {loading && <ChatLoader />}
                <div
                  className="h-[162px] bg-white dark:bg-[#343541]"
                  ref={messagesEndRef}
                />
              </>
            )}
          </div>

          <ChatInput
            stopConversationRef={stopConversationRef}
            textareaRef={textareaRef}
            onSend={(message, plugin) => {
              setCurrentMessage(message)
              handleSend(message, 0, plugin)
            }}
            onScrollDownClick={handleScrollDown}
            onRegenerate={() => {
              if (currentMessage) {
                handleSend(currentMessage, 2, null)
              }
            }}
            showScrollDownButton={showScrollDownButton}
          />
        </>
      )}
    </div>
  )
})
Chat.displayName = 'Chat'
