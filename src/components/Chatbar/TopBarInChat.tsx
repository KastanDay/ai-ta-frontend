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
  IconRobot,
  IconCloudUpload,
  // IconArrowUpRight,
  // IconFileTextAi,
  // IconX,
  // IconDownload,
  // IconClearAll,
  // IconSettings,
} from '@tabler/icons-react'
import { Button, Text, Title } from '@mantine/core'
import { ModelSelect } from '../Chat/ModelSelect'
import { Conversation } from '~/types/chat'
import { ModelParams } from '../Chat/ModelParams'

export default function TopBarInChat({
  handleSettings,
  showSettings,
  selectedConversation,
  redirectToMaterialsPage,
  isTransparent = false,
}: {
  handleSettings: () => void
  showSettings: boolean
  selectedConversation: Conversation | undefined
  redirectToMaterialsPage: () => void
  isTransparent?: boolean
}) {
  return (
    <>
      {/* Always render the 'model, upload, disclaimer' banner */}
      <div
        className={isTransparent ? 'dark:bg-transparent' : 'dark:bg-darkgrey'}
      >
        <div className="sticky top-0 z-10 flex w-full flex-col justify-center bg-neutral-100 text-sm text-neutral-500 dark:border-none dark:bg-transparent dark:text-neutral-200">
          <div className="flex justify-center border border-b-neutral-300 bg-neutral-100 py-2 text-sm text-neutral-500 dark:border-none dark:bg-transparent dark:text-neutral-200">
            <button
              className="ml-2 cursor-pointer hover:opacity-50"
              onClick={handleSettings}
            >
              <div className="flex items-center">
                <Text
                  variant="gradient"
                  weight={400}
                  gradient={{ from: 'white', to: 'white', deg: 50 }}
                >
                  Model: {selectedConversation?.model.name}
                </Text>
                {/* {t('Model')}: {selectedConversation?.model.name} */}
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
              {/* TODO: enable temperature & system prompt changes */}
              {/* <ModelParams
                selectedConversation={selectedConversation}
                prompts={prompts}
                handleUpdateConversation={handleUpdateConversation}
                t={t}
              /> */}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
