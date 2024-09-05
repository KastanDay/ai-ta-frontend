import React from 'react'
import { Text, Switch, Card } from '@mantine/core'
import { IconExternalLink } from '@tabler/icons-react'
import { ModelToggles } from '../ModelToggles'
import { WebllmModel } from '~/utils/modelProviders/WebLLM'
import { WebLLMProvider } from '~/types/LLMProvider'

export default function WebLLMProviderInput({ provider, form, providerName }: { provider: WebLLMProvider, form: any, providerName: string }) {
  return (
    <Card shadow="sm" p="lg" radius="md" withBorder>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Text size="lg" weight={500} mb="xs" style={{ paddingRight: '8px' }}>WebLLM</Text>  
        <a className="mb-3" href="https://github.com/web-llm/web-llm" target="_blank" rel="noopener noreferrer">
          <IconExternalLink size={16} />
        </a>
      </div>
      <Text size="sm" color="dimmed" mb="md">
        WebLLM is a framework for building and deploying LLMs in the browser.
      </Text>
      <form.Field name={`providers.${providerName}.enabled`}>
        {(field: any) => (
          <Switch
            label="Enable WebLLM"
            checked={field.state.value}
            onChange={(event) => field.handleChange(event.currentTarget.checked)}
          />
        )}
      </form.Field>
      <ModelToggles form={form} providerName={providerName} models={provider.models?.map((model: WebllmModel) => model.name as string) || []} />
    </Card>
  )
}