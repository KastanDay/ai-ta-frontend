// src/components/Chat/ScrollDownButton.tsx
import React from 'react'
import { Button } from '@mantine/core'
import { IconArrowDown } from '@tabler/icons-react'

interface ScrollDownButtonProps {
  onClick: () => void
}

const ScrollDownButton: React.FC<ScrollDownButtonProps> = ({ onClick }) => {
  return (
    <Button
      onClick={onClick}
      variant="filled"
      color="blue"
      className="fixed bottom-20 right-5 z-50"
      leftIcon={<IconArrowDown />}
    >
      Scroll Down
    </Button>
  )
}

export default React.memo(ScrollDownButton)
