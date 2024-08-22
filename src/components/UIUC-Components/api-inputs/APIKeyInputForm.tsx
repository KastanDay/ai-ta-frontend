import React from 'react'
import { Button, Text, Switch, Select, Tabs, Card, Slider } from '@mantine/core'
import { useQueryClient } from '@tanstack/react-query'
import { useForm, FieldApi } from '@tanstack/react-form'
import {
  useGetProjectLLMProviders,
  useSetProjectLLMProviders,
} from '~/hooks/userAPIKeys'
import { LLMProvider } from '~/types/LLMProvider'

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

export default function APIKeyInputForm() {
  const queryClient = useQueryClient()
  const course_name = 'your_course_name_here' // TODO Replace with actual course name

  const { data: initialProviders, isLoading } =
    useGetProjectLLMProviders(course_name)

  console.log('initialProviders', JSON.stringify(initialProviders, null, 2))

  const mutation = useSetProjectLLMProviders(
    course_name,
    queryClient,
    initialProviders || [],
  )

  const form = useForm({
    defaultValues: {
      providers: initialProviders || [],
      defaultModel: '',
      temperature: 0.1,
    },
    onSubmit: async ({ value }) => {
      console.log('Submitting', value)
      // TODO
      // await mutation.mutateAsync(value.providers);
    },
  })

  if (isLoading) {
    return <Text>Loading...</Text>
  }

  console.log('form', JSON.stringify(form, null, 2))

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
        Settings
      </Text>
      <Text size="sm" color="dimmed" mb="md">
        Manage your LLM providers and API keys
      </Text>
      <form>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
        >
          <Tabs
            defaultValue="model"
            variant="outline"
            styles={(theme) => ({
              tab: {
                backgroundColor: '#2d2d3d',
                color: 'white',
                '&[data-active]': {
                  backgroundColor: '#4a4a5e',
                },
              },
              tabsList: {
                borderBottom: 'none',
              },
            })}
          >
            <Tabs.List grow>
              <Tabs.Tab value="model">Model</Tabs.Tab>
              <Tabs.Tab value="providers">Providers</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="model" pt="xs">
              <div
                style={{
                  marginTop: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                }}
              >
                <div>
                  <Text size="sm" weight={500} mb={4}>
                    Default Model
                  </Text>
                  <form.Field
                    name="defaultModel"
                    children={(field) => (
                      <Select
                        value={field.state.value}
                        onChange={(value) => field.handleChange(value)}
                        data={form.getFieldValue('providers').flatMap(
                          (provider: LLMProvider) =>
                            provider.models?.map((model) => ({
                              value: `${provider.provider}:${model.id}`,
                              label: `${provider.provider} - ${model.name}`,
                            })) || [],
                        )}
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
                  />
                </div>
                <div>
                  <Text size="sm" weight={500} mb={4}>
                    Temperature: {form.getFieldValue('temperature')}
                  </Text>
                  <form.Field
                    name="temperature"
                    children={(field) => (
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
                  />
                  <Text size="xs" color="dimmed" mt={4}>
                    Higher values will make the output more random, while lower
                    values will make it more focused and deterministic.
                  </Text>
                </div>
              </div>
            </Tabs.Panel>

            <Tabs.Panel value="providers" pt="xs">
              <div
                style={{
                  marginTop: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                }}
              >
                <form.Field name="providers">
                  {(field) => (
                    <>
                      {field.state.value.map(
                        (provider: LLMProvider, index: number) => (
                          <div key={provider.provider}>
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 8,
                              }}
                            >
                              <Text size="sm" weight={500}>
                                {provider.provider}
                              </Text>
                              <form.Field
                                name={`providers.${index}.enabled`}
                                children={(field) => (
                                  <Switch
                                    checked={field.state.value}
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
                              />
                            </div>
                            {provider.enabled && (
                              <>
                                {provider.provider === 'OpenAI' && (
                                  <form.Field
                                    name={`providers.${index}.apiKey`}
                                    children={(field) => (
                                      <>
                                        <input
                                          placeholder="OpenAI API Key"
                                          value={field.state.value}
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
                                          }}
                                        />
                                        <FieldInfo field={field} />
                                      </>
                                    )}
                                  />
                                )}
                                {provider.provider === 'Azure' && (
                                  <>
                                    <form.Field
                                      name={`providers.${index}.AzureEndpoint`}
                                      children={(field) => (
                                        <>
                                          <input
                                            placeholder="Azure Endpoint"
                                            value={field.state.value}
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
                                              marginTop: '8px',
                                            }}
                                          />
                                          <FieldInfo field={field} />
                                        </>
                                      )}
                                    />
                                    <form.Field
                                      name={`providers.${index}.AzureDeployment`}
                                      children={(field) => (
                                        <>
                                          <input
                                            placeholder="Azure Deployment"
                                            value={field.state.value}
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
                                              marginTop: '8px',
                                            }}
                                          />
                                          <FieldInfo field={field} />
                                        </>
                                      )}
                                    />
                                  </>
                                )}
                                {provider.provider === 'Ollama' && (
                                  <form.Field
                                    name={`providers.${index}.baseUrl`}
                                    children={(field) => (
                                      <>
                                        <input
                                          placeholder="Ollama Base URL"
                                          value={field.state.value}
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
                                            marginTop: '8px',
                                          }}
                                        />
                                        <FieldInfo field={field} />
                                      </>
                                    )}
                                  />
                                )}
                                {provider.error && (
                                  <Text size="xs" color="red" mt={4}>
                                    {provider.error}
                                  </Text>
                                )}
                              </>
                            )}
                          </div>
                        ),
                      )}
                    </>
                  )}
                </form.Field>
              </div>
            </Tabs.Panel>
          </Tabs>
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
              <Button
                type="submit"
                fullWidth
                disabled={!canSubmit}
                style={{
                  marginTop: 16,
                  backgroundColor: '#9333ea',
                  '&:hover': { backgroundColor: '#7e22ce' },
                }}
              >
                {isSubmitting ? '...' : 'Save Changes'}
              </Button>
            )}
          />
        </form>
      </form>
    </Card>
  )
}
