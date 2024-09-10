import React from 'react'
import { Text, Switch, Card, Skeleton } from '@mantine/core'
import { IconCheck, IconExternalLink, IconX } from '@tabler/icons-react'
import { APIKeyInput } from '../APIKeyInputForm'
import { ModelToggles } from '../ModelToggles'
import { AnthropicProvider } from '~/types/LLMProvider'
import { AnthropicModel } from '~/utils/modelProviders/anthropic'
import { motion, AnimatePresence } from 'framer-motion'

export default function AnthropicProviderInput({
  provider,
  form,
  providerName,
}: {
  provider: AnthropicProvider
  form: any
  providerName: string
}) {
  const validateApiKey = async (apiKey: string) => {
    if (!apiKey) throw new Error('API key is empty')
    const response = await fetch('/api/UIUC-api/llmProviders', {
      method: 'POST',
      body: JSON.stringify({
        courseName: 'test',
        llmProviders: { anthropic: { apiKey } },
      }),
    })
    if (!response.ok) {
      throw new Error('Invalid API key')
    }
  }

  return (
    <motion.div layout>
      <Card shadow="sm" p="lg" radius="md" className="bg-[#15162c]">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Text
              size="lg"
              weight={500}
              mb="xs"
              style={{ paddingRight: '8px' }}
            >
              Anthropic
            </Text>
            <a
              className="mb-3"
              href="https://www.anthropic.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <IconExternalLink size={16} />
            </a>
          </div>
          <form.Field name={`providers.${providerName}.enabled`}>
            {(field: any) => (
              <Switch
                size="md"
                labelPosition="left"
                onLabel="ON"
                offLabel="OFF"
                aria-label="Enable Anthropic provider"
                checked={field.state.value}
                onChange={(event) =>
                  field.handleChange(event.currentTarget.checked)
                }
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
        <Text size="sm" color="dimmed" mb="md">
          Anthropic provides advanced AI models like Claude. Sign up on their
          website to get an API key.
        </Text>
        <form.Field name={`providers.${providerName}.enabled`}>
          {(field: any) => (
            <AnimatePresence>
              {field.state.value && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <form.Field name={`providers.${providerName}.apiKey`}>
                    {(field: any) => (
                      <APIKeyInput
                        field={field}
                        placeholder="Anthropic API Key"
                        onValidate={validateApiKey}
                      />
                    )}
                  </form.Field>
                  <ModelToggles form={form} providerName={providerName} />
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </form.Field>
      </Card>
    </motion.div>
  )
}
