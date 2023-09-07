// src/pages/home/home.tsx
import { useEffect, useRef, useState } from 'react'
import { useQuery } from 'react-query'

import { type GetServerSideProps, type GetServerSidePropsContext } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import Head from 'next/head'

import { useCreateReducer } from '@/hooks/useCreateReducer'

import useErrorService from '@/services/errorService'
import useApiService from '@/services/useApiService'

import {
  cleanConversationHistory,
  cleanSelectedConversation,
} from '@/utils/app/clean'
import { DEFAULT_SYSTEM_PROMPT, DEFAULT_TEMPERATURE } from '@/utils/app/const'
import {
  saveConversation,
  saveConversations,
  updateConversation,
} from '@/utils/app/conversation'
import { saveFolders } from '@/utils/app/folders'
import { savePrompts } from '@/utils/app/prompts'
import { getSettings } from '@/utils/app/settings'

import { type Conversation } from '@/types/chat'
import { type KeyValuePair } from '@/types/data'
import { type FolderInterface, type FolderType } from '@/types/folder'
import { OpenAIModelID, OpenAIModels, fallbackModelID } from '@/types/openai'
import { type Prompt } from '@/types/prompt'

import { Chat } from '@/components/Chat/Chat'
import { Chatbar } from '@/components/Chatbar/Chatbar'
import { Navbar } from '@/components/Mobile/Navbar'
import Promptbar from '@/components/Promptbar'

import HomeContext from './home.context'
import { type HomeInitialState, initialState } from './home.state'

import { v4 as uuidv4 } from 'uuid'
import { type CourseMetadata } from '~/types/courseMetadata'
import { kv } from '@vercel/kv'
import { useUser } from '@clerk/nextjs'
import { get_user_permission } from '~/components/UIUC-Components/runAuthCheck'
import { useRouter } from 'next/router'

interface Props {
  // serverSideApiKeyIsSet: boolean
  serverSidePluginKeysSet: boolean
  defaultModelId: OpenAIModelID
}

const Home = ({
  // serverSideApiKeyIsSet,
  serverSidePluginKeysSet,
  defaultModelId,
}: Props) => {
  const { t } = useTranslation('chat')
  const { getModels } = useApiService()
  const { getModelsError } = useErrorService()
  const [initialRender, setInitialRender] = useState<boolean>(true)

  const contextValue = useCreateReducer<HomeInitialState>({
    initialState,
  })

  const {
    state: {
      // apiKey,
      lightMode,
      folders,
      conversations,
      selectedConversation,
      prompts,
      temperature,
    },
    dispatch,
  } = contextValue

  const stopConversationRef = useRef<boolean>(false)

  const router = useRouter()
  const course_name = router.query.course_name as string

  // Using hook to fetch the latest course_metadata
  const [isCourseMetadataLoading, setIsCourseMetadataLoading] = useState(true)
  const [course_metadata, setCourseMetadata] = useState<CourseMetadata | null>(
    null,
  )

  useEffect(() => {
    const courseMetadata = async () => {
      const response = await fetch(
        `/api/UIUC-api/getCourseMetadata?course_name=${course_name}`,
      )
      const data = await response.json()
      setCourseMetadata(data.course_metadata)
      // console.log("Course Metadata in home: ", data.course_metadata)
      setIsCourseMetadataLoading(false)
    }
    courseMetadata()
  }, [course_name])

  useEffect(() => {
    if (course_metadata !== null) {
      const apiKey = localStorage.getItem('apiKey')

      // 1. Try to use global env key from Vercel .env 
      // 2. Try to use course-specific key from KV store
      // 3. No key set; the user will have to enter one

      // if (process.env.OPENAI_API_KEY) {
      //   // use global env key
      //   // openai_api_key = process.env.OPENAI_API_KEY
      //   serverSideApiKeyIsSet = true
      //   console.log('👉👉👉👉Using global env key...')
      // } else if (course_metadata?.openai_api_key) {
      //   // use course-specific key
      //   process.env.OPENAI_API_KEY = course_metadata.openai_api_key
      //   serverSideApiKeyIsSet = true
      //   console.log('👉👉👉👉👉👉Using course-wide API key: ', process.env.OPENAI_API_KEY)
      // } else {
      //   // user have to enter one
      //   console.log('👉👉👉👉👉👉Using NO API KEY AT ALL: ', process.env.OPENAI_API_KEY)
      //   process.env.OPENAI_API_KEY = ''
      // }

      // If Course-Wide OpenAI key is set, use it
      if (course_metadata.openai_api_key && course_metadata.openai_api_key !== '') {
        dispatch({ field: 'apiKey', value: '' })
        localStorage.removeItem('apiKey')
      } else if (apiKey) {
        // NO course wide, yes local key.
        if (!apiKey.startsWith('sk-')) {
          alert(`Error: OpenAI API keys must start with "sk-", but yours is ${apiKey}`);
        }
        dispatch({ field: 'apiKey', value: apiKey })
      } else {
        // TODO: Which case is this?
        // Might have to do this on the 'chat.ts' where we invoke the API.

      }

      const pluginKeys = localStorage.getItem('pluginKeys')
      if (serverSidePluginKeysSet) {
        dispatch({ field: 'pluginKeys', value: [] })
        localStorage.removeItem('pluginKeys')
      } else if (pluginKeys) {
        dispatch({ field: 'pluginKeys', value: pluginKeys })
      }
    }
  }, [course_metadata, serverSidePluginKeysSet, dispatch])


  // Check auth & redirect
  const clerk_user_outer = useUser()
  // const course_exists = course_metadata != null

  // ------------------- 👇 MOST BASIC AUTH CHECK 👇 -------------------

  // DO AUTH-based redirect!
  useEffect(() => {
    if (!clerk_user_outer.isLoaded || isCourseMetadataLoading) {
      return
    }
    if (clerk_user_outer.isLoaded || isCourseMetadataLoading) {
      if (course_metadata != null) {
        const permission_str = get_user_permission(
          course_metadata,
          clerk_user_outer,
          router,
        )

        if (permission_str == 'edit' || permission_str == 'view') {
          // ✅ AUTHED
        } else {
          // 🚫 NOT AUTHED
          router.push(`/${course_name}/not_authorized`)
        }
      } else {
        // 🆕 MAKE A NEW COURSE
        console.log('Course does not exist, redirecting to materials page')
        router.push(`/${course_name}/materials`)
      }
    }
  }, [clerk_user_outer.isLoaded, isCourseMetadataLoading])
  // ------------------- 👆 MOST BASIC AUTH CHECK 👆 -------------------

  useEffect(() => {
    if (data) dispatch({ field: 'models', value: data })
  }, [data, dispatch])

  useEffect(() => {
    dispatch({ field: 'modelError', value: getModelsError(error) })
  }, [dispatch, error, getModelsError])

  // FETCH MODELS ----------------------------------------------

  const handleSelectConversation = (conversation: Conversation) => {
    dispatch({
      field: 'selectedConversation',
      value: conversation,
    })

    saveConversation(conversation)
  }

  // FOLDER OPERATIONS  --------------------------------------------

  const handleCreateFolder = (name: string, type: FolderType) => {
    const newFolder: FolderInterface = {
      id: uuidv4(),
      name,
      type,
    }

    const updatedFolders = [...folders, newFolder]

    dispatch({ field: 'folders', value: updatedFolders })
    saveFolders(updatedFolders)
  }

  const handleDeleteFolder = (folderId: string) => {
    const updatedFolders = folders.filter((f) => f.id !== folderId)
    dispatch({ field: 'folders', value: updatedFolders })
    saveFolders(updatedFolders)

    const updatedConversations: Conversation[] = conversations.map((c) => {
      if (c.folderId === folderId) {
        return {
          ...c,
          folderId: null,
        }
      }

      return c
    })

    dispatch({ field: 'conversations', value: updatedConversations })
    saveConversations(updatedConversations)

    const updatedPrompts: Prompt[] = prompts.map((p) => {
      if (p.folderId === folderId) {
        return {
          ...p,
          folderId: null,
        }
      }

      return p
    })

    dispatch({ field: 'prompts', value: updatedPrompts })
    savePrompts(updatedPrompts)
  }

  const handleUpdateFolder = (folderId: string, name: string) => {
    const updatedFolders = folders.map((f) => {
      if (f.id === folderId) {
        return {
          ...f,
          name,
        }
      }

      return f
    })

    dispatch({ field: 'folders', value: updatedFolders })

    saveFolders(updatedFolders)
  }

  // CONVERSATION OPERATIONS  --------------------------------------------

  const handleNewConversation = () => {
    const lastConversation = conversations[conversations.length - 1]

    const newConversation: Conversation = {
      id: uuidv4(),
      name: t('New Conversation'),
      messages: [],
      model: lastConversation?.model || {
        id: OpenAIModels[defaultModelId].id,
        name: OpenAIModels[defaultModelId].name,
        maxLength: OpenAIModels[defaultModelId].maxLength,
        tokenLimit: OpenAIModels[defaultModelId].tokenLimit,
      },
      prompt: DEFAULT_SYSTEM_PROMPT,
      temperature: lastConversation?.temperature ?? DEFAULT_TEMPERATURE,
      folderId: null,
    }

    const updatedConversations = [...conversations, newConversation]

    dispatch({ field: 'selectedConversation', value: newConversation })
    dispatch({ field: 'conversations', value: updatedConversations })

    saveConversation(newConversation)
    saveConversations(updatedConversations)

    dispatch({ field: 'loading', value: false })
  }

  const handleUpdateConversation = (
    conversation: Conversation,
    data: KeyValuePair,
  ) => {
    const updatedConversation = {
      ...conversation,
      [data.key]: data.value,
    }

    const { single, all } = updateConversation(
      updatedConversation,
      conversations,
    )

    dispatch({ field: 'selectedConversation', value: single })
    dispatch({ field: 'conversations', value: all })
  }

  // EFFECTS  --------------------------------------------

  useEffect(() => {
    if (window.innerWidth < 640) {
      dispatch({ field: 'showChatbar', value: false })
    }
  }, [selectedConversation])

  useEffect(() => {
    defaultModelId &&
      dispatch({ field: 'defaultModelId', value: defaultModelId })
    serverSideApiKeyIsSet &&
      dispatch({
        field: 'serverSideApiKeyIsSet',
        value: serverSideApiKeyIsSet,
      })
    serverSidePluginKeysSet &&
      dispatch({
        field: 'serverSidePluginKeysSet',
        value: serverSidePluginKeysSet,
      })
  }, [defaultModelId, serverSideApiKeyIsSet, serverSidePluginKeysSet])

  // ON LOAD --------------------------------------------

  useEffect(() => {
    const settings = getSettings()
    if (settings.theme) {
      dispatch({
        field: 'lightMode',
        value: settings.theme,
      })
    }


    if (window.innerWidth < 640) {
      dispatch({ field: 'showChatbar', value: false })
      dispatch({ field: 'showPromptbar', value: false })
    }

    const showChatbar = localStorage.getItem('showChatbar')
    if (showChatbar) {
      dispatch({ field: 'showChatbar', value: showChatbar === 'true' })
    }

    const showPromptbar = localStorage.getItem('showPromptbar')
    if (showPromptbar) {
      dispatch({ field: 'showPromptbar', value: showPromptbar === 'true' })
    }

    const folders = localStorage.getItem('folders')
    if (folders) {
      dispatch({ field: 'folders', value: JSON.parse(folders) })
    }

    const prompts = localStorage.getItem('prompts')
    if (prompts) {
      dispatch({ field: 'prompts', value: JSON.parse(prompts) })
    }

    const conversationHistory = localStorage.getItem('conversationHistory')
    if (conversationHistory) {
      const parsedConversationHistory: Conversation[] =
        JSON.parse(conversationHistory)
      const cleanedConversationHistory = cleanConversationHistory(
        parsedConversationHistory,
      )

      dispatch({ field: 'conversations', value: cleanedConversationHistory })
    }

    const selectedConversation = localStorage.getItem('selectedConversation')
    if (selectedConversation) {
      const parsedSelectedConversation: Conversation =
        JSON.parse(selectedConversation)
      const cleanedSelectedConversation = cleanSelectedConversation(
        parsedSelectedConversation,
      )

      dispatch({
        field: 'selectedConversation',
        value: cleanedSelectedConversation,
      })
    } else {
      const lastConversation = conversations[conversations.length - 1]
      dispatch({
        field: 'selectedConversation',
        value: {
          id: uuidv4(),
          name: t('New Conversation'),
          messages: [],
          model: OpenAIModels[defaultModelId],
          prompt: DEFAULT_SYSTEM_PROMPT,
          temperature: lastConversation?.temperature ?? DEFAULT_TEMPERATURE,
          folderId: null,
        },
      })
    }
  }, [defaultModelId, dispatch, serverSidePluginKeysSet]) // serverSideApiKeyIsSet,

  return (
    <HomeContext.Provider
      value={{
        ...contextValue,
        handleNewConversation,
        handleCreateFolder,
        handleDeleteFolder,
        handleUpdateFolder,
        handleSelectConversation,
        handleUpdateConversation,
      }}
    >
      <Head>
        <title>UIUC Course AI</title>
        <meta name="description" content="ChatGPT but better." />
        <meta
          name="viewport"
          content="height=device-height ,width=device-width, initial-scale=1, user-scalable=no"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {selectedConversation && (
        <main
          className={`flex h-screen w-screen flex-col text-sm text-white dark:text-white ${lightMode}`}
        >
          <div className="fixed top-0 w-full sm:hidden">
            <Navbar
              selectedConversation={selectedConversation}
              onNewConversation={handleNewConversation}
            />
          </div>

          <div className="flex h-full w-full pt-[48px] sm:pt-0">
            <Chatbar />

            <div className="flex flex-1">
              {course_metadata && (
                <Chat
                  stopConversationRef={stopConversationRef}
                  courseMetadata={course_metadata}
                />
              )}
            </div>

            <Promptbar />
          </div>
        </main>
      )}
    </HomeContext.Provider>
  )
}
export default Home

// import { useAuth, useUser } from '@clerk/nextjs'

// import { useAuth } from '@clerk/nextjs'
// import { withAuth } from '@clerk/nextjs/api'

// import { getAuth, buildClerkProps } from '@clerk/nextjs/server'
// import { get_user_permission } from '~/components/UIUC-Components/runAuthCheck'

export const getServerSideProps: GetServerSideProps = async (
  context: GetServerSidePropsContext,
) => {
  console.log('ServerSideProps: ', context.params)
  const { locale } = context

  const course_name = context.params?.course_name as string

  // let openai_api_key = null
  // let serverSideApiKeyIsSet = false

  // Check course authed users -- the JSON.parse is CRUCIAL to avoid bugs with the stringified JSON 😭
  try {
    const course_metadata = (await kv.hget(
      'course_metadatas',
      course_name,
    )) as CourseMetadata
    console.log('in api getCourseMetadata: course_metadata', course_metadata)

    if (course_metadata == null) {
      console.log('WARNING: Course metadata not found in KV database (its null)')
    }

    // Only parse is_private if it exists
    if (course_metadata.hasOwnProperty('is_private')) {
      course_metadata.is_private = JSON.parse(
        course_metadata.is_private as unknown as string,
      )
    }
    console.log('home.tsx -- Course metadata in serverside: ', course_metadata)
  } catch (error) {
    console.error('Error occured while fetching courseMetadata', error)
  }
  const defaultModelId =
    (process.env.DEFAULT_MODEL &&
      Object.values(OpenAIModelID).includes(
        process.env.DEFAULT_MODEL as OpenAIModelID,
      ) &&
      process.env.DEFAULT_MODEL) ||
    fallbackModelID

  let serverSidePluginKeysSet = false
  const googleApiKey = process.env.GOOGLE_API_KEY
  const googleCSEId = process.env.GOOGLE_CSE_ID

  if (googleApiKey && googleCSEId) {
    serverSidePluginKeysSet = true
    console.log('Google plugin keys set... should work.')
  } else {
    console.log('Google plugin keys not set... will NOT work.')
  }

  // If openai_api_key is not present in course_metadata, use the one from process.env - fallback needed for models api.
  // if (!openai_api_key && process.env.OPENAI_API_KEY) {
  //   openai_api_key = process.env.OPENAI_API_KEY
  //   serverSideApiKeyIsSet = false
  // }
  // TODO: figure out how to set env vars from the front-end.... or something similar.
  // console.log('Final serverSideApiKeyIsSet', serverSideApiKeyIsSet)
  console.log('OpenAI apikey on server side (not client!!)', process.env.OPENAI_API_KEY)

  return {
    props: {
      // ...buildClerkProps(context.req), // https://clerk.com/docs/nextjs/getserversideprops
      // TODO: here we can fetch the keys...
      // serverSideApiKeyIsSet,
      defaultModelId,
      serverSidePluginKeysSet,
      ...(await serverSideTranslations(locale ?? 'en', [
        'common',
        'chat',
        'sidebar',
        'markdown',
        'promptbar',
        'settings',
      ])),
    },
  }
}
