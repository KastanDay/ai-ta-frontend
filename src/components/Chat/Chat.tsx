// src/components/Chat/Chat.tsx
import {
  IconBrain,
  IconClearAll,
  IconArrowRight,
  IconCloudUpload,
  IconExternalLink,
  IconRobot,
  IconSettings,
  IconAlertTriangle,
  IconArrowLeft,
  IconArrowUpRight
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
import { Button, Text } from '@mantine/core'
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
import { type OpenAIModelID, OpenAIModels } from '~/types/openai'
import Navbar from '../UIUC-Components/Navbar'

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

  const [inputContent, setInputContent] = useState<string>('');

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
    // Kastan here -- Save the message to a separate database here
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
      return data.success
    } catch (error) {
      console.error('Error setting course data:', error)
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
  const renderIntroductoryStatements = () => {
    return (
      <div className="lg:mx-auto md:mx-auto mt-4 gap-3 last:mb-2 max-w-3xl px-4 sm:mx-4 xs:mx-2 ">
        <div className="rounded-lg p-6 bg-[rgba(42,42,64,0.4)] backdrop-filter-[blur(10px)] border border-[rgba(42,42,120,0.55)]">
          <h1 className="mb-2 text-lg font-semibold text-gray-300">
            You can start a conversation here or try the following examples:
          </h1>
          <div className="mt-4 flex flex-col items-start space-y-2 overflow-hidden">
            {statements.map((statement, index) => (
              <div
              key={index}
              className="border-b-2 border-[rgba(42,42,64,0.4)] w-full hover:bg-[rgba(42,42,64,0.9)] hover:cursor-pointer rounded-lg"
              onClick={() => setInputContent(statement)}>
                <Button
                  variant="link"
                  className="h-auto p-2 font-bold text-white text-md leading-relaxed hover:underline "
                >
                  <IconArrowRight className="mr-2" />
                  <p className='whitespace-break-spaces'>{statement}</p>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="relative flex-1 overflow-wrap bg-white dark:bg-gradient-to-b dark:from-[#2e026d] dark:via-[#15162c] dark:to-[#15162c]">
      {!(apiKey || serverSideApiKeyIsSet) ? (
        <div className="relative min-w-screen flex-1 overflow-hidden min-h-screen">
          <Navbar />
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <div className=" text-2xl font-bold text-black dark:text-white p-10 border-2 border-indigo-500 rounded-box flex-col items-center max-w-4xl mx-auto">
              <div className="mb-2 flex flex-col items-center text-center">
                <IconAlertTriangle size={'54'} className="mr-2 block text-orange-400 " />
                <div className='text-left mt-4'> {t(
                  'Please set your OpenAI API key in the bottom left of the sidebar.'
                )}
                  <div className='font-semibold'>
                    {t("If you don't have an OpenAI API key, you can get one here: ")}
                    <a
                      href="https://platform.openai.com/account/api-keys"
                      target="_blank"
                      rel="noreferrer"
                      className="text-purple-500 hover:underline text-xl"
                    >
                      Api Key <IconArrowUpRight className='mr-2 inline-block'></IconArrowUpRight>
                    </a>
                  </div>
                </div>

              </div>

            </div>
            <div className="mt-4 flex-col place-items-start text-left absolute bottom-4 left-0 ml-4 animate-ping">
              <IconArrowLeft size={'36'} className="mr-2 text-purple-500 transform transition-transform duration-500 ease-in-out hover:-translate-x-1" />
            </div>
          </div>
        </div>
      
      ) : modelError ? (
        <ErrorMessageDiv error={modelError} />
      ) : (
        <>
          <div
            className="max-h-full overflow-hidden"
            ref={chatContainerRef}
            onScroll={handleScroll}
          >
            {/* Always render the 'model, upload, disclaimer' banner */}
            <div className="sticky top-0 z-10 flex w-full flex-col justify-center bg-neutral-100 text-sm text-neutral-500 dark:border-none dark:bg-transparent dark:text-neutral-200">
              <div className="flex justify-center border border-b-neutral-300 bg-neutral-100 py-2 text-sm text-neutral-500 dark:border-none dark:bg-transparent dark:text-neutral-200">
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
                {/* <CustomBanner bannerUrl={bannerUrl as string} /> Banner on fresh chat page */}
                <Navbar bannerUrl={bannerUrl as string} />
                <div className="lg:mx-auto md:mx-auto mt-4 gap-3 last:mb-2 max-w-3xl sm:mx-4 xs:mx-2 mt-8 gap-3 flex flex-col space-y-5 p-4 md:space-y-10 md:pt-12">
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
                <div className="sticky top-0 z-10 flex w-full flex-col justify-center bg-neutral-100 text-sm text-neutral-500 dark:border-none dark:bg-[#444654] dark:text-neutral-200">
                  {/* {bannerUrl && (
                        <div style={{ height: '8vh' , width:'100%'}}>
                          <img src={bannerUrl} alt="Banner" style={{ width: '100%'}}/>
                        </div>
                    )} */}
                  <div className="flex justify-center border border-b-neutral-300 bg-neutral-100 py-2 text-sm text-neutral-500 dark:border-none dark:bg-[#15162c] dark:text-neutral-200">
                    {t('Model')}: {selectedConversation?.model.name}
                    &nbsp;&nbsp;|&nbsp;&nbsp;
                    {t('Temp')}: {selectedConversation?.temperature}
                    &nbsp;&nbsp;|&nbsp;&nbsp;
                    {/* BUTTONS for (1) Chaning Models, and (2) clearing current conversation. */}
                    {/* <button
                        className="ml-2 cursor-pointer hover:opacity-50"
                        onClick={handleSettings}
                      >
                        <IconSettings size={18} />
                      </button>
                      <button
                        className="ml-2 cursor-pointer hover:opacity-50"
                        onClick={onClearAll}
                      >
                        <IconClearAll size={18} />
                      </button>
                      &nbsp;&nbsp;&nbsp;| */}
                    {/* <span className="w-3" /> */}
                    <button
                      className="ml-2 cursor-pointer hover:opacity-50"
                      onClick={redirectToMaterialsPage}
                    >
                      <div className="flex items-center">
                        <span>
                          <Text
                            variant="gradient"
                            weight={600}
                            gradient={{ from: 'gold', to: 'white', deg: 50 }}
                          >
                            Upload materials
                          </Text>
                        </span>
                        &nbsp;&nbsp;
                        <IconCloudUpload size={18} />
                      </div>
                    </button>
                    &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;
                    {/* Disclaimer: it's not perfect (a tag to open in new tab) */}
                    <a
                      className="ml-2 cursor-pointer hover:opacity-50"
                      href="/disclaimer"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {/* Disclaimer */}
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
                    className="h-[162px] bg-gradient-to-b from-[#1a1a2e] via-[#2A2A40] to-[#15162c]"
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
