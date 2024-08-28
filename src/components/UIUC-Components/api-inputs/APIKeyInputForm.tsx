import React, { useEffect, useState } from 'react'
import {
  Button,
  Text,
  Switch,
  Select,
  Tabs,
  Card,
  Slider,
  MantineTheme,
} from '@mantine/core'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, FieldApi, FieldMeta } from '@tanstack/react-form'
import {
  useGetProjectDefaultModel,
  useGetProjectLLMProviders,
  useSetProjectLLMProviders,
} from '~/hooks/useProjectAPIKeys'
import {
  AllLLMProviders,
  LLMProvider,
  ProviderNames,
} from '~/types/LLMProvider'
import upsertCourseMetadataReactQuery from '~/pages/api/UIUC-api/upsertCourseMetadataReactQuery'
import { errorToast } from '~/components/Chat/Chat'
import { notifications } from '@mantine/notifications'
import {
  IconAlertCircle,
  IconCheck,
  IconEye,
  IconEyeOff,
} from '@tabler/icons-react'
import { title } from 'process'
import { GetCurrentPageName } from '../CanViewOnlyCourse'

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

const APIKeyInput = ({
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
        value={field.state.value}
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
    apiKey: '',
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
      await mutation.mutateAsync({
        course_name,
        queryClient,
        llmProviders: value.providers,
        defaultModelID: value.defaultModel.toString(),
        defaultTemperature: value.defaultTemperature.toString(),
      })
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
  // console.log('defaultModelOptions', defaultModelOptions)
  // console.log(
  //   'providers from FORM',
  //   Object.values(form.getFieldValue('providers')),
  // )

  return (
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
      <Text size="xl" weight={700} mb="xs">
        LLM Configuration
      </Text>
      <Text size="sm" color="dimmed" mb="md">
        Configure your default settings and API keys for each provider.
      </Text>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Default Model */}
          <div>
            <Text size="sm" weight={500} mb={4}>
              Default Model
            </Text>
            <form.Field name="defaultModel">
              {(field) => (
                <Select
                  value={field.state.value}
                  onChange={(value) => field.handleChange(value || '')}
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
              )}
            </form.Field>
          </div>

          {/* Temperature */}
          <div>
            <Text size="sm" weight={500} mb={4}>
              Default Temperature: {form.getFieldValue('defaultTemperature')}
            </Text>
            <form.Field name="defaultTemperature">
              {(field) => (
                <Slider
                  value={field.state.value}
                  onChange={(value) => field.handleChange(value)}
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
              )}
            </form.Field>
            <Text size="xs" color="dimmed" mt={4}>
              Higher values increase randomness, lower values increase focus and
              determinism.
            </Text>
          </div>

          {/* Providers */}
          <Text size="xl" weight={700} mb="xs">
            LLM Providers
          </Text>

          {Object.entries(llmProviders || {}).map(
            ([providerName, provider]) => (
              <div key={providerName}>
                <Text size="sm" weight={500} mb={4}>
                  {providerName}
                </Text>

                {/* API Key Input */}
                {providerName !== 'WebLLM' && (
                  <form.Field name={`providers.${providerName}.apiKey`}>
                    {(field) => (
                      <APIKeyInput
                        field={field}
                        placeholder={`${providerName} API Key`}
                      />
                    )}
                  </form.Field>
                )}

                {/* Base URL Input (for Ollama) */}
                {providerName === 'Ollama' && (
                  <form.Field name={`providers.${providerName}.baseUrl`}>
                    {(field) => (
                      <input
                        placeholder={`${providerName} Base URL`}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
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
                    )}
                  </form.Field>
                )}

                {/* Azure-specific fields */}
                {providerName === 'Azure' && (
                  <>
                    <form.Field
                      name={`providers.${providerName}.AzureEndpoint`}
                    >
                      {(field) => (
                        <input
                          placeholder="Azure Endpoint"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
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
                      )}
                    </form.Field>
                    <form.Field
                      name={`providers.${providerName}.AzureDeployment`}
                    >
                      {(field) => (
                        <input
                          placeholder="Azure Deployment"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
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
                      )}
                    </form.Field>
                  </>
                )}

                {/* Model Toggles */}
                {provider.models &&
                  provider.models.map((model) => (
                    <form.Field
                      key={model.id}
                      name={`providers.${providerName}.models.${model.id}.enabled`}
                    >
                      {(field) => (
                        <Switch
                          label={model.name}
                          checked={field.state.value}
                          onChange={(event) =>
                            field.handleChange(event.currentTarget.checked)
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
                  ))}
              </div>
            ),
          )}
        </div>

        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
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
