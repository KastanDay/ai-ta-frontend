import React from 'react'
import { ErrorMessageDiv } from './ErrorMessageDiv'
import { ErrorMessage } from '~/types/error'

interface ErrorDisplayProps {
  error: string
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error }) => {
  const errorMessage: ErrorMessage = {
    code: null,
    title: 'Error',
    messageLines: [error],
  }
  return <ErrorMessageDiv error={errorMessage} />
}

export default React.memo(ErrorDisplay)
