import {
  IconExternalLink,
  IconRobot,
  IconCloudUpload,
  // IconSettings,
} from '@tabler/icons-react'
import { Text } from '@mantine/core'
import { ModelSelect } from '../Chat/ModelSelect'
import { Conversation } from '~/types/chat'
import { useContext, useEffect, useRef } from 'react'
import HomeContext from '~/pages/api/home/home.context'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function TopBarInChat({ course_name }: { course_name: string }) {
  const {
    state: { showModelSettings, selectedConversation },
    dispatch: homeDispatch,
  } = useContext(HomeContext)

  const modelSettingsContainer = useRef<HTMLDivElement | null>(null)
  const topBarRef = useRef<HTMLDivElement | null>(null)

  // Clicking outside the box closes it
  // Don't close the box if we click of any of Model:, Upload Materials or Disclaimer.
  const handleClickOutside = (event: MouseEvent) => {
    if (
      event.target instanceof Node &&
      topBarRef.current &&
      topBarRef.current.contains(event.target)
    ) {
      // Do nothing, the click on button + and click outside should cancel out
    } else if (
      modelSettingsContainer.current &&
      topBarRef.current &&
      event.target instanceof Node &&
      !modelSettingsContainer.current.contains(event.target)
    ) {
      homeDispatch({ field: 'showModelSettings', value: false })
    }
  }

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [modelSettingsContainer])

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [topBarRef])

  return (
    <>
      <div className="sticky top-0 z-10">
        <div
          className={`sticky top-0 z-10 flex w-full flex-col justify-center bg-neutral-100 text-sm text-neutral-500 dark:border-none dark:bg-[#131426] dark:text-neutral-200`}
          ref={topBarRef}
        >
          <div
            className={`flex justify-center border border-b-neutral-300 bg-neutral-100 py-2 text-sm text-neutral-500 dark:border-none dark:bg-[#131426] dark:text-neutral-200`}
          >
            <button
              className="ml-2 cursor-pointer hover:opacity-50"
              onClick={() => {
                homeDispatch({
                  field: 'showModelSettings',
                  value: !showModelSettings,
                })
              }}
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
            <Link
              className="ml-2 cursor-pointer hover:opacity-50"
              href={`/${course_name}/materials`}
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
            </Link>
            &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;
            <Link
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
            </Link>
          </div>
        </div>

        {/* MODEL SETTINGS HERE */}
        {showModelSettings && <ModelSelect ref={modelSettingsContainer} />}
      </div>
    </>
  )
}
