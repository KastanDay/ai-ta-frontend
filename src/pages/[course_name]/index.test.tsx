// src/pages/[course_name]/index.test.tsx
import { render, screen } from '@testing-library/react'
import { useRouter } from 'next/router'
import { useUser } from '@clerk/nextjs'
import IfCourseExists, { __USE_FOR_TESTS_getCourseMetadata } from './index'

jest.mock('next/router')
jest.mock('@clerk/nextjs')

describe('IfCourseExists', () => {
  beforeEach(() => { 
    jest.spyOn(console, 'log')
    jest.mock('next/router', () => ({
      useRouter: jest.fn().mockReturnValue({ query: { course_name: 'test-course' } }),
    }))
    jest.mock('@clerk/nextjs', () => ({ useUser: jest.fn().mockReturnValue({ isLoaded: false }) }))
  
    useRouter.mockReset()
    useUser.mockReset()
  })

  test('renders loading spinner when course metadata and user data are not loaded', () => {
    useRouter.mockReturnValue({ query: { course_name: 'test-course' } })
    useUser.mockReturnValue({ isLoaded: false })

    render(<IfCourseExists />)

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  // Add more test cases to cover different scenarios and business logic

  test('renders MakeNewCoursePage when course metadata is null', () => {
    useRouter.mockReturnValue({ query: { course_name: 'test-course' } }) 
    jest.spyOn(console, 'log')
    useUser.mockReturnValue({ isLoaded: true })
    __USE_FOR_TESTS_getCourseMetadata.mockReturnValue({ is_private: true })

    render(<IfCourseExists />)

    expect(screen.getByTestId('make-new-course-page')).toBeInTheDocument()
  })
})
