import React from 'react'
import { Text, Switch, Card } from '@mantine/core'
import { IconExternalLink } from '@tabler/icons-react'
import { APIKeyInput } from '../APIKeyInputForm'
import { ModelToggles } from '../ModelToggles'
import { OpenAIModel } from '~/utils/modelProviders/openai'
import { OpenAIProvider } from '~/types/LLMProvider'

export default function OpenAIProviderInput({ provider, form, providerName }: { provider: OpenAIProvider, form: any, providerName: string }) {
  return (
    <Card shadow="sm" p="lg" radius="md" withBorder>
        <div style={{ display: 'flex', alignItems: 'center' }}>
            <Text size="lg" weight={500} mb="xs" style={{ paddingRight: '8px' }}>OpenAI</Text>
            <a className="mb-3" href="https://platform.openai.com/account/api-keys" target="_blank" rel="noopener noreferrer">
                <IconExternalLink size={16} />
            </a>
        </div>
        <Text size="sm" color="dimmed" mb="md">
            OpenAI offers powerful language models like GPT-3.5 and GPT-4. Get your API key from the OpenAI platform.
        </Text>
      <form.Field name={`providers.${providerName}.enabled`}>
        {(field: any) => (
          <Switch
            label="Enable OpenAI"
            checked={field.state.value}
            onChange={(event) => field.handleChange(event.currentTarget.checked)}
          />
        )}
      </form.Field>
      <form.Field name={`providers.${providerName}.apiKey`}>
        {(field: any) => (
          <APIKeyInput field={field} placeholder="OpenAI API Key" />
        )}
      </form.Field> 
      <ModelToggles form={form} providerName={providerName} models={provider.models?.map((model: OpenAIModel) => model.name as string) || []} />
    </Card>
  )
}