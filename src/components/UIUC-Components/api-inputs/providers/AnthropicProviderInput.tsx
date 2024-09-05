import React from 'react'
import { Text, Switch, Card } from '@mantine/core'  
import { IconExternalLink } from '@tabler/icons-react'
import { APIKeyInput } from '../APIKeyInputForm'
import { ModelToggles } from '../ModelToggles'
import { AnthropicProvider } from '~/types/LLMProvider'
import { AnthropicModel } from '~/utils/modelProviders/anthropic'

export default function AnthropicProviderInput({ provider, form, providerName }: { provider: AnthropicProvider, form: any, providerName: string }) {
  return (
    <Card shadow="sm" p="lg" radius="md" withBorder>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Text size="lg" weight={500} mb="xs" style={{ paddingRight: '8px' }}>Anthropic</Text>
          <a className="mb-3" href="https://www.anthropic.com/" target="_blank" rel="noopener noreferrer">
            <IconExternalLink size={16} />
          </a>
        </div>
      <Text size="sm" color="dimmed" mb="md">
        Anthropic provides advanced AI models like Claude. Sign up on their website to get an API key.
      </Text>
      <form.Field name={`providers.${providerName}.enabled`}>
        {(field: any) => (
          <Switch
            label="Enable Anthropic"
            checked={field.state.value}
            onChange={(event) => field.handleChange(event.currentTarget.checked)}
          />
        )}
      </form.Field>
      <form.Field name={`providers.${providerName}.apiKey`}>
        {(field: any) => (
          <APIKeyInput field={field} placeholder="Anthropic API Key" />
        )}
      </form.Field>
      <ModelToggles form={form} providerName={providerName} models={provider.models?.map((model: AnthropicModel) => model.name as string) || []} />
    </Card>
  )
}