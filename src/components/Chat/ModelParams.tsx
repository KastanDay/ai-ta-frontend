import { useState } from 'react'
// import { ModelSelect } from './ModelSelect'
import { SystemPrompt } from './SystemPrompt'
import { TemperatureSlider } from './Temperature'
import Link from 'next/link'
import { IconExternalLink } from '@tabler/icons-react'
import { Accordion, Input, Title, Text, createStyles } from '@mantine/core'
import { montserrat_heading, montserrat_paragraph } from 'fonts'

const useStyles = createStyles((theme) => ({
  // For Accordion
  root: {
    padding: 0,
    borderRadius: theme.radius.xl,
    outline: 'none',
  },
  item: {
    backgroundColor: 'bg-transparent',
    // border: `${rem(1)} solid transparent`,
    border: `solid transparent`,
    borderRadius: theme.radius.xl,
    position: 'relative',
    zIndex: 0,
    transition: 'transform 150ms ease',
    outline: 'none',

    '&[data-active]': {
      transform: 'scale(1.03)',
      backgroundColor: 'bg-transparent',
      // boxShadow: theme.shadows.xl,
      // borderRadius: theme.radius.lg,
      zIndex: 1,
    },
    '&:hover': {
      backgroundColor: 'bg-transparent',
    },
  },

  chevron: {
    '&[data-rotate]': {
      transform: 'rotate(90deg)',
    },
  },
}))

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
  const { classes } = useStyles() // for Accordion

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsChecked(event.target.checked)
  }

  return (
    <div className="backdrop-filter-[blur(10px)] w-full rounded-lg ">
      <Accordion
        // pl={27}
        // pr={10}
        pt={10}
        // pb={40}
        // m={-40}
        style={{ borderRadius: 'theme.radius.xl' }}
        classNames={classes}
        className={classes.root}
      >
        {/* ... Accordion items */}
        <Accordion.Item value="openai-key-details">
          <Accordion.Control>
            <Text
              className={`label ${montserrat_heading.variable} inline-block p-0 font-montserratHeading text-neutral-200`}
              size={'md'}
            >
              Advanced
            </Text>
          </Accordion.Control>

          {/* HIDDEN TEXT */}
          <Accordion.Panel>
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

              {/* <div style={{ minHeight: '3em' }}>
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
              </div> */}

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
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </div>
  )
}
