import { TextInput, Box, Checkbox} from '@mantine/core'
import { useState, useEffect } from 'react'

export default function SetWebScrapeParameters({
  course_name,
}: {
  course_name: string
}) {
  const example_questions = ['']
  const [inputList, setInputList] = useState(
    example_questions.length > 0 ? example_questions : [''],
  )
  const [isTyping, setIsTyping] = useState(false)
  const [stayOnBaseUrl, setStayOnBaseUrl] = useState(false) // Added this line

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    const value = e.target.value
    const list = [...inputList]
    list[index] = value
    setInputList(list)
    if (index === inputList.length - 1 && value !== '') {
      setIsTyping(true)
    }
  }

  const handleInputFocus = (index: number) => {
    if (inputList.every((item) => item !== '')) {
      setIsTyping(true)
    }
  }

  useEffect(() => {
    if (isTyping) {
      handleAddClick()
      setIsTyping(false)
    }
  }, [isTyping])

  const handleAddClick = () => {
    if (inputList[inputList.length - 1] !== '') {
      setInputList([...inputList, ''])
    }
  }

  return (
    <Box className="pl-1 pr-1">
      <form
        onSubmit={(event) => {
          event.preventDefault();
        }}
      >
        <TextInput
          label="Max URLs"
          name="maximumUrls"
          placeholder="Default 100"
          value={inputList[0]}
          onChange={(e) => {
            const value = e.target.value;
            const intValue = parseInt(value);
            if (!isNaN(intValue) || value === '') {
              handleInputChange(e, 0);
            } else {
              alert("Please enter a valid integer for Max URLs (numbers only)");
            }
          }}
          onFocus={() => handleInputFocus(0)}
          style={{ width: '100%' }}
        />
        <TextInput
          label="Timeout"
          name="timeout"
          placeholder="Default 1"
          value={inputList[1]}
          onChange={(e) => {
            const value = e.target.value;
            const intValue = parseInt(value);
            if (!isNaN(intValue) || value === '') {
              handleInputChange(e, 1);
            } else {
              alert("Please enter a valid integer for Timeout (numbers only)");
            }
          }}  
          onFocus={() => handleInputFocus(1)}  
          style={{ width: '100%' }}
        />
        <TextInput
          label="Max Depth"
          name="maxDepth"
          placeholder="Default 3"
          value={inputList[2]}
          onChange={(e) => {
            const value = e.target.value;
            const intValue = parseInt(value);
            if (!isNaN(intValue) || value === '') {
              handleInputChange(e, 2);
            } else {
              alert("Please enter a valid integer for Timeout (numbers only)");
            }
          }}
          onFocus={() => handleInputFocus(2)}
          style={{ width: '100%' }}
        />
        <div style={{ fontSize: 'smaller', marginBottom: '0px' }}>Stay on Base URL</div>
        <Checkbox 
          checked={stayOnBaseUrl}
          size="md"
          onChange={() => setStayOnBaseUrl(!stayOnBaseUrl)}
        />
      </form>

    </Box>
  )
}

