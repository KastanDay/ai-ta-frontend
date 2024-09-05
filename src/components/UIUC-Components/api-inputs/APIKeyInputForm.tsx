import React, { useEffect, useState } from 'react'
import {
  Button,
  Text,
  Switch,
  Select,
  Card,
  Slider,
  Flex,
  Title,
  Stack,
} from '@mantine/core'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, FieldApi, FieldMeta } from '@tanstack/react-form'
import {
  useGetProjectDefaultModel,
  useGetProjectLLMProviders,
  useSetProjectLLMProviders,
} from '~/hooks/useProjectAPIKeys'
import { AllLLMProviders, ProviderNames } from '~/types/LLMProvider'
import { notifications } from '@mantine/notifications'
import {
  IconAlertCircle,
  IconCheck,
  IconExternalLink,
  IconEye,
  IconEyeOff,
} from '@tabler/icons-react'
import { GetCurrentPageName } from '../CanViewOnlyCourse'
import { AnimatePresence, motion } from 'framer-motion'
import GlobalFooter from '../GlobalFooter'
import { montserrat_heading, montserrat_paragraph } from 'fonts'
import Navbar from '../navbars/Navbar'
import Head from 'next/head'
import OpenAIProviderInput from './providers/OpenAIProviderInput'
import AnthropicProviderInput from './providers/AnthropicProviderInput'
import AzureProviderInput from './providers/AzureProviderInput'
import OllamaProviderInput from './providers/OllamaProviderInput'
import WebLLMProviderInput from './providers/WebLLMProviderInput'

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
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        type={isVisible ? 'text' : 'password'}
        placeholder={placeholder}
        value={field.value}
        onChange={(e) => field.handleChange(e.target.value)}
        style={{
          backgroundColor: '#2d2d3d',
          borderColor: '#4a4a5e',
          color: 'white',
          padding: '8px',
          borderRadius: '4px',
          width: '100%',
          paddingRight: '70px',
        }}
      />
      <Button
        onClick={() => setIsVisible(!isVisible)}
        style={{
          position: 'absolute',
          right: '8px',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          zIndex: 1,
        }}
      >
        {isVisible ? <IconEyeOff size={16} /> : <IconEye size={16} />}
      </Button>
      <FieldInfo field={field} />
    </div>
  )
}

type FieldMetaWithVisibility = FieldMeta & { isVisible?: boolean }

const loadingTextLLMProviders: AllLLMProviders = {
  Ollama: {
    provider: ProviderNames.Ollama,
    enabled: false,
    baseUrl: 'Loading...',
    models: [],
  },
  OpenAI: {
    provider: ProviderNames.OpenAI,
    enabled: false,
    apiKey: 'Loading...',
  },
  WebLLM: { provider: ProviderNames.WebLLM, enabled: false },
  Azure: {
    provider: ProviderNames.Azure,
    enabled: false,
    AzureEndpoint: 'Loading...',
    AzureDeployment: 'Loading...',
    apiKey: 'Loading...',
  },
  Anthropic: {
    provider: ProviderNames.Anthropic,
    enabled: false,
    apiKey: 'Loading...',
  },
}

export default function APIKeyInputForm() {
  const course_name = GetCurrentPageName()

  // ------------ <TANSTACK QUERIES> ------------
  const queryClient = useQueryClient()
  const {
    data: llmProviders,
    isLoading: isLoadingLLMProviders,
    isError: isErrorLLMProviders,
  } = useGetProjectLLMProviders(course_name)

  const {
    data: defaultModelData,
    isLoading: isLoadingDefaultModel,
    isError: isErrorDefaultModel,
  } = useGetProjectDefaultModel(course_name)
  const defaultModel = defaultModelData?.defaultModel ?? '' // don't default... stay undefined
  const defaultTemp = defaultModelData?.defaultTemp ?? 0.1 // default to 0.1

  useEffect(() => {
    // handle errors
    if (isErrorDefaultModel) {
      showConfirmationToast({
        title: 'Error',
        message:
          'Failed to fetch default model. Our database must be having a bad day. Please refresh or try again later.',
        isError: true,
      })
    }
  }, [isErrorDefaultModel])

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
      providers: llmProviders || loadingTextLLMProviders,
      defaultModel: defaultModel || 'Loading...',
      defaultTemperature: defaultTemp || NaN,
    },
    onSubmit: async ({ value }) => {
      console.log('onSubmit here: ', value)
      mutation.mutate(
        {
          course_name,
          queryClient,
          llmProviders: value.providers,
          defaultModelID: value.defaultModel.toString(),
          defaultTemperature: value.defaultTemperature.toString(),
        },
        {
          onSuccess: (data, variables, context) =>
            showConfirmationToast({
              title: 'Updated LLM providers',
              message: `Now your project's users can use the supplied LLMs!`,
            }),
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

  console.log('llmProviders', JSON.stringify(llmProviders, null, 2))

  const defaultModelOptions = Object.entries(llmProviders || {}).flatMap(
    ([providerName, provider]) =>
      provider.models?.map((model) => ({
        value: `${providerName}:${model.id}`,
        label: `${providerName} - ${model.name}`,
      })) || [],
  )

  return (
    <>
      <Navbar course_name={course_name} />

      <Head>
        <title>{course_name}</title>
        <meta
          name="description"
          content="The AI teaching assistant built for students at UIUC."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="course-page-main min-w-screen flex min-h-screen flex-col items-center">
        <div className="items-left flex w-full flex-col justify-center py-0">
          <Flex direction="column" align="center" w="100%">
            <Card
              shadow="xs"
              padding="none"
              radius="xl"
              style={{ maxWidth: '85%', width: '100%', marginTop: '4%' }}
            >
              <Flex className="flex-col md:flex-row">
                {/* // direction={isSmallScreen ? 'column' : 'row'}> */}
                <div
                  style={{
                    // flex: isSmallScreen ? '1 1 100%' : '1 1 60%',
                    border: 'None',
                    color: 'white',
                  }}
                  className="min-h-full flex-[1_1_100%] bg-gradient-to-r from-purple-900 via-indigo-800 to-blue-800 md:flex-[1_1_60%]"
                >
                  <Flex gap="md" direction="column">
                    <Title
                      order={2}
                      pt={43}
                      variant="gradient"
                      align="center"
                      gradient={{ from: 'gold', to: 'white', deg: 50 }}
                      className={`${montserrat_heading.variable} font-montserratHeading`}
                    >
                      API Keys &amp; Project Defaults
                    </Title>
                    <Stack align="center" justify="start">
                      <div className="flex flex-col lg:flex-row">
                        <Title
                          className={`${montserrat_heading.variable} flex-[1_1_50%] font-montserratHeading`}
                          order={5}
                          w={'100%'}
                          ml={'md'}
                          style={{ textAlign: 'left' }}
                        >
                          Configure your default settings and API keys for each
                          provider.
                        </Title>
                      </div>
                      <Card
                        shadow="sm"
                        padding="lg"
                        radius="md"
                        style={{
                          width: 400,
                          backgroundColor: '#1c1c28',
                          color: 'white',
                          border: 'none',
                        }}
                      >
                        <form
                          onSubmit={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 16,
                            }}
                          >
                            {/* Providers */}
                            <Text size="xl" weight={700} mb="xs">
                              LLM Providers
                            </Text>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>


          {Object.entries(llmProviders || {}).map(([providerName, provider]) => (
            <div key={providerName}>
              {providerName === 'OpenAI' && (
                <OpenAIProviderInput 
                  provider={provider} 
                  form={form} 
                  providerName={providerName} 
                />
              )}
              {providerName === 'Ollama' && (
                <OllamaProviderInput 
                  provider={provider} 
                  form={form} 
                  providerName={providerName} 
                />
              )}
              {providerName === 'WebLLM' && (
                <WebLLMProviderInput 
                  provider={provider} 
                  form={form} 
                  providerName={providerName} 
                />
              )}
              {providerName === 'Azure' && (
                <AzureProviderInput 
                  provider={provider} 
                  form={form} 
                  providerName={providerName} 
                />
              )}
              {providerName === 'Anthropic' && (
                <AnthropicProviderInput 
                  provider={provider} 
                  form={form} 
                  providerName={providerName} 
                />
              )}
            </div>
          ))}
        </div>
                            {/*
                            {Object.entries(llmProviders || {}).map(
                              ([providerName, provider]) => (
                                <div key={providerName}>
                                  <div
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      marginBottom: '8px',  
                                    }}
                                  >
                                    <Text size="sm" weight={500}>
                                      {providerName}
                                    </Text>
                                    <form.Field
                                      name={
                                        `providers.${providerName}.enabled` as `providers.${keyof AllLLMProviders}.enabled`
                                      }
                                    >
                                      {(field) => (
                                        <Switch
                                          checked={field.state.value as boolean}
                                          onChange={(event) =>
                                            field.handleChange(
                                              event.currentTarget.checked,
                                            )
                                          }
                                          styles={(theme) => ({
                                            track: {
                                              backgroundColor: field.state.value
                                                ? theme.colors.blue[6]
                                                : theme.colors.gray[5],
                                            },
                                          })}
                                        />
                                      )}
                                    </form.Field>
                                  </div> */}

                                  {/* API Key Input */}
                                  {/* {providerName !== 'WebLLM' && (
                                    <form.Field
                                      name={
                                        `providers.${providerName}.apiKey` as `providers.${keyof AllLLMProviders}.apiKey`
                                      }
                                    >
                                      {(field) => (
                                        <>
                                          <APIKeyInput
                                            field={field}
                                            placeholder={`${providerName} API Key`}
                                          />
                                        </>
                                      )}
                                    </form.Field>
                                  )} */}

                                  {/* Base URL Input (for Ollama) */}
                                  {/* {providerName === 'Ollama' && (
                                    <form.Field
                                      name={
                                        `providers.${providerName}.baseUrl` as `providers.${keyof AllLLMProviders}.baseUrl`
                                      }
                                    >
                                      {(field) => (
                                        <>
                                          <input
                                            placeholder={`${providerName} Base URL`}
                                            value={field.state.value as string}
                                            onChange={(e) =>
                                              field.handleChange(e.target.value)
                                            }
                                            style={{
                                              backgroundColor: '#2d2d3d',
                                              borderColor: '#4a4a5e',
                                              color: 'white',
                                              padding: '8px',
                                              borderRadius: '4px',
                                              width: '100%',
                                              marginBottom: '8px',
                                            }}
                                          />
                                        </>
                                      )}
                                    </form.Field>
                                  )} */}

                                  {/* Azure-specific fields */}
                                  {/* {providerName === 'Azure' && (
                                    <>
                                      <form.Field
                                        name={
                                          `providers.${providerName}.AzureEndpoint` as `providers.${keyof AllLLMProviders}.AzureEndpoint`
                                        }
                                      >
                                        {(field) => (
                                          <>
                                            <input
                                              placeholder="Azure Endpoint"
                                              value={
                                                field.state.value as string
                                              }
                                              onChange={(e) =>
                                                field.handleChange(
                                                  e.target.value,
                                                )
                                              }
                                              style={{
                                                backgroundColor: '#2d2d3d',
                                                borderColor: '#4a4a5e',
                                                color: 'white',
                                                padding: '8px',
                                                borderRadius: '4px',
                                                width: '100%',
                                                marginBottom: '8px',
                                              }}
                                            />
                                          </>
                                        )}
                                      </form.Field>
                                      <form.Field
                                        name={
                                          `providers.${providerName}.AzureDeployment` as `providers.${keyof AllLLMProviders}.AzureDeployment`
                                        }
                                      >
                                        {(field) => (
                                          <>
                                            <input
                                              placeholder="Azure Deployment"
                                              value={
                                                field.state.value as string
                                              }
                                              onChange={(e) =>
                                                field.handleChange(
                                                  e.target.value,
                                                )
                                              }
                                              style={{
                                                backgroundColor: '#2d2d3d',
                                                borderColor: '#4a4a5e',
                                                color: 'white',
                                                padding: '8px',
                                                borderRadius: '4px',
                                                width: '100%',
                                                marginBottom: '8px',
                                              }}
                                            />
                                          </>
                                        )}
                                      </form.Field>
                                    </>
                                  )} */}

                                  {/* Model Toggles */}
                                  {/* <form.Field
                                    name={
                                      `providers.${providerName}.enabled` as `providers.${keyof AllLLMProviders}.enabled`
                                    }
                                  >
                                    {(enabledField) => (
                                      <AnimatePresence>
                                        {enabledField.state.value && (
                                          <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{
                                              opacity: 1,
                                              height: 'auto',
                                            }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.3 }}
                                          >
                                            {provider.models &&
                                              provider.models.map((model) => (
                                                <form.Field
                                                  key={model.id}
                                                  name={
                                                    `providers.${providerName}.models.${model.id}.enabled` as `providers.${keyof AllLLMProviders}.models.${string}.enabled`
                                                  }
                                                >
                                                  {(field) => (
                                                    <Switch
                                                      label={model.name}
                                                      checked={
                                                        field.state
                                                          .value as boolean
                                                      }
                                                      onChange={(event) =>
                                                        field.handleChange(
                                                          event.currentTarget
                                                            .checked,
                                                        )
                                                      }
                                                      styles={(theme) => ({
                                                        track: {
                                                          backgroundColor: field
                                                            .state.value
                                                            ? theme.colors
                                                              .blue[6]
                                                            : theme.colors
                                                              .gray[5],
                                                        },
                                                      })}
                                                    />
                                                  )}
                                                </form.Field>
                                              ))}
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    )}
                                  </form.Field>
                                </div>
                              ),
                            )} */}
                          </div>

                          <form.Subscribe
                            selector={(state) => [
                              state.canSubmit,
                              state.isSubmitting,
                            ]}
                          >
                            {([canSubmit, isSubmitting]) => (
                              <Button
                                type="submit"
                                fullWidth
                                disabled={!canSubmit}
                                sx={(theme) => ({
                                  marginTop: 16,
                                  backgroundColor: '#9333ea',
                                  '&:hover': { backgroundColor: '#7e22ce' },
                                })}
                              >
                                {isSubmitting ? '...' : 'Save Changes'}
                              </Button>
                            )}
                          </form.Subscribe>
                        </form>
                      </Card>
                    </Stack>
                  </Flex>
                </div>
                <div
                  className="flex flex-[1_1_100%] md:flex-[1_1_40%]"
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
                          // className={`label ${montserrat.className}`}
                          className={`label ${montserrat_heading.variable} font-montserratHeading`}
                          variant="gradient"
                          gradient={{ from: 'gold', to: 'white', deg: 170 }}
                          order={3}
                        >
                          Default Model
                        </Title>
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 16,
                          }}
                        >
                          {/* Default Model */}
                          <div>
                            <Text size="sm" weight={500} mb={4}>
                              Default Model
                            </Text>
                            <form.Field name="defaultModel">
                              {(field) => (
                                <>
                                  <Select
                                    value={field.state.value}
                                    onChange={(value) =>
                                      field.handleChange(value || '')
                                    }
                                    data={defaultModelOptions}
                                    styles={(theme) => ({
                                      input: {
                                        backgroundColor: '#2d2d3d',
                                        borderColor: '#4a4a5e',
                                        color: 'white',
                                      },
                                      item: {
                                        '&[data-selected]': {
                                          backgroundColor: theme.fn.variant({
                                            variant: 'filled',
                                            color: theme.primaryColor,
                                          }).background,
                                          color: theme.white,
                                        },
                                      },
                                    })}
                                  />
                                </>
                              )}
                            </form.Field>
                          </div>

                          {/* Temperature */}
                          <div>
                            <Text size="sm" weight={500} mb={4}>
                              Default Temperature:{' '}
                              {form.getFieldValue('defaultTemperature')}
                            </Text>
                            <form.Field name="defaultTemperature">
                              {(field) => (
                                <>
                                  <Slider
                                    value={field.state.value}
                                    onChange={(value) =>
                                      field.handleChange(value)
                                    }
                                    min={0}
                                    max={1}
                                    step={0.1}
                                    label={null}
                                    styles={(theme) => ({
                                      track: {
                                        backgroundColor: theme.colors.gray[2],
                                      },
                                      thumb: {
                                        borderWidth: 2,
                                        padding: 3,
                                      },
                                    })}
                                  />
                                </>
                              )}
                            </form.Field>
                            <Text size="xs" color="dimmed" mt={4}>
                              Higher values increase randomness, lower values
                              increase focus and determinism.
                            </Text>
                          </div>
                        </div>

                        <div className="pt-2" />
                      </div>
                    </div>
                  </div>
                </div>
              </Flex>
            </Card>

            <div
              // Course files header/background
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
                  {/* Can add more buttons here */}
                  {/* <Button className={`${montserrat_paragraph.variable} font-montserratParagraph ${classes.downloadButton}`} rightIcon={isLoading ? <LoadingSpinner size="sm" /> : <IconCloudDownload />}
                    onClick={() => downloadConversationHistory(course_name)}>
                    Download Conversation History
                  </Button> */}
                </div>
              </Flex>
            </div>
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
      onClose: () => console.log('unmounted'),
      onOpen: () => console.log('mounted'),
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
