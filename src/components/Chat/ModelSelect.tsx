import { useRef, useState, useEffect } from 'react'
import { IconExternalLink, IconChevronDown, IconX, IconArrowUpRight } from '@tabler/icons-react'
import { useContext } from 'react'
import { useTranslation } from 'next-i18next'
import { type OpenAIModel } from '@/types/openai'
import HomeContext from '~/pages/api/home/home.context'
import { ModelParams } from './ModelParams'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import { Group, Input, Title } from '@mantine/core'
import Link from 'next/link'

export const ModelSelect = () => {
  const {
    state: { selectedConversation, models, defaultModelId, showModelSettings, prompts },
    handleUpdateConversation,
    dispatch: homeDispatch,
  } = useContext(HomeContext)

  const { t } = useTranslation('chat')
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  const handleModelClick = (modelId: string) => {
    selectedConversation &&
      handleUpdateConversation(selectedConversation, {
        key: 'model',
        value: models.find((model) => model.id === modelId) as OpenAIModel,
      })
  }

  // Clicking outside the box closes it
  // Don't close the box if we click of any of Model:, Upload Materials or Disclaimer.
  const handleClickOutside = (event: MouseEvent) => {
    console.log("Target", event.target)
    console.log("wrapperRef.current", wrapperRef.current)
    console.log("computed style??", window.getComputedStyle(event.target as Element).zIndex)
    if (
      wrapperRef.current &&
      event.target instanceof Node &&
      !wrapperRef.current.contains(event.target) &&
      !(event.target as HTMLElement).innerText.includes("Model: ") &&
      !(event.target as HTMLElement).innerText.includes("Upload materials") &&
      !(event.target as HTMLElement).innerText.includes("Disclaimer: it's not perfect") &&
      window.getComputedStyle(event.target as Element).zIndex as string != '20'
    ) {
      homeDispatch({ field: 'showModelSettings', value: false })
      console.log("SHOULD HAVE CLOSED THE FIELD")
    }
  }

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [wrapperRef])

  return (
    <div
      ref={wrapperRef}
      className="flex flex-col z-20 md:mx-auto md:max-w-xl md:gap-6 md:py-3 md:pt-6 lg:max-w-2xl lg:px-0 xl:max-w-3xl">
      <div className="backdrop-filter-[blur(10px)] flex h-full flex-col space-y-4 rounded-lg border border-2 border-b border-[rgba(42,42,120,0.55)] border-neutral-200 p-4 dark:border-neutral-600 dark:bg-[rgba(42,42,64,1)] md:rounded-lg md:border">
        <div
        // ref={wrapperRef}
        // style={{ width: 'fit-content' }}
        >
          <div
            // ref={wrapperRef}
            className="flex flex-col"
          >
            <Title
              className={`pt-4 pl-2 pb-0 ${montserrat_heading.variable} font-montserratHeading`}
              order={4}
            >
              Model
            </Title>
            <Input.Description className="p-2 text-left">
              <Link
                href="https://platform.openai.com/docs/models"
                target="_blank"
                className="hover:underline"
              >
                Read about each model{' '}
                <IconExternalLink size={13} style={{ position: 'relative', top: '2px' }} className={'mb-2 inline'} />
              </Link>
            </Input.Description>
            <div
              tabIndex={0}
              className="relative w-full"
            >
              <select className="menu rounded-sm absolute z-[1] w-full bg-base-100 shadow " value={selectedConversation?.model.id || defaultModelId} onChange={(e) => handleModelClick(e.target.value)}>
                {models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
            </div>
            {/* <div className="mt-3 flex w-full items-center text-left">
        <a
          href="https://platform.openai.com/account/usage"
          target="_blank"
          className="flex items-center"
        >
          <IconExternalLink size={18} className={'mr-1 inline'} />
          {t('View Account Usage')}
          View accoutn usaaageee
        </a>
      </div> */}
          </div >
          <div style={{ paddingTop: '47px' }}>
            <ModelParams
              selectedConversation={selectedConversation}
              prompts={prompts}
              handleUpdateConversation={handleUpdateConversation}
              t={t}
            />
          </div>
        </div >
      </div >
    </div >

  )
}
