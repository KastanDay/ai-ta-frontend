// chatinput.tsx
import {
  IconArrowDown,
  IconBolt,
  IconBrandGoogle,
  IconPlayerStop,
  IconRepeat,
  IconSend,
  IconPhoto,
  IconAlertCircle,
  IconX
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
import { useMantineTheme, Modal, Tooltip } from '@mantine/core';
import { Montserrat } from 'next/font/google'

import { v4 as uuidv4 } from 'uuid';

import React from 'react'
import { CSSProperties } from 'react';


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

  const [content, setContent] = useState<string>(() => inputContent);
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const chatInputContainerRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);


  const removeButtonStyle: CSSProperties = {
    position: 'absolute',
    top: '-8px',
    right: '-8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: '#A9A9A9', // Changed to a darker gray
    color: 'white', // White icon color
    border: '2px solid white', // White border
    cursor: 'pointer',
    zIndex: 2,
  };

  const removeButtonHoverStyle: CSSProperties = {
    backgroundColor: '#505050', // Even darker gray for hover state
  };

  // Dynamically set the padding based on image previews presence
  const chatInputContainerStyle: CSSProperties = {
    paddingTop: imagePreviews.length > 0 ? '10px' : '0',
    paddingRight: imagePreviews.length > 0 ? '10px' : '0',
    paddingBottom: '0',
    paddingLeft: '0',
    borderRadius: '4px', // This will round the edges slightly
  };

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

  const handleSend = async () => {
    if (messageIsStreaming) {
      return;
    }

    let finalContent = content;

    if (imageFile && !uploadingImage) {
      setUploadingImage(true);
      try {
        // Call your upload function here
        const uploadedImageUrl = await uploadToS3(imageFile); // This should return the URL of the uploaded image
        finalContent += `\n![image](${uploadedImageUrl})`; // Append the image URL to the message content
        setImageFile(null); // Clear the file after uploading
        setImagePreviewUrl(null);
      } catch (error) {
        console.error('Error uploading file:', error);
        setImageError('Error uploading file');
        showToastOnInvalidImage();
      } finally {
        setUploadingImage(false);
      }
    }

    if (!finalContent) {
      alert(t('Please enter a message'));
      return;
    }

    onSend({ role: 'user', content: finalContent }, plugin);
    setContent('');
    setPlugin(null);
    setImagePreviews([]); // This will clear the image previews

    if (window.innerWidth < 640 && textareaRef && textareaRef.current) {
      textareaRef.current.blur();
    }
  };

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

  const handlePromptSelect = useCallback((prompt: Prompt) => {
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
  }, [parseVariables, setContent, updatePromptListVisibility]); 


  const handleSubmit = useCallback((updatedVariables: string[]) => {
    const newContent = content?.replace(/{{(.*?)}}/g, (match, variable) => {
      const index = variables.indexOf(variable)
      return updatedVariables[index] || ''
    })

    setContent(newContent)

    if (textareaRef && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [variables, setContent, textareaRef]); // Add dependencies used in the function

  const validImageTypes = ['.jpg', '.jpeg', '.png'];

  const isImageValid = (fileName: string): boolean => {
      const ext = fileName.slice(((fileName.lastIndexOf(".") - 1) >>> 0) + 2);
      return validImageTypes.includes(`.${ext}`);
  }

  const uploadToS3 = async (file: File | null) => {
    if (!file) {
      console.error('No file provided for upload');
      return;
    }
    
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

  const showToastOnInvalidImage = useCallback(() => {
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
  }, []);

  // Update the handleImageUpload to take a File as the parameter
  const handleImageUpload = useCallback((file: File) => {
    if (isImageValid(file.name)) {
      setImageError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        // Ensure reader.result is a string before adding it to the array
        const result = reader.result;
        if (typeof result === 'string') {
          setImagePreviews(prev => [...prev, result]);
        }
      };
      reader.readAsDataURL(file);
      setImageFile(file);
    } else {
      setImageError('Unsupported file type. Please upload .jpg or .png images.');
      showToastOnInvalidImage();
    }
  }, [
    setImageError, 
    setImagePreviews, 
    setImageFile, 
    showToastOnInvalidImage // showToastOnInvalidImage is now defined before handleImageUpload
  ]);

  // Function to open the modal with the selected image
  const openModal = (imageSrc: string) => {
    setSelectedImage(imageSrc);
    setIsModalOpen(true);
  };

  const theme = useMantineTheme();

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
  }, [handleImageUpload]);  

  useEffect(() => {
    if (imageError) {
      showToastOnInvalidImage();
      setImageError(null);
    }
  }, [imageError, showToastOnInvalidImage]);
  

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

  useEffect(() => {
    // This will focus the div as soon as the component mounts
    if (chatInputContainerRef.current) {
      chatInputContainerRef.current.focus();
    }
  }, []);  

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
            className="absolute left-2 bottom-1.5 rounded-sm p-1 text-neutral-800 opacity-60 hover:bg-neutral-200 hover:text-neutral-900 dark:bg-opacity-50 dark:text-neutral-100 dark:hover:text-neutral-200"
            onClick={() => setShowPluginSelect(!showPluginSelect)}
            onKeyDown={(e) => {
              console.log(e)
            }}
          >
            {plugin ? <IconBrandGoogle size={20} /> : <IconBolt size={20} />}
        </button>

          {/* Image Icon and Input */}
          <button 
              className="absolute left-8 bottom-1.5 rounded-sm p-1 text-neutral-800 opacity-60 hover:bg-neutral-200 hover:text-neutral-900 dark:bg-opacity-50 dark:text-neutral-100 dark:hover:text-neutral-200"
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
              const file = e.target.files?.[0];
              if (file) {
                handleImageUpload(file);
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
           {/* Chat input and preview container */}
           <div 
              ref={chatInputContainerRef} 
              className="chat-input-container m-0 w-full resize-none bg-[#070712] p-0 text-black dark:bg-[#070712] dark:text-white"
              tabIndex={0}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onClick={() => textareaRef.current?.focus()} // Add this line
              style={{ 
                outline: isFocused ? '2px solid #9acafa' : 'none', // Adjust the outline as needed
                ...chatInputContainerStyle // Apply the dynamic padding here
              }}
            >
            {/* Image preview section */}
            <div className="flex space-x-3" style={{ display: imagePreviews.length > 0 ? 'flex' : 'none' }}>
              {imagePreviews.map((src, index) => (
                <div key={index} className="relative w-12 h-12">
                  <img
                    src={src}
                    alt={`Preview ${index}`}
                    className="object-cover w-full h-full rounded-lg"
                    onClick={() => openModal(src)}
                    style={{ cursor: 'pointer' }}
                  />
                  <Tooltip
                    label="Remove File"
                    position="top"
                    withArrow
                    style={{
                      backgroundColor: '#505050', // Very dark gray background for the tooltip
                      color: 'white', // White text color for the tooltip content
                    }}
                  >
                    <button
                      className="remove-button"
                      onClick={() => setImagePreviews(prev => prev.filter((_, i) => i !== index))}
                      style={removeButtonStyle}
                      onMouseEnter={e => {
                        const current = e.currentTarget;
                        current.style.backgroundColor = removeButtonHoverStyle.backgroundColor!;
                        current.style.color = removeButtonHoverStyle.color!;
                      }}
                      onMouseLeave={e => {
                        const current = e.currentTarget;
                        current.style.backgroundColor = removeButtonStyle.backgroundColor!;
                        current.style.color = removeButtonStyle.color!;
                      }}
                    >
                      <IconX size={16} />
                    </button>
                  </Tooltip>
                </div>
              ))}
            </div>

            {/* Modal for full image preview */}
            <Modal
              opened={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              title="Image Preview"
            >
              <img src={selectedImage || undefined} alt="Selected Preview" />
            </Modal>
            <textarea
              ref={textareaRef}
              className="flex-grow m-0 w-full resize-none bg-[#070712] p-0 py-2 pl-16 pr-8 text-black dark:bg-[#070712] dark:text-white md:py-2 md:pl-16"
              placeholder={t('Type a message or type "/" to select a prompt...') || ''}
              value={content}
              rows={1}
              onCompositionStart={() => setIsTyping(true)}
              onCompositionEnd={() => setIsTyping(false)}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              style={{
                resize: 'none',
                maxHeight: '400px',
                overflow: 'hidden',
                outline: 'none', // Add this line to remove the outline from the textarea
                paddingTop: '14px'
              }}
            />



            <button
                className="absolute right-2 bottom-1.5 rounded-sm p-1 text-neutral-800 opacity-60 hover:bg-neutral-200 hover:text-neutral-900 dark:bg-opacity-50 dark:text-neutral-100 dark:hover:text-neutral-200"
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
        </div>
      </div>
    </div>
  )
}
