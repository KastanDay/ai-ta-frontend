import React from 'react'
import { IconCheck, IconExternalLink, IconX } from '@tabler/icons-react'
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
              onLabel="ON"
              offLabel="OFF"
              onChange={(event) => field.handleChange(event.currentTarget.checked)}
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
      ))}
    </Stack>
  )
}