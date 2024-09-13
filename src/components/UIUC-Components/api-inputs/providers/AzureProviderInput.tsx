import React, { useEffect, useState } from 'react'
import {
  Text,
  Switch,
  Card,
  TextInput,
  Input,
  Button,
  ActionIcon,
} from '@mantine/core'
import {
  IconCheck,
  IconCopy,
  IconExternalLink,
  IconEye,
  IconEyeOff,
  IconX,
} from '@tabler/icons-react'
import { APIKeyInput } from '../APIKeyInputForm'
import { ModelToggles } from '../ModelToggles'
import { AzureProvider, ProviderNames } from '~/types/LLMProvider'
import { motion, AnimatePresence } from 'framer-motion'
import { notifications } from '@mantine/notifications'
import { FieldApi } from '@tanstack/react-form'

export default function AzureProviderInput({
  provider,
  form,
}: {
  provider: AzureProvider
  form: any
}) {
  return (
    <motion.div layout>
      <Card shadow="sm" p="lg" radius="md" className="w-[350px] bg-[#15162c]">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <a
              className="mb-3"
              href="https://azure.microsoft.com/en-us/products/cognitive-services/openai-service/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Text
                  size="lg"
                  weight={500}
                  mb="xs"
                  style={{ paddingRight: '8px' }}
                >
                  Azure OpenAI
                </Text>
                <IconExternalLink size={16} className="mb-3" />
              </div>
            </a>
          </div>
          <form.Field name={`providers.${ProviderNames.Azure}.enabled`}>
            {(field: any) => (
              <Switch
                size="md"
                labelPosition="left"
                onLabel="ON"
                offLabel="OFF"
                aria-label="Enable Azure OpenAI provider"
                checked={field.state.value}
                onChange={(event) => {
                  field.handleChange(event.currentTarget.checked)
                  // Trigger form submission
                  setTimeout(() => form.handleSubmit(), 0)
                }}
                thumbIcon={
                  field.state.value ? (
                    <IconCheck size="0.8rem" color="purple" stroke={3} />
                  ) : (
                    <IconX size="0.8rem" color="grey" stroke={3} />
                  )
                }
                styles={{
                  track: {
                    backgroundColor: field.state.value
                      ? '#6a29a4 !important'
                      : '#25262b',
                    borderColor: field.state.value
                      ? '#6a29a4 !important'
                      : '#25262b',
                  },
                }}
              />
            )}
          </form.Field>
        </div>
        {/* <Text size="sm" color="dimmed" mb="md">
          Azure OpenAI Service provides REST API access to OpenAI&apos;s
          powerful language models with the security and enterprise promise of
          Azure.
        </Text> */}
        {provider?.error &&
          (form.state.values?.providers?.Azure?.enabled ||
            provider.enabled) && (
            <Text
              size="sm"
              color="red"
              mb="md"
              style={{
                padding: '8px',
                borderRadius: '4px',
                backgroundColor: 'rgba(255, 0, 0, 0.1)',
                border: '1px solid rgba(255, 0, 0, 0.2)',
              }}
            >
              {provider.error}
            </Text>
          )}
        <form.Field name={`providers.${ProviderNames.Azure}.enabled`}>
          {(field: any) => (
            <AnimatePresence>
              {field.state.value && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <form.Field name={`providers.${ProviderNames.Azure}.apiKey`}>
                    {(field: any) => (
                      <AzureAPIKeyInput
                        field={field}
                        placeholder="Azure API Key"
                      />
                    )}
                  </form.Field>
                  <form.Field
                    name={`providers.${ProviderNames.Azure}.AzureEndpoint`}
                  >
                    {(field: any) => (
                      <TextInput
                        label="Azure Endpoint"
                        placeholder="https://your-resource-name.openai.azure.com/"
                        value={field.state.value}
                        onChange={(event) =>
                          field.handleChange(event.currentTarget.value)
                        }
                      />
                    )}
                  </form.Field>
                  <form.Field
                    name={`providers.${ProviderNames.Azure}.AzureDeployment`}
                  >
                    {(field: any) => (
                      <TextInput
                        label="Azure Deployment"
                        placeholder="your-deployment-name"
                        value={field.state.value}
                        onChange={(event) =>
                          field.handleChange(event.currentTarget.value)
                        }
                      />
                    )}
                  </form.Field>
                  <ModelToggles
                    form={form}
                    providerName={ProviderNames.Azure}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </form.Field>
      </Card>
    </motion.div>
  )
}

const AzureAPIKeyInput = ({
  field,
  placeholder,
}: {
  field: any
  placeholder: string
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [showCopiedToast, setShowCopiedToast] = useState(false)

  const isSpecialKey = field.state.value === '099edd1646f34a54a8bf9da279284e6e'

  const handleCopy = () => {
    if (isSpecialKey) {
      notifications.show({
        title: 'Cannot copy password',
        message:
          'This key is supplied by Gies Business School, it is secret and cannot be copied.',
        color: 'red',
      })
      return
    }
    navigator.clipboard.writeText(field.state.value)
    setShowCopiedToast(true)
    setTimeout(() => setShowCopiedToast(false), 4000)
  }

  const toggleVisibility = () => {
    if (isSpecialKey) {
      notifications.show({
        title: 'Cannot view password',
        message:
          'This key is supplied by Gies Business School, it is secret and cannot be viewed.',
        color: 'red',
      })
      return
    }
    setIsVisible(!isVisible)
  }

  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setError(null)
  }, [field.state.value])

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <Input.Wrapper id="API-key-input" label={placeholder}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <TextInput
            type={isVisible ? 'text' : 'password'}
            placeholder={placeholder}
            aria-label={placeholder}
            value={
              isSpecialKey ? '************************' : field.state.value
            }
            onChange={(e) => field.handleChange(e.target.value)}
            style={{ flex: 1 }}
            styles={{
              input: {
                color: 'white',
                padding: '8px',
                borderRadius: '4px',
              },
            }}
            readOnly={isSpecialKey}
          />
          <div
            style={{ display: 'flex', marginLeft: '6px', marginRight: '-2px' }}
          >
            <ActionIcon onClick={toggleVisibility} variant="subtle" size="sm">
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
            disabled={!field.state.value}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}

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
