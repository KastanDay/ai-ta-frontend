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
  IconAlertCircle,
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
import { Button, Text } from '@mantine/core'
import { useTranslation } from 'next-i18next'

import { getEndpoint } from '@/utils/app/api'
import {
  saveConversation,
  saveConversations,
} from '@/utils/app/conversation'
import { throttle } from '@/utils/data/throttle'

import {
  type ContextWithMetadata,
  type ChatBody,
  type Conversation,
  type Message,
  Content,
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
}

import { useRouter } from 'next/router'
// import CustomBanner from '../UIUC-Components/CustomBanner'
import { fetchContexts } from '~/pages/api/getContexts'
import { fetchMQRContexts } from '~/pages/api/getContextsMQR'

import { useUser } from '@clerk/nextjs'
import { extractEmailsFromClerk } from '../UIUC-Components/clerkHelpers'
import { type OpenAIModelID, OpenAIModels } from '~/types/openai'
import ChatNavbar from '../UIUC-Components/navbars/ChatNavbar'
// import { MainPageBackground } from '../UIUC-Components/MainPageBackground'
import { notifications } from '@mantine/notifications'
import { Montserrat } from 'next/font/google'
import { montserrat_heading, montserrat_paragraph } from 'fonts'

const montserrat_med = Montserrat({
  weight: '500',
  subsets: ['latin'],
})
export const Chat = memo(({ stopConversationRef, courseMetadata }: Props) => {
  const { t } = useTranslation('chat')
  const clerk_obj = useUser()
  const router = useRouter()
  const [bannerUrl, setBannerUrl] = useState<string | null>(null)
  const getCurrentPageName = () => {
    // /CS-125/materials --> CS-125
    return router.asPath.slice(1).split('/')[0] as string
  }

  const [inputContent, setInputContent] = useState<string>('')
  const [cacheMetrics, setCacheMetrics] = useState({ hits: 0, misses: 0 });

  useEffect(() => {
    if (courseMetadata?.banner_image_s3 && courseMetadata.banner_image_s3 !== '') {
      fetchPresignedUrl(courseMetadata.banner_image_s3).then((url) => {
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
      isImg2TextLoading
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

    try {
      // Log conversation to our Flask Backend (especially Nomic)
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
      console.error('Error in chat.tsx running onResponseCompletion():', error)
      return false
    }
  }

  const handleImageContent = async (message: Message, endpoint: string, updatedConversation: Conversation, searchQuery: string, controller: AbortController) => {
    const imageContent = (message.content as Content[]).filter(content => content.type === 'image_url');
    if (imageContent.length > 0) {
      homeDispatch({ field: 'isImg2TextLoading', value: true })
      const chatBody: ChatBody = {
        model: updatedConversation.model,
        messages: [
          {
            ...message,
            content: [
              ...imageContent,
              { type: 'text', text: `"Provide a detailed description of the image(s), focusing exclusively on the elements and details that are visibly present. Include descriptions of text (OCR information), distinct objects, spatial relationships, colors, actions, annotations, labels, or significant color usage. Use specific, technical, or domain-specific terminology to accurately describe elements, particularly for specialized fields like medicine, agriculture, technology, etc. Classify the image into relevant categories and list key terms associated with that category. Identify and list potential keywords or key phrases that summarize the main elements and themes. If the image contains abstract or emotional content, infer the overall message or content. Emphasize the most prominent features first, moving to less significant details. Also, provide synonyms or related terms for technical aspects. DO NOT reference or mention any features, elements, or aspects that are absent in the image. The GOAL is to create a precise, focused, and keyword-rich description that encapsulates only the observable details, suitable for semantic document retrieval across various domains."` }
            ]
          }
        ],
        key: courseMetadata?.openai_api_key && courseMetadata?.openai_api_key != '' ? courseMetadata.openai_api_key : apiKey,
        prompt: updatedConversation.prompt,
        temperature: updatedConversation.temperature,
        course_name: getCurrentPageName(),
        stream: false,
      };

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(chatBody),
          signal: controller.signal,
        });

        if (!response.ok) {
          const final_response = await response.json();
          homeDispatch({ field: 'loading', value: false });
          homeDispatch({ field: 'messageIsStreaming', value: false });
          throw new Error(final_response.message);
        }

        const data = await response.json();
        const imgDesc = data.choices[0].message.content || '';

        searchQuery += ` Image description: ${imgDesc}`;

        const imgDescIndex = (message.content as Content[]).findIndex(content => content.type === 'text' && (content.text as string).startsWith('Image description: '));

        if (imgDescIndex !== -1) {
          (message.content as Content[])[imgDescIndex] = { type: 'text', text: `Image description: ${imgDesc}` };
        } else {
          (message.content as Content[]).push({ type: 'text', text: `Image description: ${imgDesc}` });
        }
      } catch (error) {
        console.error('Error in chat.tsx running handleImageContent():', error);
        controller.abort();
      } finally {
        homeDispatch({ field: 'isImg2TextLoading', value: false })
      };
    }
    return searchQuery;
  }

  const handleContextSearch = async (message: Message, selectedConversation: Conversation, searchQuery: string) => {
    if (getCurrentPageName() != 'gpt4') {
      // Extract text from all user messages in the conversation
      const token_limit = OpenAIModels[selectedConversation?.model.id as OpenAIModelID].tokenLimit
      const useMQRetrieval = localStorage.getItem('UseMQRetrieval') === 'true';
      const fetchContextsFunc = useMQRetrieval ? fetchMQRContexts : fetchContexts;
      await fetchContextsFunc(getCurrentPageName(), searchQuery, token_limit).then((curr_contexts) => {
        message.contexts = curr_contexts as ContextWithMetadata[]
        console.log('message.contexts: ', message.contexts)
      })
    }
  }

  const generateCitationLink = async (context: ContextWithMetadata) => {
    // Uncomment for debugging
    // console.log('context: ', context);
    if (context.url) {
      return context.url;
    } else if (context.s3_path) {
      return fetchPresignedUrl(context.s3_path);
    }
    return '';
  }

  const getCitationLink = async (context: ContextWithMetadata, citationLinkCache: Map<number, string>, citationIndex: number) => {
    // console.log("Generating citation link for context: ", citationIndex, context.readable_filename)
    const cachedLink = citationLinkCache.get(citationIndex);
    if (cachedLink) {
      setCacheMetrics((prevMetrics) => {
        const newMetrics = { ...prevMetrics, hits: prevMetrics.hits + 1 };
        // Uncomment for debugging
        // console.log(`Cache hit for citation index ${citationIndex}. Current cache hit ratio: ${(newMetrics.hits / (newMetrics.hits + newMetrics.misses)).toFixed(2)}`);
        return newMetrics;
      });
      return cachedLink;
    } else {
      setCacheMetrics((prevMetrics) => {
        const newMetrics = { ...prevMetrics, misses: prevMetrics.misses + 1 };
        // Uncomment for debugging
        // console.log(`Cache miss for citation index ${citationIndex}. Current cache hit ratio: ${(newMetrics.hits / (newMetrics.hits + newMetrics.misses)).toFixed(2)}`);
        return newMetrics;
      });
      const link = await generateCitationLink(context);
      citationLinkCache.set(citationIndex, link);
      return link;
    }
  }

  const resetCacheMetrics = () => {
    // console.log(`Final cache hit ratio for the message: ${(cacheMetrics.hits / (cacheMetrics.hits + cacheMetrics.misses)).toFixed(2)}`);
    console.log(`Final Cache metrics: ${JSON.stringify(cacheMetrics)}`);
    setCacheMetrics({ hits: 0, misses: 0 });
  }

  function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
  }

  // THIS IS WHERE MESSAGES ARE SENT.
  const updateConversation = (conv, msg, dc) => {
  // method logic remains unchanged
  // just ensure to return the updatedConversation variable
};

const handleSend = useCallback(
    async (message: Message, deleteCount = 0, plugin: Plugin | null = null) => {

      setCurrentMessage(message)
      // New way with React Context API
      // TODO: MOVE THIS INTO ChatMessage
      // console.log('IN handleSend: ', message)
      // setSearchQuery(message.content)
      let searchQuery = Array.isArray(message.content)
        ? message.content.map((content) => content.text).join(' ')
        : message.content;

      // console.log("QUERY: ", searchQuery)

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

        const endpoint = getEndpoint(plugin);

        const controller = new AbortController()

        // Run image to text conversion, attach to Message object.
        if (Array.isArray(message.content)) {
          // Call the new handleImageContent function
searchQuery = await handleImageContent(message, endpoint, searchQuery, controller);
        }

        // Run context search, attach to Message object.
        // Call the new handleContextSearch function
await handleContextSearch(message, searchQuery);

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
          stream: true
        }

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

        // This is where we call the OpenAI API
        // Call the new makeApiCall function
const response = await makeApiCall(endpoint, body, controller.signal);

        if (!response.ok) {
          const final_response = await response.json()
          homeDispatch({ field: 'loading', value: false })
          homeDispatch({ field: 'messageIsStreaming', value: false })
          notifications.show({
            id: 'error-notification',
            withCloseButton: true,
            closeButtonProps: { color: 'red' },
            onClose: () => console.log('error unmounted'),
            onOpen: () => console.log('error mounted'),
            autoClose: 12000,
            title: (
              <Text size={'lg'} className={`${montserrat_med.className}`}>
                {final_response.name}
              </Text>
            ),
            message: (
              <Text className={`${montserrat_med.className} text-neutral-200`}>
                {final_response.message}
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
            const { content } = message;
            // Use only texts instead of content itself
            const contentText = Array.isArray(content)
              ? content.map((content) => content.text).join(' ')
              : content;
            const customName =
              contentText.length > 30 ? contentText.substring(0, 30) + '...' : contentText;
            updatedConversation = {
              ...updatedConversation,
              name: customName,
            };
          }
          homeDispatch({ field: 'loading', value: false })
          const reader = data.getReader()
          const decoder = new TextDecoder()
          let done = false
          let isFirst = true
          let text = ''
          const citationLinkCache = new Map<number, string>();
          try {
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

                const updatedMessagesPromises: Promise<Message>[] = updatedConversation.messages.map(async (message, index) => {
                  if (index === updatedConversation.messages.length - 1 && message.contexts) {
                    let content = text;

                    // Identify all unique citation indices in the content
                    const citationIndices = new Set<number>();
                    const citationPattern = /\[(\d+)\](?!\([^)]*\))/g;
                    let match;
                    while ((match = citationPattern.exec(content)) !== null) {
                      citationIndices.add(parseInt(match[1] as string));
                    }

                    // Generate citation links only for the referenced indices
                    for (const citationIndex of citationIndices) {
                      const context = message.contexts[citationIndex - 1]; // Adjust index for zero-based array
                      if (context) {
                        const link = await getCitationLink(context, citationLinkCache, citationIndex);
                        const pageNumberMatch = content.match(new RegExp(`\\[${escapeRegExp(context.readable_filename)}, page: (\\d+)\\]\\(#\\)`));
                        const pageNumber = pageNumberMatch ? `#page=${pageNumberMatch[1]}` : '';

                        // Replace citation index with link
                        content = content.replace(new RegExp(`\\[${citationIndex}\\](?!\\([^)]*\\))`, 'g'), `[${citationIndex}](${link}${pageNumber})`);

                        // Replace filename with link
                        content = content.replace(new RegExp(`(\\b${citationIndex}\\.)\\s*\\[(.*?)\\]\\(\\#\\)`, 'g'), (match, index, filename) => {
                          return `${index} [${index} ${filename}](${link}${pageNumber})`;
                        });
                      }
                    }
                // Uncomment for debugging
                    // console.log('content: ', content);
                    return { ...message, content };
                  }
                  return message;
                });

                // Use Promise.all to wait for all promises to resolve
                const updatedMessages = await Promise.all(updatedMessagesPromises);

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
          } catch (error) {
            console.error('Error reading from stream:', error);
            homeDispatch({ field: 'loading', value: false });
            homeDispatch({ field: 'messageIsStreaming', value: false });
            return;
          } finally {
            // Reset cache metrics after each message
            resetCacheMetrics();
          }

          if (!done) {
            throw new Error('Stream ended prematurely');
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
          console.log('updatedConversations: ', updatedConversations)
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

  const handleRegenerate = useCallback(() => {
    if (currentMessage && Array.isArray(currentMessage.content)) {
      // Find the index of the existing image description
      const imgDescIndex = (currentMessage.content as Content[]).findIndex(content => content.type === 'text' && (content.text as string).startsWith('Image description: '));

      if (imgDescIndex !== -1) {
        // Remove the existing image description
        (currentMessage.content as Content[]).splice(imgDescIndex, 1);
      }

      handleSend(currentMessage, 2, null);
    }
  }, [currentMessage, handleSend]);

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

  const statements =
    courseMetadata?.example_questions &&
      courseMetadata.example_questions.length > 0
      ? courseMetadata.example_questions
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
          <Text
            className={`mb-2 text-lg text-white ${montserrat_heading.variable} font-montserratHeading`}
            style={{ whiteSpace: 'pre-wrap' }}
          >
            {courseMetadata?.course_intro_message}
          </Text>

          <h4
            className={`text-md mb-2 text-white ${montserrat_paragraph.variable} font-montserratParagraph`}
          >
            Start a conversation below or try the following examples
          </h4>
          <div className="mt-4 flex flex-col items-start space-y-2 overflow-hidden">
            {statements.map((statement, index) => (
              <div
                key={index}
                className="w-full rounded-lg border-b-2 border-[rgba(42,42,64,0.4)] hover:cursor-pointer hover:bg-[rgba(42,42,64,0.9)]"
                onClick={() => setInputContent(statement)}
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
            if (content.type === 'image' && content.image_url) {
              return <img key={index} src={content.image_url.url} alt="Uploaded content" />;
            }
            return <span key={index}>{content.text}</span>;
          })}
        </>
      );
    }
    return <span>{message.content}</span>;
  };

  const updateMessages = (updatedMessage: Message, messageIndex: number) => {
    return selectedConversation?.messages.map((message, index) => {
      return index === messageIndex ? updatedMessage : message;
    });
  };

  const updateConversations = (updatedConversation: Conversation) => {
    return conversations.map((conversation) =>
      conversation.id === selectedConversation?.id ? updatedConversation : conversation
    );
  };

  const onImageUrlsUpdate = useCallback((updatedMessage: Message, messageIndex: number) => {
    if (!selectedConversation) {
      throw new Error("No selected conversation found");
    }

    const updatedMessages = updateMessages(updatedMessage, messageIndex);
    if (!updatedMessages) {
      throw new Error("Failed to update messages");
    }

    const updatedConversation = {
      ...selectedConversation,
      messages: updatedMessages,
    };

    homeDispatch({
      field: 'selectedConversation',
      value: updatedConversation,
    });

    const updatedConversations = updateConversations(updatedConversation);
    if (!updatedConversations) {
      throw new Error("Failed to update conversations");
    }

    homeDispatch({ field: 'conversations', value: updatedConversations });
    saveConversations(updatedConversations);
  }, [selectedConversation, conversations]);


  return (
    <div className="overflow-wrap relative flex h-screen w-full flex-col overflow-hidden bg-white dark:bg-[#15162c]">
      <div className="justify-center" style={{ height: '46px' }}>
        <ChatNavbar bannerUrl={bannerUrl as string} isgpt4={true} />
      </div>
      <div className="mt-10 flex-grow overflow-auto">
        {!(apiKey || serverSideApiKeyIsSet) ? (
          <div className="absolute inset-0 mt-20 flex flex-col items-center justify-center">
            <div className="backdrop-filter-[blur(10px)] rounded-box mx-auto max-w-4xl flex-col items-center border border-2 border-[rgba(255,165,0,0.8)] bg-[rgba(42,42,64,0.3)] p-10 text-2xl font-bold text-black dark:text-white">
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
                <div className="absolute bottom-4 left-0 ml-4 mt-4 animate-ping flex-col place-items-start text-left">
                  <IconArrowLeft
                    size={'36'}
                    className="mr-2 transform text-purple-500 transition-transform duration-500 ease-in-out hover:-translate-x-1"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : modelError ? (
          <ErrorMessageDiv error={modelError} />
        ) : (
          <>
            <div
              className="mt-4 max-h-full"
              ref={chatContainerRef}
              onScroll={handleScroll}
            >
              {selectedConversation?.messages.length === 0 ? (
                <>
                  <div className="mt-16">{renderIntroductoryStatements()}</div>
                </>
              ) : (
                <>
                  {selectedConversation?.messages.map((message, index) => (
                    <MemoizedChatMessage
                      key={index}
                      message={message}
                      contentRenderer={renderMessageContent}
                      messageIndex={index}
                      onEdit={(editedMessage) => {
                        // setCurrentMessage(editedMessage)
                        handleSend(
                          editedMessage,
                          selectedConversation?.messages.length - index,
                        )
                      }}
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
            </div>
            {/* <div className="w-full max-w-[calc(100% - var(--sidebar-width))] mx-auto flex justify-center"> */}
            <ChatInput
              stopConversationRef={stopConversationRef}
              textareaRef={textareaRef}
              onSend={(message, plugin) => {
                // setCurrentMessage(message)
                handleSend(message, 0, plugin)
              }}
              onScrollDownClick={handleScrollDown}
              onRegenerate={handleRegenerate}
              showScrollDownButton={showScrollDownButton}
              inputContent={inputContent}
              setInputContent={setInputContent}
              courseName={getCurrentPageName()}
            />
            {/* </div> */}
          </>
        )}
      </div>
    </div>
  )
  Chat.displayName = 'Chat'
})
