import React from 'react'
import { Text, Switch, Card, TextInput } from '@mantine/core'
import { IconCheck, IconExternalLink, IconX } from '@tabler/icons-react'
import { ModelToggles } from '../ModelToggles'
import { OllamaModel } from '~/utils/modelProviders/ollama'
import { OllamaProvider } from '~/types/LLMProvider'
import { motion, AnimatePresence } from 'framer-motion'

export default function OllamaProviderInput({
  provider,
  form,
  providerName,
}: {
  provider: OllamaProvider
  form: any
  providerName: string
}) {
  return (
    <motion.div layout>
      <Card shadow="sm" p="lg" radius="md" withBorder>
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
              Ollama
            </Text>
            <a
              className="mb-3"
              href="https://ollama.ai/"
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
                aria-label="Enable Ollama provider"
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
          Ollama allows you to run large language models locally. Set up Ollama
          on your machine and provide the base URL.
        </Text>
        <form.Field name={`providers.${providerName}.baseUrl`}>
          {(field: any) => (
            <TextInput
              label="Base URL"
              placeholder="http://localhost:11434"
              value={field.state.value}
              onChange={(event) =>
                field.handleChange(event.currentTarget.value)
              }
            />
          )}
        </form.Field>
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
                  <ModelToggles
                    form={form}
                    providerName={providerName}
                    models={
                      provider.models?.map(
                        (model: OllamaModel) => model.name as string,
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
