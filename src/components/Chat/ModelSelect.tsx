import { useRef, useState, useEffect } from 'react'
import { IconExternalLink, IconChevronDown } from '@tabler/icons-react'
import { useContext } from 'react'
import { useTranslation } from 'next-i18next'
import { OpenAIModel } from '@/types/openai'
import HomeContext from '~/pages/api/home/home.context'

export const ModelSelect = () => {
  const { t } = useTranslation('chat')
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef(null)

  const {
    state: { selectedConversation, models, defaultModelId },
    handleUpdateConversation,
    dispatch: homeDispatch,
  } = useContext(HomeContext)

  const handleModelClick = (modelId) => {
    setIsOpen(false)
    selectedConversation &&
      handleUpdateConversation(selectedConversation, {
        key: 'model',
        value: models.find((model) => model.id === modelId) as OpenAIModel,
      })
  }

  const handleClickOutside = (event) => {
    if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
      setIsOpen(false)
    }
  }

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [wrapperRef])

  return (
    <div className="flex flex-col">
      <label className="mb-2 text-left text-neutral-700 dark:text-neutral-400">
        {t('Model')}
      </label>
      <div
        ref={wrapperRef}
        tabIndex={0}
        className="relative w-full rounded-lg border border-neutral-300 bg-neutral-50 pr-2 text-neutral-900 dark:border-neutral-600 dark:text-white"
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
      >
        <div className="flex w-full items-center justify-between bg-transparent p-2">
          <span>
            {selectedConversation?.model?.id === defaultModelId
              ? selectedConversation?.model?.name
              : selectedConversation?.model?.name || 'Select a model'}
          </span>
          <IconChevronDown size={18} />
        </div>
        {isOpen && (
          <ul className="menu rounded-box absolute z-[1] w-full bg-base-100 p-2 shadow">
            {models.map((model) => (
              <li key={model.id} className="dark:bg-[#343541] dark:text-white">
                <a onClick={() => handleModelClick(model.id)}>
                  {model.id === defaultModelId ? model.name : model.name}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="mt-3 flex w-full items-center text-left text-neutral-700 dark:text-neutral-400">
        <a
          href="https://platform.openai.com/account/usage"
          target="_blank"
          className="flex items-center"
        >
          <IconExternalLink size={18} className={'mr-1 inline'} />
          {t('View Account Usage')}
        </a>
      </div>
    </div>
  )
}
