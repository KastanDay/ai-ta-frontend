import { IconChevronDown, IconExternalLink } from '@tabler/icons-react'
import { useContext } from 'react'
import { useMediaQuery } from '@mantine/hooks'
import HomeContext from '~/pages/api/home/home.context'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import { Input, Select, Title } from '@mantine/core'
import Link from 'next/link'
import React from 'react'

export const ModelSelect = React.forwardRef<HTMLDivElement, any>(
  (props, ref) => {
    const {
      state: { selectedConversation, models, defaultModelId },
      handleUpdateConversation,
    } = useContext(HomeContext)
    const isSmallScreen = useMediaQuery('(max-width: 960px)')

    const handleModelClick = (modelId: string) => {
      console.debug('handleModelClick clicked:', modelId)
      console.debug('handleModelClick avail models: ', models)

      // First try to use selectedconversation model, if not available, use default model
      const defaultModel =
        models.find(
          (model) =>
            model.id === 'gpt-4-from-canada-east' || model.id === 'gpt-4',
        ) || models[0]
      const model = models.find((model) => model.id === modelId) || defaultModel

      console.debug('handleModelClick SETTING IT TO: ', model)

      selectedConversation &&
        handleUpdateConversation(selectedConversation, {
          key: 'model',
          value: model,
        })
    }

    return (
      <div
        className="flex h-full w-[100%] flex-col space-y-4 rounded-lg bg-[#1d1f33] p-4 dark:bg-[#1d1f33]"
        style={{ position: 'relative', zIndex: 100 }}
      >
        <div>
          <div className="flex flex-col">
            <Title
              className={`px-4 pt-4 ${montserrat_heading.variable} rounded-lg bg-[#15162c] p-4 font-montserratHeading md:rounded-lg`}
              color="white"
              order={isSmallScreen ? 5 : 4}
            >
              Model
            </Title>

            <div
              tabIndex={0}
              className="relative mt-4 flex w-full flex-col items-start px-4"
            >
              <Select
                className={`menu z-[50] ${isSmallScreen ? 'w-[75%]' : 'w-[45%]'}`}
                size={isSmallScreen ? 'sm' : 'md'}
                value={selectedConversation?.model.id || defaultModelId}
                onChange={handleModelClick}
                data={models.map((model) => ({
                  value: model.id,
                  label: model.name,
                }))}
                rightSection={<IconChevronDown size="1rem" />}
                rightSectionWidth={isSmallScreen ? 15 : 30}
                classNames={{
                  item: `${montserrat_paragraph.variable} font-montserratParagraph ${isSmallScreen ? 'text-xs' : 'text-sm'}`,
                  input: `${montserrat_paragraph.variable} font-montserratParagraph ${isSmallScreen ? 'text-xs' : 'text-sm'}`,
                }}
                styles={(theme) => ({
                  rightSection: { pointerEvents: 'none' },
                  input: {
                    margin: '2px',
                    backgroundColor: 'rgb(107, 33, 168)',
                    border: 'none',
                    color: theme.white,
                    borderRadius: theme.radius.md,
                  },
                  dropdown: {
                    backgroundColor: '#1d1f33',
                    border: '1px solid rgba(42,42,120,1)',
                    borderRadius: theme.radius.md,
                    marginTop: '2px',
                    boxShadow: theme.shadows.xs,
                    maxWidth: '100%',
                  },
                  item: {
                    backgroundColor: '#1d1f33',
                    borderRadius: theme.radius.md,
                    margin: '2px',
                    '&[data-selected]': {
                      '&': {
                        backgroundColor: 'transparent',
                      },
                      '&:hover': {
                        backgroundColor: 'rgb(107, 33, 168)',
                        color: theme.white,
                      },
                    },
                    '&[data-hovered]': {
                      backgroundColor: 'rgb(107, 33, 168)',
                      color: theme.white,
                    },
                  },
                })}
              />
              <Input.Description
                className={`ms-4 text-gray-400 ${montserrat_paragraph.variable} font-montserratParagraph`}
              >
                <Link
                  href="https://platform.openai.com/docs/models"
                  target="_blank"
                  className="hover:underline"
                >
                  Read about each model{' '}
                  <IconExternalLink
                    size={15}
                    style={{ position: 'relative', top: '2px' }}
                    className={'mb-2 inline'}
                  />
                </Link>
              </Input.Description>
            </div>
          </div>
        </div>
      </div>
    )
  },
)

ModelSelect.displayName = 'ModelSelect'
