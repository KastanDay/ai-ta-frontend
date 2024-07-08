import { IconChevronDown, IconCircleCheck, IconExternalLink, IconLoader } from '@tabler/icons-react'
import { forwardRef, useContext } from 'react'
import { useMediaQuery } from '@mantine/hooks'
import HomeContext from '~/pages/api/home/home.context'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import { Group, Input, Select, Title, Text } from '@mantine/core'
import Link from 'next/link'
import React from 'react'
import { webLLMModels, ollamaModels } from '~/pages/api/models'
import { OllamaModel } from '~/utils/modelProviders/ollama'
import { OpenAIModel, OpenAIModels } from '~/types/openai'
import { WebllmModel } from '~/utils/modelProviders/WebLLM'
import { Ollama } from 'ollama-ai-provider'

interface ModelDropdownProps {
  title: string;
  value: string | undefined;
  onChange: (value: string) => void;
  models: { id: string; name: string; isDownloaded?: boolean; downloadSize?: string }[];
  isSmallScreen: boolean;
  isWebLLM?: boolean;
}

interface ModelItemProps extends React.ComponentPropsWithoutRef<'div'> {
  label: string;
  downloadSize?: string;
  isDownloaded?: boolean;
}

const ModelItem = forwardRef<HTMLDivElement, ModelItemProps>(
  ({ label, downloadSize, isDownloaded, ...others }: ModelItemProps, ref) => (
    <div ref={ref} {...others}>
      <Group noWrap>
        <div>
          <Text size="sm">{label}</Text>
          {downloadSize && (
            <Text size="xs" opacity={0.65}>
              {downloadSize} {isDownloaded ? <IconCircleCheck size="1rem" /> : <IconLoader size="1rem" />}
            </Text>
          )}
        </div>
      </Group>
    </div>
  )
);

const ModelDropdown: React.FC<ModelDropdownProps> = ({ title, value, onChange, models, isSmallScreen, isWebLLM }) => (
  <>
    <Title
      className={`px-4 pt-4 ${montserrat_heading.variable} rounded-lg bg-[#15162c] p-4 font-montserratHeading md:rounded-lg`}
      color="white"
      order={isSmallScreen ? 5 : 4}
    >
      {title}
    </Title>

    <div
      tabIndex={0}
      className="relative mt-4 flex w-full flex-col items-start px-4"
    >
      <Select
        className={`menu z-[50] ${isSmallScreen ? 'w-[75%]' : 'w-[45%]'}`}
        size={isSmallScreen ? 'sm' : 'md'}
        value={value}
        onChange={onChange}
        data={models.map((model: any) => ({
          value: model.id,
          label: model.name,
          downloadSize: model.downloadSize,
          isDownloaded: model.isDownloaded,
        }))}
        itemComponent={ModelItem}
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
            // zIndex: 200,
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
    </div>
  </>
)

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
            <ModelDropdown
              title="OpenAI"
              value={selectedConversation?.model.id || defaultModelId}
              onChange={handleModelClick}
              models={Object.values(OpenAIModels)}
              isSmallScreen={isSmallScreen}
            />
            <ModelDropdown
              title="Ollama"
              value={selectedConversation?.model.id || defaultModelId}
              onChange={handleModelClick}
              models={Object.values(ollamaModels)}
              isSmallScreen={isSmallScreen}
            />
            <ModelDropdown
              title="Local in Browser LLMs"
              value={selectedConversation?.model.id || defaultModelId}
              onChange={handleModelClick}
              models={Object.values(webLLMModels).map(model => ({
                id: model.id,
                name: model.name,
                isDownloaded: model.isDownloaded,
                downloadSize: model.downloadSize,
              }))}
              isSmallScreen={isSmallScreen}
              isWebLLM={true}
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
    )
  },
)

ModelSelect.displayName = 'ModelSelect'