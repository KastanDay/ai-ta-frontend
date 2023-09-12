import { useState } from 'react'
// import { ModelSelect } from './ModelSelect'
import { SystemPrompt } from './SystemPrompt'
import { TemperatureSlider } from './Temperature'
import Link from 'next/link'
import { IconExternalLink } from '@tabler/icons-react'
import { Input, Title } from '@mantine/core'
import { montserrat_heading, montserrat_paragraph } from 'fonts'

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
    <div className="backdrop-filter-[blur(10px)] collapse-arrow collapse w-full rounded-lg border ">
      <input
        type="checkbox"
        checked={isChecked}
        onChange={handleCheckboxChange}
      />
      <Title
        className={`collapse-title pb-2 pl-6 pt-4 ${montserrat_heading.variable} font-montserratHeading`}
        order={4}
      >
        Advanced
      </Title>
      {isChecked && (
        <div className="collapse-content">
          <div className="flex h-full flex-col space-y-4 rounded-lg p-2">
            <div className="flex w-full items-center space-y-0 pt-0 text-left">
              <Input.Description
                className={`text-left text-sm ${montserrat_paragraph.variable} font-montserratParagraph`}
              >
                <Link
                  href="https://platform.openai.com/account/usage"
                  target="_blank"
                  className="hover:underline"
                >
                  View account usage on OpenAI{' '}
                  <IconExternalLink
                    size={15}
                    style={{ position: 'relative', top: '2px' }}
                    className={'mb-2 inline'}
                  />
                </Link>
              </Input.Description>
            </div>

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
