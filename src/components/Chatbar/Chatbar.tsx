import { useState } from 'react'

import { useCallback, useContext, useEffect } from 'react'

import { useTranslation } from 'next-i18next'

import { useCreateReducer } from '@/hooks/useCreateReducer'

import { DEFAULT_SYSTEM_PROMPT, DEFAULT_TEMPERATURE } from '@/utils/app/const'
// import { saveFoldersInLocalStorage } from '@/utils/app/folders'
import { exportData, importData } from '@/utils/app/importExport'

import { Conversation } from '@/types/chat'
import { LatestExportFormat, SupportedExportFormats } from '@/types/export'
import { OpenAIModels } from '~/utils/modelProviders/openai'

import HomeContext from '~/pages/api/home/home.context'

import { ChatFolders } from './components/ChatFolders'
import { ChatbarSettings } from './components/ChatbarSettings'
import { Conversations } from './components/Conversations'

import Sidebar from '../Sidebar'
import ChatbarContext from './Chatbar.context'
import { ChatbarInitialState, initialState } from './Chatbar.state'

import { v4 as uuidv4 } from 'uuid'
import router from 'next/router'

import { useQueryClient } from '@tanstack/react-query'
import { useUser } from '@clerk/nextjs'
import { extractEmailsFromClerk } from '../UIUC-Components/clerkHelpers'

export const Chatbar = () => {
  const { t } = useTranslation('sidebar')

  const chatBarContextValue = useCreateReducer<ChatbarInitialState>({
    initialState,
  })

  const [showCurrentCourseOnly, setShowCurrentCourseOnly] = useState(false)

  const {
    state: { conversations, showChatbar, defaultModelId, folders, pluginKeys },
    dispatch: homeDispatch,
    handleCreateFolder,
    handleNewConversation,
    handleUpdateConversation,
  } = useContext(HomeContext)

  const {
    state: { searchTerm, filteredConversations },
    dispatch: chatDispatch,
  } = chatBarContextValue

  const queryClient = useQueryClient()
  const user = useUser()
  const user_email = extractEmailsFromClerk(user.user)[0]

  const handleApiKeyChange = useCallback(
    (apiKey: string) => {
      homeDispatch({ field: 'apiKey', value: apiKey })

      localStorage.setItem('apiKey', apiKey)
    },
    [homeDispatch],
  )

  // const handlePluginKeyChange = (pluginKey: PluginKey) => {
  //   if (pluginKeys.some((key) => key.pluginId === pluginKey.pluginId)) {
  //     const updatedPluginKeys = pluginKeys.map((key) => {
  //       if (key.pluginId === pluginKey.pluginId) {
  //         return pluginKey
  //       }

  //       return key
  //     })

  //     homeDispatch({ field: 'pluginKeys', value: updatedPluginKeys })

  //     localStorage.setItem('pluginKeys', JSON.stringify(updatedPluginKeys))
  //   } else {
  //     homeDispatch({ field: 'pluginKeys', value: [...pluginKeys, pluginKey] })

  //     localStorage.setItem(
  //       'pluginKeys',
  //       JSON.stringify([...pluginKeys, pluginKey]),
  //     )
  //   }
  // }

  // const handleClearPluginKey = (pluginKey: PluginKey) => {
  //   const updatedPluginKeys = pluginKeys.filter(
  //     (key) => key.pluginId !== pluginKey.pluginId,
  //   )

  //   if (updatedPluginKeys.length === 0) {
  //     homeDispatch({ field: 'pluginKeys', value: [] })
  //     localStorage.removeItem('pluginKeys')
  //     return
  //   }

  //   homeDispatch({ field: 'pluginKeys', value: updatedPluginKeys })

  //   localStorage.setItem('pluginKeys', JSON.stringify(updatedPluginKeys))
  // }

  const handleExportData = () => {
    exportData()
  }

  const handleImportConversations = (data: SupportedExportFormats) => {
    const { history, folders, prompts }: LatestExportFormat = importData(data)
    homeDispatch({ field: 'conversations', value: history })
    homeDispatch({
      field: 'selectedConversation',
      value: history[history.length - 1],
    })
    homeDispatch({ field: 'folders', value: folders })
    homeDispatch({ field: 'prompts', value: prompts })

    window.location.reload()
  }

  // Todo: Implement handle*Conversations with sql database instead of local storage
  const handleClearConversations = () => {
    defaultModelId &&
      homeDispatch({
        field: 'selectedConversation',
        value: {
          id: uuidv4(),
          name: t('New Conversation'),
          messages: [],
          model: OpenAIModels[defaultModelId],
          prompt: DEFAULT_SYSTEM_PROMPT,
          temperature: DEFAULT_TEMPERATURE,
          folderId: null,
        },
      })

    homeDispatch({ field: 'conversations', value: [] })

    localStorage.removeItem('conversationHistory')
    localStorage.removeItem('selectedConversation')

    const updatedFolders = folders.filter((f) => f.type !== 'chat')

    homeDispatch({ field: 'folders', value: updatedFolders })
    // saveFoldersInLocalStorage(updatedFolders)
  }

  const handleDeleteConversation = (conversation: Conversation) => {
    const updatedConversations = conversations.filter(
      (c) => c.id !== conversation.id,
    )

    homeDispatch({ field: 'conversations', value: updatedConversations })
    chatDispatch({ field: 'searchTerm', value: '' })
    // saveConversations(updatedConversations)

    if (updatedConversations.length > 0) {
      const lastConversation =
        updatedConversations[updatedConversations.length - 1]
      if (lastConversation) {
        homeDispatch({
          field: 'selectedConversation',
          value: lastConversation,
        })

        // saveConversation(lastConversation)
        // saveConversationToServer(lastConversation).catch((error) => {
        //   console.error('Error saving updated conversation to server:', error)
        // })
        // Add delete conversation mutation here
      }
    } else {
      defaultModelId &&
        homeDispatch({
          field: 'selectedConversation',
          value: {
            id: uuidv4(),
            name: t('New Conversation'),
            messages: [],
            model: OpenAIModels[defaultModelId],
            prompt: DEFAULT_SYSTEM_PROMPT,
            temperature: DEFAULT_TEMPERATURE,
            folderId: null,
          },
        })

      localStorage.removeItem('selectedConversation')
    }
  }

  const handleToggleChatbar = () => {
    homeDispatch({ field: 'showChatbar', value: !showChatbar })
    localStorage.setItem('showChatbar', JSON.stringify(!showChatbar))
  }

  const handleDrop = (e: any) => {
    if (e.dataTransfer) {
      const conversation = JSON.parse(e.dataTransfer.getData('conversation'))
      handleUpdateConversation(conversation, { key: 'folderId', value: 0 })
      chatDispatch({ field: 'searchTerm', value: '' })
      e.target.style.background = 'none'
    }
  }

  // SEARCH CONVO HISTORY (by message title, content and course-name)
  // Also implements "Only show conversations from current course" toggle
  useEffect(() => {
    const currentCourseName = router.asPath.split('/')[1]

    const filterBySearchTermOrCourse = (conversation: Conversation) => {
      // console.log('Current course name:', currentCourseName)
      // console.log('Conversation project name:', conversation.projectName)
      // console.log('Conversation messages:', conversation.messages)
      const courseMatch = conversation.projectName === currentCourseName
      const searchTermMatch =
        conversation.projectName
          ?.toLocaleLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        conversation.messages.some((message) => {
          if (typeof message.content === 'string') {
            return message.content
              .toLowerCase()
              .includes(searchTerm.toLowerCase())
          } else if (Array.isArray(message.content)) {
            return message.content.some((content) =>
              content.text?.toLowerCase().includes(searchTerm.toLowerCase()),
            )
          }
          return false
        })
      const isMatch =
        (showCurrentCourseOnly ? courseMatch : true) && searchTermMatch
      return isMatch
    }
    const allConversations = conversations.concat(
      folders.flatMap((folder) => folder.conversations || []),
    )
    const filteredConversations = allConversations.filter(
      filterBySearchTermOrCourse,
    )
    chatDispatch({
      field: 'filteredConversations',
      value: filteredConversations,
    })
    console.log('Search term in chatbar:', searchTerm)
    console.log('Conversation history in chatbar:', conversations)
    console.log('Filtered conversations:', filteredConversations)
  }, [searchTerm, conversations, showCurrentCourseOnly, folders])

  return (
    <ChatbarContext.Provider
      value={{
        ...chatBarContextValue,
        handleDeleteConversation,
        handleClearConversations,
        handleImportConversations,
        handleExportData,
        handleApiKeyChange,
      }}
    >
      <Sidebar<Conversation>
        side={'left'}
        isOpen={showChatbar}
        addItemButtonTitle={t('New chat')}
        itemComponent={<Conversations conversations={filteredConversations} />}
        folderComponent={<ChatFolders searchTerm={searchTerm} />}
        items={filteredConversations}
        searchTerm={searchTerm}
        handleSearchTerm={(searchTerm: string) =>
          chatDispatch({ field: 'searchTerm', value: searchTerm })
        }
        showCurrentCourseOnly={showCurrentCourseOnly}
        onToggleCurrentCourseOnly={setShowCurrentCourseOnly}
        toggleOpen={handleToggleChatbar}
        handleCreateItem={handleNewConversation}
        handleCreateFolder={() => handleCreateFolder(t('New folder'), 'chat')}
        handleDrop={handleDrop}
        footerComponent={<ChatbarSettings />}
      />
    </ChatbarContext.Provider>
  )
}
