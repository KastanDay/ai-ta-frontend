import React, { useEffect, useState, forwardRef } from 'react'
import {
  Button,
  Text,
  Slider,
  Card,
  Flex,
  Title,
  Stack,
  Input,
  ActionIcon,
  TextInput,
  Select,
  Group,
} from '@mantine/core'
import Image from 'next/image'
import { useQueryClient } from '@tanstack/react-query'
import { useForm, FieldApi } from '@tanstack/react-form'
import {
  useGetProjectLLMProviders,
  useSetProjectLLMProviders,
} from '~/hooks/useProjectAPIKeys'
import {
  AllLLMProviders,
  AnthropicProvider,
  AnySupportedModel,
  AzureProvider,
  LLMProvider,
  NCSAHostedProvider,
  NCSAHostedVLLMProvider,
  OllamaProvider,
  OpenAIProvider,
  ProjectWideLLMProviders,
  ProviderNames,
  WebLLMProvider,
} from '~/utils/modelProviders/LLMProvider'
import { notifications } from '@mantine/notifications'
import {
  IconAlertCircle,
  IconCheck,
  IconChevronDown,
  IconX,
} from '@tabler/icons-react'
import { GetCurrentPageName } from '../CanViewOnlyCourse'
import GlobalFooter from '../GlobalFooter'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import Navbar from '../navbars/Navbar'
import Head from 'next/head'
import OpenAIProviderInput from './providers/OpenAIProviderInput'
import AnthropicProviderInput from './providers/AnthropicProviderInput'
import AzureProviderInput from './providers/AzureProviderInput'
import OllamaProviderInput from './providers/OllamaProviderInput'
import WebLLMProviderInput from './providers/WebLLMProviderInput'
import NCSAHostedLLmsProviderInput from './providers/NCSAHostedProviderInput'
import NCSAHostedVLLMProviderInput from './providers/NCSAHostedVLLMProviderInput'
import { getModelLogo } from '~/components/Chat/ModelSelect'
import { t } from 'i18next'

const isSmallScreen = false

function FieldInfo({ field }: { field: FieldApi<any, any, any, any> }) {
  return (
    <>
      {field.state.meta.isTouched && field.state.meta.errors.length ? (
        <Text size="xs" color="red">
          {field.state.meta.errors.join(', ')}
        </Text>
      ) : null}
      {field.state.meta.isValidating ? (
        <Text size="xs">Validating...</Text>
      ) : null}
    </>
  )
}

export const APIKeyInput = ({
  field,
  placeholder,
}: {
  field: FieldApi<any, any, any, any>
  placeholder: string
}) => {
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setError(null)
  }, [field.state.value])

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <Input.Wrapper id="API-key-input" label={placeholder}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <TextInput
            type="password"
            placeholder={placeholder}
            aria-label={placeholder}
            value={field.state.value}
            onChange={(e) => {
              field.handleChange(e.target.value)
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                field.form.handleSubmit()
              }
            }}
            style={{ flex: 1 }}
            styles={{
              input: {
                color: 'white',
                padding: '8px',
                borderRadius: '4px',
              },
            }}
          />
          <ActionIcon
            size="xs"
            color="red"
            onClick={(e) => {
              e.preventDefault()
              field.handleChange('')
              field.form.handleSubmit()
            }}
            type="submit"
            style={{ marginLeft: '8px' }}
          >
            <IconX size={12} />
          </ActionIcon>
        </div>
      </Input.Wrapper>
      <FieldInfo field={field} />
      <div className="pt-1" />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {error && (
          <Text color="red" size="sm">
            {error}
          </Text>
        )}
        <div>
          <Button
            compact
            className="bg-purple-800 hover:border-indigo-600 hover:bg-indigo-600"
            onClick={() => {
              field.form.handleSubmit()
            }}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}

const NewModelDropdown: React.FC<{
  value: AnySupportedModel
  onChange: (model: AnySupportedModel) => Promise<void>
  llmProviders: AllLLMProviders
  isSmallScreen: boolean
}> = ({ value, onChange, llmProviders, isSmallScreen }) => {
  // Filter out providers that are not enabled and their models which are disabled
  const { enabledProvidersAndModels, allModels } = Object.keys(
    llmProviders,
  ).reduce(
    (
      acc: {
        enabledProvidersAndModels: Record<string, LLMProvider>
        allModels: AnySupportedModel[]
      },
      key,
    ) => {
      const provider = llmProviders[key as keyof typeof llmProviders]
      if (provider && provider.enabled) {
        const enabledModels =
          provider.models?.filter((model: { enabled: any }) => model.enabled) ||
          []
        if (enabledModels.length > 0) {
          // @ts-ignore -- Can't figure out why the types aren't perfect.
          acc.enabledProvidersAndModels[key as keyof typeof llmProviders] = {
            ...provider,
            models: enabledModels,
          }
          acc.allModels.push(
            ...enabledModels.map((model: any) => ({
              ...model,
              provider: provider.provider,
            })),
          )
        }
      }
      return acc
    },
    {
      enabledProvidersAndModels: {} as Record<string, LLMProvider>,
      allModels: [] as AnySupportedModel[],
    },
  )

  const selectedModel =
    allModels.find((model) => model.id === value?.id) || undefined

  return (
    <>
      <Select
        className="menu z-[50] w-full"
        size="md"
        placeholder="Select a model"
        searchable
        value={value?.id || ''}
        onChange={async (modelId) => {
          const selectedModel = allModels.find((model) => model.id === modelId)
          // console.log("selectedModel on change:", selectedModel);
          if (selectedModel) {
            await onChange(selectedModel)
          }
        }}
        data={Object.values(enabledProvidersAndModels).flatMap(
          (provider: LLMProvider) =>
            provider.models?.map((model) => ({
              value: model.id,
              label: model.name,
              // @ts-ignore -- this being missing is fine
              downloadSize: model?.downloadSize,
              modelId: model.id,
              selectedModelId: value,
              modelType: provider.provider,
              group: provider.provider,
              // @ts-ignore -- this being missing is fine
              vram_required_MB: model.vram_required_MB,
            })) || [],
        )}
        itemComponent={(props) => (
          <ModelItem {...props} setLoadingModelId={() => {}} />
        )}
        maxDropdownHeight={480}
        rightSectionWidth="auto"
        icon={
          selectedModel ? (
            <Image
              // @ts-ignore -- this being missing is fine
              src={getModelLogo(selectedModel.provider)}
              // @ts-ignore -- this being missing is fine
              alt={`${selectedModel.provider} logo`}
              width={20}
              height={20}
              style={{ marginLeft: '4px', borderRadius: '4px' }}
            />
          ) : null
        }
        rightSection={<IconChevronDown size="1rem" className="mr-2" />}
        classNames={{
          root: 'w-full',
          wrapper: 'w-full',
          input: `${montserrat_paragraph.variable} font-montserratParagraph ${isSmallScreen ? 'text-xs' : 'text-sm'} w-full`,
          rightSection: 'pointer-events-none',
          item: `${montserrat_paragraph.variable} font-montserratParagraph ${isSmallScreen ? 'text-xs' : 'text-sm'}`,
        }}
        styles={(theme) => ({
          input: {
            backgroundColor: 'rgb(107, 33, 168)',
            border: 'none',
            // color: theme.white,
            // borderRadius: theme.radius.md,
            // width: '24rem',
            // [`@media (max-width: 960px)`]: {
            //   width: '17rem', // Smaller width for small screens
            // },
          },
          dropdown: {
            backgroundColor: '#1d1f33',
            border: '1px solid rgba(42,42,120,1)',
            borderRadius: theme.radius.md,
            marginTop: '2px',
            boxShadow: theme.shadows.xs,
            width: '100%',
            maxWidth: '100%',
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
    </>
  )
}

interface ModelItemProps extends React.ComponentPropsWithoutRef<'div'> {
  label: string
  downloadSize?: string
  isDownloaded?: boolean
  modelId: string
  selectedModelId: string | undefined
  modelType: string
  vram_required_MB: number
}

export const ModelItem = forwardRef<
  HTMLDivElement,
  ModelItemProps & {
    loadingModelId: string | null
  }
>(
  (
    {
      label,
      downloadSize,
      isDownloaded,
      modelId,
      selectedModelId,
      modelType,
      vram_required_MB,
      loadingModelId,
      ...others
    }: ModelItemProps & {
      loadingModelId: string | null
    },
    ref,
  ) => {
    return (
      <>
        <div ref={ref} {...others}>
          <Group noWrap>
            <div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Image
                  src={getModelLogo(modelType) || ''}
                  alt={`${modelType} logo`}
                  width={20}
                  height={20}
                  style={{ marginRight: '8px', borderRadius: '4px' }}
                />
                {/* {selectedModelId === modelId ? (
                <IconCircleCheck stroke={2} />
              ) : (
                <IconCircleDashed stroke={2} />
              )} */}
                <Text size="sm" style={{ marginLeft: '8px' }}>
                  {label}
                </Text>
              </div>
            </div>
          </Group>
        </div>
      </>
    )
  },
)

export default function APIKeyInputForm() {
  const projectName = GetCurrentPageName()

  // ------------ <TANSTACK QUERIES> ------------
  const queryClient = useQueryClient()
  const {
    data: llmProviders,
    isLoading: isLoadingLLMProviders,
    isError: isErrorLLMProviders,
    error: errorLLMProviders,
    // enabled: !!projectName // Only run the query when projectName is available
  } = useGetProjectLLMProviders({ projectName: projectName })

  useEffect(() => {
    if (llmProviders) {
      form.reset()
    }
  }, [llmProviders])

  useEffect(() => {
    // handle errors
    if (isErrorLLMProviders) {
      showConfirmationToast({
        title: 'Error',
        message:
          'Failed your api keys. Our database must be having a bad day. Please refresh or try again later.',
        isError: true,
      })
    }
  }, [isErrorLLMProviders])

  const mutation = useSetProjectLLMProviders(queryClient)
  // ------------ </TANSTACK QUERIES> ------------

  const form = useForm({
    defaultValues: {
      ...llmProviders,
    },
    onSubmit: async ({ value }) => {
      const llmProviders = value as ProjectWideLLMProviders
      mutation.mutate(
        {
          projectName,
          queryClient,
          llmProviders,
        },
        {
          onSuccess: (data, variables, context) => {
            queryClient.invalidateQueries({
              queryKey: ['projectLLMProviders', projectName],
            })
            // showConfirmationToast({
            //   title: 'Updated LLM providers',
            //   message: `Now your project's users can use the supplied LLMs!`,
            // })
          },
          onError: (error, variables, context) =>
            showConfirmationToast({
              title: 'Error updating LLM providers',
              message: `Failed to update LLM providers with error: ${error.name} -- ${error.message}`,
              isError: true,
            }),
        },
      )
    },
  })

  return (
    <>
      <Navbar course_name={projectName} />

      <Head>
        <title>{projectName}/LLMs</title>
        <meta
          name="UIUC.chat"
          content="The AI teaching assistant built for students at UIUC."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="course-page-main min-w-screen flex min-h-screen flex-col items-center">
        <div className="items-left flex w-full flex-col justify-center py-0">
          <Flex
            direction="column"
            align="center"
            w="100%"
            className="mt-8 lg:mt-4"
          >
            <Card
              shadow="xs"
              padding="none"
              radius="xl"
              style={{ maxWidth: '90%', width: '100%', marginTop: '2%' }}
            >
              <Flex className="flex-col md:flex-row">
                <div
                  style={{
                    border: 'None',
                    color: 'white',
                  }}
                  className="min-h-full flex-[1_1_100%] bg-gradient-to-r from-purple-900 via-indigo-800 to-blue-800 md:flex-[1_1_70%]"
                >
                  <Flex
                    gap="md"
                    direction="column"
                    justify="flex-start"
                    align="flex-start"
                    className="lg:ml-8"
                  >
                    <Title
                      order={2}
                      variant="gradient"
                      align="left"
                      gradient={{ from: 'gold', to: 'white', deg: 50 }}
                      className={`pl-8 pt-8 ${montserrat_heading.variable} font-montserratHeading`}
                    >
                      {/* API Keys: Add LLMs to your Chatbot */}
                      Configure LLM Providers for your Chatbot
                    </Title>
                    <Title
                      className={`${montserrat_heading.variable} flex-[1_1_50%] font-montserratHeading`}
                      order={5}
                      px={18}
                      ml={'md'}
                      style={{ textAlign: 'left' }}
                    >
                      Configure which LLMs are available to you users. Enable or
                      disable models to balance price and performance.
                    </Title>
                    <Stack align="center" justify="start">
                      <form
                        onSubmit={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          form.handleSubmit()
                        }}
                      >
                        {/* Providers */}
                        <div
                          className="px-8 pb-8"
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 16,
                          }}
                        >
                          <>
                            <Title
                              className={`${montserrat_heading.variable} mt-4 font-montserratHeading`}
                              variant="gradient"
                              gradient={{
                                from: 'gold',
                                to: 'white',
                                deg: 170,
                              }}
                              order={3}
                            >
                              Closed source LLMs
                            </Title>
                            <Text
                              className={`pl-1 ${montserrat_paragraph.variable} font-montserratParagraph`}
                              size="md"
                            >
                              The best performers, but you gotta pay their
                              prices and follow their rules.
                            </Text>
                            <Flex
                              direction={{ base: 'column', '75rem': 'row' }}
                              wrap="wrap"
                              justify="space-between"
                              align="flex-start"
                              className="gap-4"
                              w={'100%'}
                            >
                              {' '}
                              <AnthropicProviderInput
                                provider={
                                  llmProviders?.providers
                                    .Anthropic as AnthropicProvider
                                }
                                form={form}
                                isLoading={isLoadingLLMProviders}
                              />
                              <OpenAIProviderInput
                                provider={
                                  llmProviders?.providers
                                    .OpenAI as OpenAIProvider
                                }
                                form={form}
                                isLoading={isLoadingLLMProviders}
                              />
                              <AzureProviderInput
                                provider={
                                  llmProviders?.providers.Azure as AzureProvider
                                }
                                form={form}
                                isLoading={isLoadingLLMProviders}
                              />
                            </Flex>
                            <Title
                              className={`-mb-3 ${montserrat_heading.variable} mt-4 font-montserratHeading`}
                              variant="gradient"
                              gradient={{
                                from: 'gold',
                                to: 'white',
                                deg: 170,
                              }}
                              order={3}
                            >
                              Open source LLMs
                            </Title>
                            <Text
                              className={`pl-1 ${montserrat_paragraph.variable} font-montserratParagraph`}
                              size="md"
                            >
                              Your weights, your rules.
                            </Text>
                            <Flex
                              direction={{ base: 'column', '75rem': 'row' }}
                              wrap="wrap"
                              justify="space-between"
                              align="flex-start"
                              className="gap-4"
                              w={'100%'}
                            >
                              {' '}
                              <NCSAHostedLLmsProviderInput
                                provider={
                                  llmProviders?.providers
                                    .NCSAHosted as NCSAHostedProvider
                                }
                                form={form}
                                isLoading={isLoadingLLMProviders}
                              />
                              <NCSAHostedVLLMProviderInput
                                provider={
                                  llmProviders?.providers
                                    .NCSAHostedVLLM as NCSAHostedVLLMProvider
                                }
                                form={form}
                                isLoading={isLoadingLLMProviders}
                              />
                              <OllamaProviderInput
                                provider={
                                  llmProviders?.providers
                                    .Ollama as OllamaProvider
                                }
                                form={form}
                                isLoading={isLoadingLLMProviders}
                              />
                              <WebLLMProviderInput
                                provider={
                                  llmProviders?.providers
                                    .WebLLM as WebLLMProvider
                                }
                                form={form}
                                isLoading={isLoadingLLMProviders}
                              />
                            </Flex>
                          </>
                        </div>
                      </form>
                    </Stack>
                  </Flex>
                </div>
                <div
                  className="flex flex-[1_1_100%] md:flex-[1_1_30%]"
                  style={{
                    // flex: isSmallScreen ? '1 1 100%' : '1 1 40%',
                    padding: '1rem',
                    backgroundColor: '#15162c',
                    color: 'white',
                  }}
                >
                  <div className="card flex h-full flex-col justify-center">
                    <div className="card-body">
                      <div className="pb-4">
                        <Title
                          className={`label ${montserrat_heading.variable} font-montserratHeading`}
                          variant="gradient"
                          gradient={{ from: 'gold', to: 'white', deg: 170 }}
                          order={3}
                        >
                          Default Model
                        </Title>
                        <br />
                        <Text
                          className={`pl-1 ${montserrat_paragraph.variable} font-montserratParagraph`}
                          size="md"
                        >
                          Choose the default model for your chatbot. Users can
                          still override this default to use any of the models
                          enabled on the left.
                        </Text>
                        <br />
                        <div className="flex justify-center">
                          {llmProviders && (
                            <form.Field name="defaultModel">
                              {(field) => (
                                <NewModelDropdown
                                  value={
                                    llmProviders.defaultModel as AnySupportedModel
                                  }
                                  onChange={(newDefaultModel) => {
                                    llmProviders.defaultModel =
                                      newDefaultModel as AnySupportedModel
                                    form.setFieldValue(
                                      'defaultModel',
                                      newDefaultModel as AnySupportedModel,
                                    )
                                    return form.handleSubmit()
                                  }}
                                  llmProviders={llmProviders.providers}
                                  isSmallScreen={false}
                                />
                              )}
                            </form.Field>
                          )}
                        </div>
                        <div className="pt-6"></div>
                        <div>
                          <form.Field name="defaultTemp">
                            {(field) => (
                              <>
                                <Text
                                  size="sm"
                                  weight={500}
                                  mb={4}
                                  className={`pl-1 ${montserrat_paragraph.variable} font-montserratParagraph`}
                                >
                                  Default Temperature:{' '}
                                  {llmProviders?.defaultTemp}
                                </Text>
                                <Text
                                  size="xs"
                                  color="dimmed"
                                  mt={4}
                                  className={`pl-1 ${montserrat_paragraph.variable} font-montserratParagraph`}
                                >
                                  We recommended using 0.1. Higher values
                                  increase randomness or &apos;creativity&apos;,
                                  lower force the model to stick to its normal
                                  behavior.
                                </Text>
                                <Slider
                                  value={llmProviders?.defaultTemp}
                                  onChange={async (newTemperature) => {
                                    field.handleChange(newTemperature)
                                  }}
                                  onChangeEnd={async (newTemperature) => {
                                    field.handleChange(newTemperature)
                                    await form.handleSubmit()
                                  }}
                                  min={0}
                                  max={1}
                                  step={0.1}
                                  precision={1}
                                  marks={[
                                    { value: 0, label: t('Precise') },
                                    { value: 0.5, label: t('Neutral') },
                                    { value: 1, label: t('Creative') },
                                  ]}
                                  showLabelOnHover
                                  color="grape"
                                  className="m-2"
                                  size={isSmallScreen ? 'xs' : 'md'}
                                  classNames={{
                                    markLabel: `mx-2 text-neutral-300 ${montserrat_paragraph.variable} font-montserratParagraph mt-2 ${isSmallScreen ? 'text-xs' : ''}`,
                                  }}
                                />
                                <FieldInfo field={field} />
                              </>
                            )}
                          </form.Field>
                        </div>
                        <div className="pt-2" />
                      </div>
                    </div>
                  </div>
                </div>
              </Flex>
            </Card>

            {/* SECTION: OTHER INFO, TBD */}
            {/* <div
              className="mx-auto mt-[2%] w-[90%] items-start rounded-2xl shadow-md shadow-purple-600"
              style={{ zIndex: 1, background: '#15162c' }}
            >
              <Flex direction="row" justify="space-between">
                <div className="flex flex-col items-start justify-start">
                  <Title
                    className={`${montserrat_heading.variable} font-montserratHeading`}
                    variant="gradient"
                    gradient={{
                      from: 'hsl(280,100%,70%)',
                      to: 'white',
                      deg: 185,
                    }}
                    order={3}
                    p="xl"
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Title
                      order={3}
                      pt={40}
                      // w={}
                      // size={'xl'}
                      className={`pb-3 pt-3 ${montserrat_paragraph.variable} font-montserratParagraph`}
                    >
                      OTHER INFO, TBD
                    </Title>
                  </Title>
                </div>
                <div className=" flex flex-col items-end justify-center">
                  
                </div>
              </Flex>
            </div> */}
          </Flex>
        </div>
        <GlobalFooter />
      </main>
    </>
  )
}

export const showConfirmationToast = ({
  title,
  message,
  isError = false,
}: {
  title: string
  message: string
  isError?: boolean
}) => {
  return (
    // docs: https://mantine.dev/others/notifications/

    notifications.show({
      id: 'confirmation-toast',
      withCloseButton: true,
      autoClose: 6000,
      title: title,
      message: message,
      icon: isError ? <IconAlertCircle /> : <IconCheck />,
      styles: {
        root: {
          backgroundColor: isError
            ? '#FEE2E2' // errorBackground
            : '#F9FAFB', // nearlyWhite
          borderColor: isError
            ? '#FCA5A5' // errorBorder
            : '#8B5CF6', // aiPurple
        },
        title: {
          color: '#111827', // nearlyBlack
        },
        description: {
          color: '#111827', // nearlyBlack
        },
        closeButton: {
          color: '#111827', // nearlyBlack
          '&:hover': {
            backgroundColor: '#F3F4F6', // dark[1]
          },
        },
      },
      loading: false,
    })
  )
}
ModelItem.displayName = 'ModelItem'
