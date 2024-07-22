import {
  IconChevronDown,
  IconCircleCheck,
  IconDownload,
  IconExternalLink,
  IconCircleDashed,
  IconSparkles,
} from '@tabler/icons-react'
import { forwardRef, useContext } from 'react'
import { useMediaQuery } from '@mantine/hooks'
import HomeContext from '~/pages/api/home/home.context'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import { Group, Input, Select, Title, Text } from '@mantine/core'
import Link from 'next/link'
import React from 'react'
import { OpenAIModel, OpenAIModels, preferredModelIds } from '~/types/openai'
import { webLLMModels } from '~/utils/modelProviders/WebLLM'
import { modelCached } from './UserSettings'
import Image from 'next/image'
import { ProviderNames } from '~/types/LLMProvider'
import { SelectItemProps } from '@mantine/core';

const ValueComponent = ({ value, label, modelType }: SelectItemProps & { modelType: string }) => (
  <div style={{ display: 'flex', alignItems: 'center' }}>
    <Image src={getModelLogo(modelType)} alt={`${modelType} logo`} width={20} height={20} style={{ marginRight: '8px' }} />
    <span>{label}</span>
  </div>
);
interface ModelDropdownProps {
  title: string
  value: string | undefined
  onChange: (value: string) => void
  models: {
    OpenAI?: { id: string; name: string; downloadSize?: string }[]
    Ollama?: { id: string; name: string; downloadSize?: string }[]
    WebLLM?: { id: string; name: string; downloadSize?: string }[]
    Anthropic?: { id: string; name: string; downloadSize?: string }[]
  }
  isSmallScreen: boolean
  isWebLLM?: boolean
}

interface ModelItemProps extends React.ComponentPropsWithoutRef<'div'> {
  label: string
  downloadSize?: string
  isDownloaded?: boolean
  modelId: string
  selectedModelId: string | undefined
  modelType: string
}

const getModelLogo = (modelType: string) => {
  switch (modelType) {
    case ProviderNames.OpenAI:
      return 'https://images.squarespace-cdn.com/content/v1/5a4908d949fc2b8e312bdf53/1676298536608-GQSN44SGOEHWCFSIZIGK/openai_icon.png?format=750w';
    case ProviderNames.Ollama:
      return 'https://raw.githubusercontent.com/deepset-ai/haystack-integrations/main/logos/ollama.png';
    case ProviderNames.WebLLM:
      return 'https://avatars.githubusercontent.com/u/106173866?s=48&v=4';
    case ProviderNames.Anthropic:
      return 'https://www.anthropic.com/images/icons/safari-pinned-tab.svg';
    default:
      return 'https://via.placeholder.com/20'; // Fallback URL
  }
};

const ModelItem = forwardRef<HTMLDivElement, ModelItemProps>(
  (
    {
      label,
      downloadSize,
      isDownloaded,
      modelId,
      selectedModelId,
      modelType,
      ...others
    }: ModelItemProps,
    ref,
  ) => {
    const isModelCached = modelCached.some((model) => model.id === modelId)
    const showSparkles =
      label === 'Llama-3-8B-Instruct-q4f32_1-MLC' ||
      label === 'Llama-3-8B-Instruct-q4f16_1-MLC'

    return (
      <div ref={ref} {...others}>
        <Group noWrap>
          <div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Image src={getModelLogo(modelType)} alt={`${modelType} logo`} width={20} height={20} style={{ marginRight: '8px' }} />
              {/* {selectedModelId === modelId ? (
                <IconCircleCheck stroke={2} />
              ) : (
                <IconCircleDashed stroke={2} />
              )} */}
              <Text size="sm" style={{ marginLeft: '8px' }}>
                {label}
              </Text>
            </div>
            {downloadSize && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginTop: '4px',
                }}
              >
                <Text size="xs" opacity={0.65}>
                  {downloadSize}
                </Text>
                {isModelCached ? (
                  <IconCircleCheck size="1rem" style={{ marginLeft: '8px' }} />
                ) : (
                  <IconDownload size="1rem" style={{ marginLeft: '8px' }} />
                )}
                <Text size="xs" opacity={0.65} style={{ marginLeft: '4px' }}>
                  {isModelCached ? 'downloaded' : 'download'}
                </Text>
                {showSparkles && (
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <IconSparkles size="1rem" style={{ marginLeft: '8px' }} />
                    <Text size="xs" opacity={0.65} style={{ marginLeft: '4px' }}>
                      recommended
                    </Text>
                  </div>
                )}
              </div>
            )}
          </div>
        </Group>
      </div>
    )
  },
)

const ModelDropdown: React.FC<ModelDropdownProps> = ({
  title,
  value,
  onChange,
  models,
  isSmallScreen,
  isWebLLM,
}) => {
  const allModels = [
    ...(models.OpenAI || []).map((model) => ({ ...model, provider: ProviderNames.OpenAI, group: 'OpenAI' })),
    ...(models.Ollama || []).map((model) => ({ ...model, provider: ProviderNames.Ollama, group: 'Ollama' })),
    ...(models.WebLLM || []).map((model) => ({ ...model, provider: ProviderNames.WebLLM, group: 'WebLLM' })),
    ...(models.Anthropic || []).map((model) => ({ ...model, provider: ProviderNames.Anthropic, group: 'Anthropic' })),
  ];
  const selectedModel = allModels.find((model) => model.id === value);

  return (
    <>
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
          placeholder='Select a model'
          searchable
          value={value}
          onChange={onChange}
          data={allModels.map((model: any) => ({
            value: model.id,
            label: model.name,
            downloadSize: model.downloadSize,
            modelId: model.id,
            selectedModelId: value,
            modelType: model.provider,
            group: model.group,
          }))}
          itemComponent={ModelItem}
          icon={selectedModel ? (
            <Image
              src={getModelLogo(selectedModel.provider)}
              alt={`${selectedModel.provider} logo`}
              width={20}
              height={20}
              style={{ marginLeft: '4px' }}
            />
          ) : null}
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
              width: '22rem',
              [`@media (max-width: 960px)`]: {
                width: '17rem', // Smaller width for small screens
              },
            },
            dropdown: {
              backgroundColor: '#1d1f33',
              border: '1px solid rgba(42,42,120,1)',
              borderRadius: theme.radius.md,
              marginTop: '2px',
              boxShadow: theme.shadows.xs,
              maxWidth: '100%',
              zIndex: 2000,
              position: 'absolute',
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
          dropdownPosition="bottom"
          withinPortal
        />
      </div>
    </>
  );
};
const findProvider = (modelId: string, models: any) => {
  if (models.OpenAI?.some((model: { id: string }) => model.id === modelId)) return ProviderNames.OpenAI;
  if (models.Ollama?.some((model: { id: string }) => model.id === modelId)) return ProviderNames.Ollama;
  if (models.WebLLM?.some((model: { id: string }) => model.id === modelId)) return ProviderNames.WebLLM;
  if (models.Anthropic?.some((model: { id: string }) => model.id === modelId)) return ProviderNames.Anthropic;
  return '';
};
export const ModelSelect = React.forwardRef<HTMLDivElement, any>(
  (props, ref) => {
    const {
      state: { selectedConversation, models, defaultModelId },
      handleUpdateConversation,
    } = useContext(HomeContext)
    const isSmallScreen = useMediaQuery('(max-width: 960px)')

    console.log('Models in model select: ', models)

    const handleModelClick = (modelId: string) => {
      console.debug('handleModelClick clicked:', modelId)
      console.debug('handleModelClick avail models: ', models)

      const defaultModel =
        models.OpenAI!.find(
          (model) =>
            model.id === 'gpt-4-from-canada-east' ||
            model.id === 'gpt-40-2024-05-13',
        ) || models[0]

      const model =
        Object.keys(models).reduce((foundModel: any, key: any) => {
          console.log('key:', key, 'models[key]:', models[key])
          return (
            foundModel || models[key]!.find((model) => model.id === modelId)
          )
        }, undefined) || defaultModel
      console.debug('handleModelClick SETTING IT TO: ', model)

      selectedConversation &&
        handleUpdateConversation(selectedConversation, {
          key: 'model',
          value: model as OpenAIModel,
        })
    }
    const selectedModelProvider = findProvider(selectedConversation?.model.id || defaultModelId!, models);

    return (
      <div
        className="flex h-full w-[100%] flex-col space-y-4 rounded-lg bg-[#1d1f33] p-4 dark:bg-[#1d1f33]"
        style={{ position: 'relative', zIndex: 100 }}
      >
        <div>
          <div className="flex flex-col">
            <ModelDropdown
              title="Select Model"
              value={selectedConversation?.model.id || defaultModelId}
              onChange={handleModelClick}
              models={{
                OpenAI: models.OpenAI,
                Ollama: models.Ollama,
                WebLLM: Object.values(webLLMModels).map((model) => ({
                  id: model.id,
                  name: model.name,
                  downloadSize: model.downloadSize,
                })),
                Anthropic: models.Anthropic,
              }}
              isSmallScreen={isSmallScreen}
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
            <Input.Description
              className={`ms-4 text-gray-400 ${montserrat_paragraph.variable} font-montserratParagraph`}
            >
              <Link
                href={'https://webgpureport.org/'}
                className="hover:underline"
              >
                Your browser must support WebGPU, check compatibility by
                visiting this page.
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

ModelItem.displayName = 'ModelItem'
ModelSelect.displayName = 'ModelSelect'