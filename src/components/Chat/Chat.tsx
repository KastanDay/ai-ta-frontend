// src/components/Chat/Chat.tsx
import {
  // IconBrain,
  // IconClearAll,
  IconArrowRight,
  // IconCloudUpload,
  IconExternalLink,
  // IconRobot,
  // IconSettings,
  IconAlertTriangle,
  IconArrowLeft,
  IconLock,
  IconBrain,
  IconCreditCard,
  // IconArrowUpRight,
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
import { Button, Text, Title } from '@mantine/core'
import { useTranslation } from 'next-i18next'

import { getEndpoint } from '@/utils/app/api'
import {
  saveConversation,
  saveConversations,
  updateConversation,
} from '@/utils/app/conversation'
import { throttle } from '@/utils/data/throttle'

import {
  type ContextWithMetadata,
  type ChatBody,
  type Conversation,
  type Message,
} from '@/types/chat'
import { type Plugin } from '@/types/plugin'

import HomeContext from '~/pages/api/home/home.context'

// import Spinner from '../Spinner'
import { ChatInput } from './ChatInput'
import { ChatLoader } from './ChatLoader'
import { ErrorMessageDiv } from './ErrorMessageDiv'
// import { ModelSelect } from './ModelSelect'
// import { SystemPrompt } from './SystemPrompt'
// import { TemperatureSlider } from './Temperature'
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
// import CustomBanner from '../UIUC-Components/CustomBanner'
import { fetchContexts } from '~/pages/api/getContexts'
import { useUser } from '@clerk/nextjs'
import { extractEmailsFromClerk } from '../UIUC-Components/clerkHelpers'
import { type OpenAIModelID, OpenAIModels } from '~/types/openai'
import Navbar from '../UIUC-Components/Navbar'
import TopBarInChat from '../Chatbar/TopBarInChat'
import { MainPageBackground } from '../UIUC-Components/MainPageBackground'

export const Chat = memo(({ stopConversationRef, courseMetadata }: Props) => {
  const { t } = useTranslation('chat')
  const clerk_obj = useUser()
  const router = useRouter()
  const [bannerUrl, setBannerUrl] = useState<string | null>(null)
  const getCurrentPageName = () => {
    // /CS-125/materials --> CS-125
    return router.asPath.slice(1).split('/')[0] as string
  }

  const redirectToMaterialsPage = () => {
    router.push(`/${getCurrentPageName()}/materials`)
  }

  const [inputContent, setInputContent] = useState<string>('')

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
      showModelSettings,
    },
    handleUpdateConversation,
    dispatch: homeDispatch,
  } = useContext(HomeContext)

  const [currentMessage, setCurrentMessage] = useState<Message>()
  const [autoScrollEnabled, setAutoScrollEnabled] = useState<boolean>(true)
  // const [showSettings, setShowSettings] = useState<boolean>(false)
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
          key:
            courseMetadata?.openai_api_key &&
              courseMetadata?.openai_api_key != ''
              ? courseMetadata.openai_api_key
              : apiKey,
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
    // setShowSettings(!showSettings)
    // TODO: dispatch if we should show model settings or not
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
  const renderIntroductoryStatements = () => {
    return (
      <div className="xs:mx-2 mt-4 max-w-3xl gap-3 px-4 last:mb-2 sm:mx-4 md:mx-auto lg:mx-auto ">
        <div className="backdrop-filter-[blur(10px)] rounded-lg border border-2 border-[rgba(42,42,120,0.55)] bg-[rgba(42,42,64,0.4)] p-6">
          <h1 className="mb-2 text-lg font-semibold text-white">
            Start a conversation below or try the following examples
          </h1>
          <div className="mt-4 flex flex-col items-start space-y-2 overflow-hidden">
            {statements.map((statement, index) => (
              <div
                key={index}
                className="w-full rounded-lg border-b-2 border-[rgba(42,42,64,0.4)] hover:cursor-pointer hover:bg-[rgba(42,42,64,0.9)]"
                onClick={() => setInputContent(statement)}
              >
                <Button
                  variant="link"
                  className="text-md h-auto p-2 font-bold leading-relaxed text-white hover:underline "
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

  return (
    <div className="overflow-wrap relative flex-1 bg-white dark:bg-[#15162c]">
      {!(apiKey || serverSideApiKeyIsSet) ? (
        <div className="min-w-screen relative min-h-screen flex-1 overflow-hidden">
          <Navbar isgpt4={true} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className=" backdrop-filter-[blur(10px)] rounded-box mx-auto max-w-4xl flex-col items-center border border-2 border-[rgba(255,165,0,0.8)] bg-[rgba(42,42,64,0.3)] p-10 text-2xl font-bold text-black dark:text-white">
              <div className="mb-2 flex flex-col items-center text-center">
                <IconAlertTriangle
                  size={'54'}
                  className="mr-2 block text-orange-400 "
                />
                <div className="mt-4 text-left text-gray-100">
                  {' '}
                  {t(
                    'Please set your OpenAI API key in the bottom left of the screen.',
                  )}
                  <div className="mt-2 font-normal">
                    <Text size={'md'} className="text-gray-100">
                      If you don&apos;t have a key yet, you can get one here:{' '}
                      <a
                        href="https://platform.openai.com/account/api-keys"
                        target="_blank"
                        rel="noreferrer"
                        className="text-purple-500 hover:underline"
                      >
                        OpenAI API key{' '}
                        <IconExternalLink
                          className="mr-2 inline-block"
                          style={{ position: 'relative', top: '-3px' }}
                        />
                      </a>
                    </Text>
                    <Text size={'md'} className="pt-10 text-gray-400">
                      <IconLock className="mr-2 inline-block" />
                      This key will live securely encrypted in your
                      browser&apos;s cache. It&apos;s all client-side so our
                      servers never see it.
                    </Text>
                    <Text size={'md'} className="pt-10 text-gray-400">
                      <IconBrain className="mr-2 inline-block" />
                      GPT 3.5 is default. For GPT-4 access, either complete one
                      billing cycle as an OpenAI API customer or pre-pay a
                      minimum of $0.50. See
                      <a
                        className="text-purple-500 hover:underline"
                        href="https://help.openai.com/en/articles/7102672-how-can-i-access-gpt-4"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {' '}
                        this documentation for details{' '}
                        <IconExternalLink
                          className="mr-2 inline-block"
                          style={{ position: 'relative', top: '-3px' }}
                        />
                      </a>
                    </Text>
                    <Text size={'md'} className="pt-10 text-gray-400">
                      <IconCreditCard className="mr-2 inline-block" />
                      You only pay the standard OpenAI prices, per token read or
                      generated by the model.
                    </Text>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute bottom-4 left-0 ml-4 mt-4 animate-ping flex-col place-items-start text-left">
              <IconArrowLeft
                size={'36'}
                className="mr-2 transform text-purple-500 transition-transform duration-500 ease-in-out hover:-translate-x-1"
              />
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
            {selectedConversation?.messages.length === 0 ? (
              <>
                <TopBarInChat
                  handleSettings={handleSettings}
                  showSettings={showModelSettings}
                  selectedConversation={selectedConversation}
                  redirectToMaterialsPage={redirectToMaterialsPage}
                />
                {/* <CustomBanner bannerUrl={bannerUrl as string} /> Banner on fresh chat page */}
                <Navbar bannerUrl={bannerUrl as string} isgpt4={true} />
                <div className="xs:mx-2 mt-4 mt-8 flex max-w-3xl flex-col gap-3 gap-3 space-y-5 p-4 last:mb-2 sm:mx-4 md:mx-auto md:space-y-10 md:pt-12 lg:mx-auto">
                  {models.length > 0 && (
                    <div className="flex h-full flex-col space-y-4 focus:border-t-info/100 dark:border-neutral-600">
                      <ModelParams
                        selectedConversation={selectedConversation}
                        prompts={prompts}
                        handleUpdateConversation={handleUpdateConversation}
                        t={t}
                      />
                    </div>
                  )}
                </div>
                <div className="mt-16">{renderIntroductoryStatements()}</div>
              </>
            ) : (
              <>
                {/* MESSAGES IN CHAT */}
                <div className="sticky top-0 z-10">
                  <TopBarInChat
                    handleSettings={handleSettings}
                    showSettings={showModelSettings}
                    selectedConversation={selectedConversation}
                    redirectToMaterialsPage={redirectToMaterialsPage}
                  />
                </div>
                {/* <CustomBanner bannerUrl={bannerUrl as string} />{' '} */}
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
                  // className="h-[162px] bg-gradient-to-b from-[#1a1a2e] via-[#2A2A40] to-[#15162c]"
                  // reverse the order, go from transparent to the color
                  // className="h-[162px] bg-gradient-to-t from-[rgba(42,42,64,0.4)] to-transparent"
                  // className="h-[162px] bg-gradient-to-t from-[rgba(14,14,21,0.4)] to-transparent"
                  className="h-[162px] bg-gradient-to-t from-transparent to-[rgba(14,14,21,0.4)]"
                  // className="h-[162px] bg-gradient-to-b dark:from-[#2e026d] dark:via-[#15162c] dark:to-[#15162c]"
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
            inputContent={inputContent}
            setInputContent={setInputContent}
          />
        </>
      )}
    </div>
  )
})
Chat.displayName = 'Chat'
