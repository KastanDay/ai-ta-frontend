import React from 'react'
import { Switch, Stack } from '@mantine/core'

interface ModelTogglesProps {
  form: any
  providerName: string
  models: string[]
}

export function ModelToggles({ form, providerName, models }: ModelTogglesProps) {
  return (
    <Stack mt="md">
      {models.map((model) => (
        <form.Field key={model} name={`providers.${providerName}.models.${model}`}>
          {(field: any) => (
            <Switch
              label={`${model}`}
              checked={field.state.value}
              onChange={(event) => field.handleChange(event.currentTarget.checked)}
            />
          )}
        </form.Field>
      ))}
    </Stack>
  )
}