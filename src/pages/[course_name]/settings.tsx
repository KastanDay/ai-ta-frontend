import { SystemPrompt } from "~/components/Chat/SystemPrompt";
import { useState } from 'react'
import { DEFAULT_SYSTEM_PROMPT } from "~/utils/app/const";

interface ModelParamsProps {
  selectedConversation: any // Replace 'any' with the appropriate type
  prompts: any // Replace 'any' with the appropriate type
  handleUpdateConversation: (
    conversation: any,
    update: { key: string; value: any },
  ) => void // Replace 'any' with the appropriate types
  t: (key: string) => string
}

const Settings = ({
  selectedConversation,
  prompts = [{ name: DEFAULT_SYSTEM_PROMPT }], // provide a default value
  handleUpdateConversation,
  t,
}: ModelParamsProps) => {
  const [isChecked, setIsChecked] = useState(false)
  const [systemPrompt, setSystemPrompt] = useState(''); // new state for system prompt

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsChecked(event.target.checked)
  }

  return (
    <div style={{ minHeight: '3em' }}>
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
      <input
        type="text"
        value={systemPrompt}
        onChange={(e) => setSystemPrompt(e.target.value)}
      />
      <button onClick={updateSystemPrompt}>Update System Prompt</button>
    </div>
  )
}

export default Settings;