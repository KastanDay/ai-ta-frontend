import React, { useEffect, useState } from 'react'
import {
  Button,
  Text,
  Card,
  Slider,
  Flex,
  Title,
  Stack,
  Input,
  ActionIcon,
  TextInput,
} from '@mantine/core'
import { useQueryClient } from '@tanstack/react-query'
import { useForm, FieldApi } from '@tanstack/react-form'
import {
  useGetProjectLLMProviders,
  useSetProjectLLMProviders,
} from '~/hooks/useProjectAPIKeys'
import {
  AnthropicProvider,
  AzureProvider,
  NCSAHostedProvider,
  OllamaProvider,
  OpenAIProvider,
  WebLLMProvider,
} from '~/types/LLMProvider'
import { notifications } from '@mantine/notifications'
import {
  IconAlertCircle,
  IconCheck,
  IconCopy,
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
import NCSAHostedLLmsProviderInput from './providers/NCSAHostedProviderInput'

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
  // onValidate,
}: {
  field: FieldApi<any, any, any, any>
  placeholder: string
  // onValidate: (apiKey: string) => Promise<void>
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [showCopiedToast, setShowCopiedToast] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(field.state.value)
    setShowCopiedToast(true)
    setTimeout(() => setShowCopiedToast(false), 4000)
  }

  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setError(null)
  }, [field.state.value])

  // const handleValidate = async () => {
  //   setIsValidating(true)
  //   setError(null)
  //   try {
  //     await onValidate(field.state.value)
  //   } catch (err: unknown) {
  //     if (err instanceof Error) {
  //       setError(err.message)
  //     } else {
  //       setError('An unknown error occurred')
  //     }
  //   } finally {
  //     setIsValidating(false)
  //   }
  // }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <Input.Wrapper id="API-key-input" label={placeholder}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <TextInput
            type={isVisible ? 'text' : 'password'}
            placeholder={placeholder}
            aria-label={placeholder}
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            style={{ flex: 1 }}
            styles={{
              input: {
                color: 'white',
                padding: '8px',
                borderRadius: '4px',
              },
            }}
          />
          <div
            style={{ display: 'flex', marginLeft: '6px', marginRight: '-2px' }}
          >
            <ActionIcon
              onClick={() => setIsVisible(!isVisible)}
              variant="subtle"
              size="sm"
            >
              {isVisible ? <IconEyeOff size={18} /> : <IconEye size={18} />}
            </ActionIcon>
            <div style={{ position: 'relative' }}>
              <ActionIcon onClick={handleCopy} variant="subtle" size="sm">
                <IconCopy size={18} />
              </ActionIcon>
              <AnimatePresence>
                {showCopiedToast && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.1 }}
                    style={{
                      position: 'absolute',
                      bottom: '100%',
                      right: 0,
                      backgroundColor: '#333',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      whiteSpace: 'nowrap',
                      zIndex: 1000,
                    }}
                  >
                    Copied ✓
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
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
            type="submit"
            // onClick={handleValidate}
            loading={isValidating}
            disabled={!field.state.value}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function APIKeyInputForm() {
  const course_name = GetCurrentPageName()

  // ------------ <TANSTACK QUERIES> ------------
  const queryClient = useQueryClient()
  const {
    data: llmProviders,
    isLoading: isLoadingLLMProviders,
    isError: isErrorLLMProviders,
    error: errorLLMProviders,
  } = useGetProjectLLMProviders(course_name)

  // TODO: TEMP HACK
  const defaultModel = 'tmp' // don't default... stay undefined
  const defaultTemp = 1.0 // default to 0.1

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
      providers: llmProviders,
      defaultModel: defaultModel,
      defaultTemperature: defaultTemp,
    },
    onSubmit: async ({ value }) => {
      console.log('onSubmit here: ', value)
      const llmProviders = value.providers || {}
      mutation.mutate(
        {
          course_name,
          queryClient,
          llmProviders,
          defaultModelID: (value.defaultModel || '').toString(),
          defaultTemperature: (value.defaultTemperature || '').toString(),
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
  console.log('form.state', JSON.stringify(form.state, null, 2))
  // if (isLoadingLLMProviders) {
  //   return (
  //     <div className="flex h-screen items-center justify-center">
  //       <Text>Loading...</Text>
  //     </div>
  //   )
  // }

  // if (isErrorLLMProviders) {
  //   return (
  //     <div className="flex h-screen items-center justify-center">
  //       <Text>
  //         Failed to load API keys. Please try again later.{' '}
  //         {errorLLMProviders?.message}
  //       </Text>
  //     </div>
  //   )
  // }

  // if the providers are empty, null, undefined, or an empty object, show error
  // if (
  //   !llmProviders ||
  //   llmProviders === null ||
  //   llmProviders === undefined ||
  //   Object.keys(llmProviders).length === 0
  // ) {
  //   console.log("llmProviders:", llmProviders)
  //   console.log("llmProviders type:", typeof llmProviders)
  //   // console.log("llmProviders keys:", Object.keys(llmProviders))
  //   return (
  //     <div className="flex h-screen items-center justify-center">
  //       <Text>Failed to load API keys. Please try again later. HEREEE</Text>
  //     </div>
  //   )
  // }

  return (
    <>
      <Navbar course_name={course_name} />

      <Head>
        <title>{course_name}/LLMs</title>
        <meta
          name="UIUC.chat"
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
              style={{ maxWidth: '90%', width: '100%', marginTop: '2%' }}
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
                      px={12}
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
                          px={18}
                          ml={'md'}
                          style={{ textAlign: 'left' }}
                        >
                          Configure your default settings and API keys for each
                          provider.
                        </Title>
                      </div>
                      {/* <Card
                        shadow="sm"
                        padding="lg"
                        radius="md"
                        style={{
                          width: 400,
                          backgroundColor: '#1c1c28',
                          color: 'white',
                          border: 'none',
                        }}
                      > */}
                      <form
                        onSubmit={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          form.handleSubmit()
                        }}
                      >
                        {/* Providers */}
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 16,
                            padding: '2rem',
                          }}
                        >
                          {llmProviders && !isLoadingLLMProviders && (
                            <>
                              <AnthropicProviderInput
                                provider={
                                  llmProviders.Anthropic as AnthropicProvider
                                }
                                form={form}
                              />
                              <OpenAIProviderInput
                                provider={llmProviders.OpenAI as OpenAIProvider}
                                form={form}
                              />
                              <AzureProviderInput
                                provider={llmProviders.Azure as AzureProvider}
                                form={form}
                              />
                              <OllamaProviderInput
                                provider={llmProviders.Ollama as OllamaProvider}
                                form={form}
                              />
                              <NCSAHostedLLmsProviderInput
                                provider={
                                  llmProviders.NCSAHosted as NCSAHostedProvider
                                }
                                form={form}
                              />
                              <WebLLMProviderInput
                                provider={llmProviders.WebLLM as WebLLMProvider}
                                form={form}
                              />
                            </>
                          )}
                        </div>

                        {/* <form.Subscribe
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
                              {isSubmitting
                                ? '...saving to DB....'
                                : 'Save Changes - TODO remove this button. Each has their own.'}
                            </Button>
                          )}
                        </form.Subscribe> */}
                      </form>
                      {/* </Card> */}
                    </Stack>
                  </Flex>
                </div>
                {/* <div
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
                <div>
                  {llmProviders && (
                    <ModelDropdown
                      value={form.getFieldValue('defaultModel')}
                      onChange={
                        // async (modelId) => {
                        // // if (state.webLLMModelIdLoading) {
                        // //   setLoadingModelId(modelId)
                        // //   console.log('model is loading', state.webLLMModelIdLoading.id)
                        // // }
                        // await handleModelClick(modelId)
                        async (modelId) => {
                          // TODO
                          // handleModelClick(modelId)
                        }
                      }
                      models={{
                        Ollama: llmProviders.Ollama?.models?.filter(
                          (model) => model.enabled,
                        ),
                        OpenAI: llmProviders.OpenAI?.models?.filter(
                          (model) => model.enabled,
                        ),
                        Anthropic:
                          llmProviders.Anthropic?.models?.filter(
                            (model) => model.enabled,
                          ),
                        Azure: llmProviders.Azure?.models?.filter(
                          (model) => model.enabled,
                        ),
                      }}
                      // isSmallScreen={isSmallScreen}
                      // loadingModelId={loadingModelId}
                      // setLoadingModelId={setLoadingModelId}
                      // chat_ui={chat_ui}
                      isSmallScreen={false}
                      loadingModelId={'test'}
                      setLoadingModelId={(id: string | null) => {
                }}
                state={{
                  webLLMModelIdLoading: {
                    id: 'test',
                    isLoading: false,
                  },
                }}
                showWebLLmModels={false}
                    />
                  )}
              </div>

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
      </div >
    </div > */}
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
