import React from 'react'
import { IconCheck, IconX } from '@tabler/icons-react'
import { Switch, Stack } from '@mantine/core'

interface ModelTogglesProps {
  form: any
  providerName: string
}

export function ModelToggles({ form, providerName }: ModelTogglesProps) {
  const providerModels = form.state.values.providers[providerName]?.models || {}

  return (
    <Stack mt="md">
      {Object.entries(providerModels).map(
        ([modelId, modelData]: [string, any]) => (
          <form.Field
            key={modelId}
            name={`providers.${providerName}.models.${modelId}.enabled`}
          >
            {(field: any) => (
              <Switch
                label={modelData.name}
                checked={field.state.value}
                onLabel="ON"
                offLabel="OFF"
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
        ),
      )}
    </Stack>
  )
}
