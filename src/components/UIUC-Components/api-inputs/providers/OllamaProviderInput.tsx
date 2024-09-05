import React from 'react'
import { Text, Switch, Card, TextInput } from '@mantine/core'
import { IconExternalLink } from '@tabler/icons-react'
import { APIKeyInput } from '../APIKeyInputForm'
import { ModelToggles } from '../ModelToggles'
import { OllamaModel } from '~/utils/modelProviders/ollama'
import { OllamaProvider } from '~/types/LLMProvider'

export default function OllamaProviderInput({ provider, form, providerName }: { provider: OllamaProvider, form: any, providerName: string }) {
  return (
    <Card shadow="sm" p="lg" radius="md" withBorder>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Text size="lg" weight={500} mb="xs" style={{ paddingRight: '8px' }}>Ollama</Text>
        <a className="mb-3" href="https://ollama.ai/" target="_blank" rel="noopener noreferrer">
          <IconExternalLink size={16} />
        </a>
      </div>
      <Text size="sm" color="dimmed" mb="md">
        Ollama allows you to run large language models locally. Set up Ollama on your machine and provide the base URL.
      </Text>
      <form.Field name={`providers.${providerName}.enabled`}>
        {(field: any) => (
          <Switch
            label="Enable Ollama"
            checked={field.state.value}
            onChange={(event) => field.handleChange(event.currentTarget.checked)}
          />
        )}
      </form.Field>
      <form.Field name={`providers.${providerName}.baseUrl`}>
        {(field: any) => (
          <TextInput
            label="Base URL"
            placeholder="http://localhost:11434"
            value={field.state.value}
            onChange={(event) => field.handleChange(event.currentTarget.value)}
          />
        )}
      </form.Field>
      <ModelToggles form={form} providerName={providerName} models={provider.models?.map((model: OllamaModel) => model.name as string) || []} />
    </Card>
  )
}