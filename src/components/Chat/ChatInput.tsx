// chatinput.tsx
import {
  IconArrowDown,
  IconBolt,
  IconBrandGoogle,
  IconPlayerStop,
  IconRepeat,
  IconSend,
  IconPhoto,
  IconAlertCircle
} from '@tabler/icons-react'
import {
  KeyboardEvent,
  MutableRefObject,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'

import { useTranslation } from 'next-i18next'

import { Message } from '@/types/chat'
import { Plugin } from '@/types/plugin'
import { Prompt } from '@/types/prompt'

import HomeContext from '~/pages/api/home/home.context'

import { PluginSelect } from './PluginSelect'
import { PromptList } from './PromptList'
import { VariableModal } from './VariableModal'

import { notifications } from '@mantine/notifications';
import { MantineTheme, Text, useMantineTheme } from '@mantine/core';
import { Montserrat } from 'next/font/google'

import { useRouter } from 'next/router';
import { v4 as uuidv4 } from 'uuid';

import React from 'react'
// ... other imports ...


const montserrat_med = Montserrat({
  weight: '500',
  subsets: ['latin'],
})


interface Props {
  onSend: (message: Message, plugin: Plugin | null) => void
  onRegenerate: () => void
  onScrollDownClick: () => void
  stopConversationRef: MutableRefObject<boolean>
  textareaRef: MutableRefObject<HTMLTextAreaElement | null>
  showScrollDownButton: boolean
  inputContent: string
  setInputContent: (content: string) => void
  courseName: string
}

export const ChatInput = ({
  onSend,
  onRegenerate,
  onScrollDownClick,
  stopConversationRef,
  textareaRef,
  showScrollDownButton,
  inputContent,
  setInputContent,
  courseName,
}: Props) => {
  const { t } = useTranslation('chat')

  const {
    state: { selectedConversation, messageIsStreaming, prompts },

    dispatch: homeDispatch,
  } = useContext(HomeContext)

  const [content, setContent] = useState<string>()
  const [isTyping, setIsTyping] = useState<boolean>(false)
  const [showPromptList, setShowPromptList] = useState(false)
  const [activePromptIndex, setActivePromptIndex] = useState(0)
  const [promptInputValue, setPromptInputValue] = useState('')
  const [variables, setVariables] = useState<string[]>([])
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [showPluginSelect, setShowPluginSelect] = useState(false)
  const [plugin, setPlugin] = useState<Plugin | null>(null)
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const imageUploadRef = useRef<HTMLInputElement | null>(null);
  const promptListRef = useRef<HTMLUListElement | null>(null)

  const filteredPrompts = prompts.filter((prompt) =>
    prompt.name.toLowerCase().includes(promptInputValue.toLowerCase()),
  )

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    const maxLength = selectedConversation?.model.maxLength

    if (maxLength && value.length > maxLength) {
      alert(
        t(
          `Message limit is {{maxLength}} characters. You have entered {{valueLength}} characters.`,
          { maxLength, valueLength: value.length },
        ),
      )
      return
    }

    setContent(value)
    updatePromptListVisibility(value)
  }

  const handleSend = () => {
    if (messageIsStreaming) {
      return
    }

    if (!content) {
      alert(t('Please enter a message'))
      return
    }

    onSend({ role: 'user', content }, plugin)
    setContent('')
    setPlugin(null)

    if (window.innerWidth < 640 && textareaRef && textareaRef.current) {
      textareaRef.current.blur()
    }
  }

  const handleStopConversation = () => {
    stopConversationRef.current = true
    setTimeout(() => {
      stopConversationRef.current = false
    }, 1000)
  }

  const isMobile = () => {
    const userAgent =
      typeof window.navigator === 'undefined' ? '' : navigator.userAgent
    const mobileRegex =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i
    return mobileRegex.test(userAgent)
  }

  const handleInitModal = () => {
    const selectedPrompt = filteredPrompts[activePromptIndex]
    if (selectedPrompt) {
      setContent((prevContent) => {
        const newContent = prevContent?.replace(
          /\/\w*$/,
          selectedPrompt.content,
        )
        return newContent
      })
      handlePromptSelect(selectedPrompt)
    }
    setShowPromptList(false)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (showPromptList) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActivePromptIndex((prevIndex) =>
          prevIndex < prompts.length - 1 ? prevIndex + 1 : prevIndex,
        )
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActivePromptIndex((prevIndex) =>
          prevIndex > 0 ? prevIndex - 1 : prevIndex,
        )
      } else if (e.key === 'Tab') {
        e.preventDefault()
        setActivePromptIndex((prevIndex) =>
          prevIndex < prompts.length - 1 ? prevIndex + 1 : 0,
        )
      } else if (e.key === 'Enter') {
        e.preventDefault()
        handleInitModal()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        setShowPromptList(false)
      } else {
        setActivePromptIndex(0)
      }
    } else if (e.key === 'Enter' && !isTyping && !isMobile() && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    } else if (e.key === '/' && e.metaKey) {
      e.preventDefault()
      setShowPluginSelect(!showPluginSelect)
    }
  }

  const parseVariables = (content: string) => {
    const regex = /{{(.*?)}}/g
    const foundVariables = []
    let match

    while ((match = regex.exec(content)) !== null) {
      foundVariables.push(match[1])
    }

    return foundVariables
  }

  const updatePromptListVisibility = useCallback((text: string) => {
    const match = text.match(/\/\w*$/)

    if (match) {
      setShowPromptList(true)
      setPromptInputValue(match[0].slice(1))
    } else {
      setShowPromptList(false)
      setPromptInputValue('')
    }
  }, [])

  const handlePromptSelect = (prompt: Prompt) => {
    const parsedVariables = parseVariables(prompt.content)
    const filteredVariables = parsedVariables.filter(
      (variable) => variable !== undefined,
    ) as string[]
    setVariables(filteredVariables)

    if (filteredVariables.length > 0) {
      setIsModalVisible(true)
    } else {
      setContent((prevContent) => {
        const updatedContent = prevContent?.replace(/\/\w*$/, prompt.content)
        return updatedContent
      })
      updatePromptListVisibility(prompt.content)
    }
  }

  // const handlePromptSelect = (prompt: Prompt) => {
  //   const parsedVariables = parseVariables(prompt.content);
  //   setVariables(parsedVariables);

  //   if (parsedVariables.length > 0) {
  //     setIsModalVisible(true);
  //   } else {
  //     setContent((prevContent) => {
  //       const updatedContent = prevContent?.replace(/\/\w*$/, prompt.content);
  //       return updatedContent;
  //     });
  //     updatePromptListVisibility(prompt.content);
  //   }
  // };

  const handleSubmit = (updatedVariables: string[]) => {
    const newContent = content?.replace(/{{(.*?)}}/g, (match, variable) => {
      const index = variables.indexOf(variable)
      return updatedVariables[index] || ''
    })

    setContent(newContent)

    if (textareaRef && textareaRef.current) {
      textareaRef.current.focus()
    }
  }

  const validImageTypes = ['.jpg', '.jpeg', '.png'];

  const isImageValid = (fileName: string): boolean => {
      const ext = fileName.slice(((fileName.lastIndexOf(".") - 1) >>> 0) + 2);
      return validImageTypes.includes(`.${ext}`);
  }

  const uploadToS3 = async (file: File | null) => {
    if (!file) return;

    const fileExtension = file.name.slice(((file.name.lastIndexOf(".") - 1) >>> 0) + 2);
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;

    const requestObject = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: uniqueFileName,
        fileType: file.type,
        courseName: courseName,
      }),
    };

    try {
      interface PresignedPostResponse {
        post: {
          url: string
          fields: { [key: string]: string }
        }
      }

      // Then, update the lines where you fetch the response and parse the JSON
      const response = await fetch('/api/UIUC-api/uploadToS3', requestObject)
      const data = (await response.json()) as PresignedPostResponse

      const { url, fields } = data.post as {
        url: string
        fields: { [key: string]: string }
      }
      const formData = new FormData()

      Object.entries(fields).forEach(([key, value]) => {
        formData.append(key, value)
      })

      formData.append('file', file)

      await fetch(url, {
        method: 'POST',
        body: formData,
      })

      console.log((file.name as string) + 'uploaded to S3 successfully!!')
    } catch (error) {
      console.error('Error uploading file:', error)
    }
  }

  const ingestFile = async (file: File | null) => {
    if (!file) return;

    const fileExtension = file.name.slice(((file.name.lastIndexOf(".") - 1) >>> 0) + 2);
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;

    const queryParams = new URLSearchParams({
      courseName: courseName,
      fileName: uniqueFileName,
    }).toString();

    const requestObject = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      query: {
        fileName: file.name,
        courseName: courseName,
      },
    }

    // Actually we CAN await here, just don't await this function.
    console.log('right before call /ingest...')
    const response = await fetch(
      `/api/UIUC-api/ingest?${queryParams}`,
      requestObject,
    )

    // check if the response was ok
    if (response.ok) {
      const data = await response.json()
      // console.log(file.name as string + ' ingested successfully!!')
      console.log('Success or Failure:', data)
      return data
    } else {
      console.log('Error during ingest:', response.statusText)
      console.log('Full Response message:', response)
      return response
    }
  }

  const handleImageUpload = async (file: File) => {
    if (!isImageValid(file.name)) {
        setImageError(null);
        setImageError('Unsupported file type. Please upload .jpg or .png images.');
        showToastOnInvalidImage();
        if (imageUploadRef.current) {
            imageUploadRef.current.value = '';
        }
        return;
    }

    try {
        // Upload to S3
        await uploadToS3(file);
        console.log(file.name + ' uploaded to S3 successfully!!');

        // Ingest file (if needed)
        await ingestFile(file);
        console.log(file.name + ' ingested successfully!!');
    } catch (error) {
        console.error('Error during file processing:', error);
    }
}

  const theme = useMantineTheme();

  const showToastOnInvalidImage = () => {
    notifications.show({
        id: 'error-notification',
        withCloseButton: true,
        onClose: () => console.log('error unmounted'),
        onOpen: () => console.log('error mounted'),
        autoClose: 4000,
        title: 'Invalid Image Type',
        message: 'Unsupported file type. Please upload .jpg or .png images.',
        color: 'red',
        radius: 'lg',
        icon: <IconAlertCircle />,
        className: 'my-notification-class',
        style: { backgroundColor: '#15162c' },
        withBorder: true,
        loading: false,
    });
  }



  useEffect(() => {
    const handleDocumentDragOver = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
    };
  
    const handleDocumentDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer && e.dataTransfer.items && e.dataTransfer.items.length > 0) {
        const file = e.dataTransfer.items[0]?.getAsFile();
        if (file) {
          handleImageUpload(file);
        }
      }
    };
  
    const handleDocumentDragLeave = (e: DragEvent) => {
      setIsDragging(false);
    };
  
    document.addEventListener('dragover', handleDocumentDragOver);
    document.addEventListener('drop', handleDocumentDrop);
    document.addEventListener('dragleave', handleDocumentDragLeave);
  
    return () => {
      // Clean up the event listeners when the component is unmounted
      document.removeEventListener('dragover', handleDocumentDragOver);
      document.removeEventListener('drop', handleDocumentDrop);
      document.removeEventListener('dragleave', handleDocumentDragLeave);
    };
  }, []);  

  useEffect(() => {
    if (imageError) {
      showToastOnInvalidImage();
      setImageError(null);
    }
  }, [imageError]);

  useEffect(() => {
    setContent(inputContent)
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [inputContent, textareaRef])

  useEffect(() => {
    if (promptListRef.current) {
      promptListRef.current.scrollTop = activePromptIndex * 30
    }
  }, [activePromptIndex])

  useEffect(() => {
    if (textareaRef && textareaRef.current) {
      textareaRef.current.style.height = 'inherit'
      textareaRef.current.style.height = `${textareaRef.current?.scrollHeight}px`
      textareaRef.current.style.overflow = `${
        textareaRef?.current?.scrollHeight > 400 ? 'auto' : 'hidden'
      }`
    }
  }, [content])

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        promptListRef.current &&
        !promptListRef.current.contains(e.target as Node)
      ) {
        setShowPromptList(false)
      }
    }

    window.addEventListener('click', handleOutsideClick)

    return () => {
      window.removeEventListener('click', handleOutsideClick)
    }
  }, [])

  return (
    <div className={`absolute bottom-0 left-0 w-full border-transparent bg-transparent pt-6 dark:border-white/20 md:pt-2 ${isDragging ? 'border-4 border-dashed border-blue-400' : ''}`}>
      {isDragging && (
          <div
            className="absolute inset-0 w-full h-full flex justify-center items-center bg-black opacity-75 z-10"  // Added z-10 to ensure it's on top, changed background to a semi-transparent black
          >
            <span className="text-2xl font-extrabold text-white">Drop your image here!</span>
          </div>
      )}
      <div className="stretch mx-2 mt-4 flex flex-row gap-3 last:mb-2 md:mx-4 md:mt-[52px] md:last:mb-6 lg:mx-auto lg:max-w-3xl">
        {messageIsStreaming && (
          <button
            className="absolute left-0 right-0 top-0 mx-auto mb-3 flex w-fit items-center gap-3 rounded border border-neutral-200 bg-white px-4 py-2 text-black hover:opacity-50 dark:border-neutral-600 dark:bg-[#15162c] dark:text-white md:mb-0 md:mt-2"
            onClick={handleStopConversation}
          >
            <IconPlayerStop size={16} /> {t('Stop Generating')}
          </button>
        )}

        {!messageIsStreaming &&
          selectedConversation &&
          selectedConversation.messages.length > 0 && (
            <button
              className="absolute left-0 right-0 top-0 mx-auto mb-3 flex w-fit items-center gap-3 rounded border border-neutral-200 bg-white px-4 py-2 text-black hover:opacity-50 dark:border-neutral-600 dark:bg-[#343541] dark:text-white md:mb-0 md:mt-2"
              onClick={onRegenerate}
            >
              <IconRepeat size={16} /> {t('Regenerate response')}
            </button>
          )}

        <div className="relative mx-2 flex w-full flex-grow flex-col rounded-md border border-black/10 bg-white shadow-[0_0_10px_rgba(0,0,0,0.10)] dark:border-gray-900/50 dark:bg-[#15162c] dark:text-white dark:shadow-[0_0_15px_rgba(0,0,0,0.10)] sm:mx-4">
        <button
            className="absolute left-2 top-2 rounded-sm p-1 text-neutral-800 opacity-60 hover:bg-neutral-200 hover:text-neutral-900 dark:bg-opacity-50 dark:text-neutral-100 dark:hover:text-neutral-200"
            onClick={() => setShowPluginSelect(!showPluginSelect)}
            onKeyDown={(e) => {
              console.log(e)
            }}
          >
            {plugin ? <IconBrandGoogle size={20} /> : <IconBolt size={20} />}
        </button>

          {/* Image Icon and Input */}
          <button 
              className="absolute left-8 top-2 rounded-sm p-1 text-neutral-800 opacity-60 hover:bg-neutral-200 hover:text-neutral-900 dark:bg-opacity-50 dark:text-neutral-100 dark:hover:text-neutral-200"
              onClick={() => document.getElementById('imageUpload')?.click()}
          >
              <IconPhoto size={20} />
          </button>
          <input
              type="file"
              id="imageUpload"
              ref={imageUploadRef}
              style={{ display: 'none' }}
              onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                      handleImageUpload(e.target.files[0] as File);
                  }
              }}
          />
          {showPluginSelect && (
            <div className="absolute bottom-14 left-0 rounded bg-white dark:bg-[#15162c]">
              <PluginSelect
                plugin={plugin}
                onKeyDown={(e: any) => {
                  if (e.key === 'Escape') {
                    e.preventDefault()
                    setShowPluginSelect(false)
                    textareaRef.current?.focus()
                  }
                }}
                onPluginChange={(plugin: Plugin) => {
                  setPlugin(plugin)
                  setShowPluginSelect(false)

                  if (textareaRef && textareaRef.current) {
                    textareaRef.current.focus()
                  }
                }}
              />
            </div>
          )}

          <textarea
            ref={textareaRef}
            className="m-0 w-full resize-none bg-[#070712] p-0 py-2 pl-16 pr-8 text-black dark:bg-[#070712] dark:text-white md:py-3 md:pl-16"
            style={{
              resize: 'none',
              bottom: `${textareaRef?.current?.scrollHeight}px`,
              maxHeight: '400px',
              overflow: `${
                textareaRef.current && textareaRef.current.scrollHeight > 400
                  ? 'auto'
                  : 'hidden'
              }`,
            }}
            placeholder={
              t('Type a message or type "/" to select a prompt...') || ''
            }
            value={content}
            rows={1}
            onCompositionStart={() => setIsTyping(true)}
            onCompositionEnd={() => setIsTyping(false)}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
          />

          <button
              className="absolute right-2 top-2 rounded-sm p-1 text-neutral-800 opacity-60 hover:bg-neutral-200 hover:text-neutral-900 dark:bg-opacity-50 dark:text-neutral-100 dark:hover:text-neutral-200"
              onClick={handleSend}
            >
              {messageIsStreaming ? (
                <div className="h-4 w-4 animate-spin rounded-full border-t-2 border-neutral-800 opacity-60 dark:border-neutral-100"></div>
              ) : (
                <IconSend size={18} />
              )}
          </button>


          {showScrollDownButton && (
            <div className="absolute bottom-12 right-0 lg:-right-10 lg:bottom-0">
              <button
                className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-300 text-gray-800 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-neutral-200"
                onClick={onScrollDownClick}
              >
                <IconArrowDown size={18} />
              </button>
            </div>
          )}

          {showPromptList && filteredPrompts.length > 0 && (
            <div className="absolute bottom-12 w-full">
              <PromptList
                activePromptIndex={activePromptIndex}
                prompts={filteredPrompts}
                onSelect={handleInitModal}
                onMouseOver={setActivePromptIndex}
                promptListRef={promptListRef}
              />
            </div>
          )}

          {isModalVisible && filteredPrompts[activePromptIndex] && (
            <VariableModal
              prompt={filteredPrompts[activePromptIndex]}
              variables={variables}
              onSubmit={handleSubmit}
              onClose={() => setIsModalVisible(false)}
            />
          )}
        </div>
        {/* Small title below the main chat input bar */}
        {/* <div className="px-3 pb-3 pt-2 text-center text-[12px] text-black/50 dark:text-white/50 md:px-4 md:pb-6 md:pt-3">
          {t('Advanced version of ChatGPT, built for UIUC. Forked from ')}
          <a
            href="https://github.com/mckaywrigley/chatbot-ui"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            ChatBot UI
          </a>
          .{' '}
        </div> */}
      </div>
    </div>
  )
}
