import React from 'react'
import { Text, Switch, Card, Button } from '@mantine/core'
import { IconCheck, IconExternalLink, IconX } from '@tabler/icons-react'
import { APIKeyInput } from '../APIKeyInputForm'
import { ModelToggles } from '../ModelToggles'
import { OpenAIModel } from '~/utils/modelProviders/openai'
import { OpenAIProvider } from '~/types/LLMProvider'
import { motion, AnimatePresence } from 'framer-motion'

export default function OpenAIProviderInput({
  provider,
  form,
  providerName,
}: {
  provider: OpenAIProvider
  form: any
  providerName: string
}) {
  return (
    <motion.div layout>
      <Card shadow="sm" p="lg" radius="md" className="bg-[#15162c]">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Text
              size="lg"
              weight={500}
              mb="xs"
              style={{ paddingRight: '8px' }}
            >
              OpenAI
            </Text>
            <a
              className="mb-3"
              href="https://platform.openai.com/account/api-keys"
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
                aria-label="Enable OpenAI provider"
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
          OpenAI offers powerful language models like GPT-3.5 and GPT-4. Get
          your API key from the OpenAI platform.
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
                    {(apiKeyField: any) => (
                      <APIKeyInput
                        field={apiKeyField}
                        placeholder="OpenAI API Key"
                      />
                    )}
                  </form.Field>

                  <ModelToggles
                    form={form}
                    providerName={providerName}
                    models={
                      provider.models?.map(
                        (model: OpenAIModel) => model.name as string,
                      ) || []
                    }
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
