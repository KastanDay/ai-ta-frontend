import React from 'react'
import { Text, Switch, Card, TextInput } from '@mantine/core'
import { IconCheck, IconExternalLink, IconX } from '@tabler/icons-react'
import { APIKeyInput } from '../APIKeyInputForm'
import { ModelToggles } from '../ModelToggles'
import { AzureModel } from '~/utils/modelProviders/azure'
import { AzureProvider } from '~/types/LLMProvider'
import { motion, AnimatePresence } from 'framer-motion'

export default function AzureProviderInput({
  provider,
  form,
  providerName,
}: {
  provider: AzureProvider
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
              Azure OpenAI
            </Text>
            <a
              className="mb-3"
              href="https://azure.microsoft.com/en-us/products/cognitive-services/openai-service/"
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
                aria-label="Enable Azure OpenAI provider"
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
          Azure OpenAI Service provides REST API access to OpenAI's powerful
          language models with the security and enterprise promise of Azure.
        </Text>
        <form.Field name={`providers.${providerName}.apiKey`}>
          {(field: any) => (
            <APIKeyInput field={field} placeholder="Azure API Key" />
          )}
        </form.Field>
        <form.Field name={`providers.${providerName}.AzureEndpoint`}>
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
        <form.Field name={`providers.${providerName}.AzureDeployment`}>
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
                        (model: AzureModel) => model.name as string,
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