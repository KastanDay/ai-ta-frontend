import React from 'react'
import { render, screen } from '@testing-library/react'
import { ModelSelect } from './ModelSelect'

test('Multi-Query Retrieval switch is disabled and value is false', () => {
  render(<ModelSelect />)
  
  const switchElement = screen.getByLabelText('Multi Query Retrieval (slow 30 second response time)')
  
  expect(switchElement).toBeDisabled()
  expect(switchElement).not.toBeChecked()
})
