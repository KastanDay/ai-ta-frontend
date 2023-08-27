import { useState } from 'react'
import { ModelSelect } from './ModelSelect'
import { SystemPrompt } from './SystemPrompt'
import { TemperatureSlider } from './Temperature'

// Define the types for the component props
interface ModelParamsProps {
  selectedConversation: any // Replace 'any' with the appropriate type
  prompts: any // Replace 'any' with the appropriate type
  handleUpdateConversation: (
    conversation: any,
    update: { key: string; value: any },
  ) => void // Replace 'any' with the appropriate types
  t: (key: string) => string
}

export const ModelParams = ({
  selectedConversation,
  prompts,
  handleUpdateConversation,
  t,
}: ModelParamsProps) => {
  const [isChecked, setIsChecked] = useState(false)

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsChecked(event.target.checked)
  }

  return (
    <div className="collapse-arrow collapse rounded-2xl bg-transparent border-indigo-500 border-2">
      <input
        type="checkbox"
        checked={isChecked}
        onChange={handleCheckboxChange}
      />
      <div className="collapse-title text-xl font-medium text-black dark:text-white">
        Model Parameters
      </div>
      {isChecked && (
        <div className="collapse-content">
          <div className="flex h-full flex-col space-y-4 rounded-lg p-4">
            <ModelSelect />

            <SystemPrompt
              conversation={selectedConversation}
              prompts={prompts}
              onChangePrompt={(prompt) =>
                handleUpdateConversation(selectedConversation, {
                  key: 'prompt',
                  value: prompt,
                })
              }
            />

            <TemperatureSlider
              label={t('Temperature')}
              onChangeTemperature={(temperature) =>
                handleUpdateConversation(selectedConversation, {
                  key: 'temperature',
                  value: temperature,
                })
              }
            />
          </div>
        </div>
      )}
    </div>
  )
}
