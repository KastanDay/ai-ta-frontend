// src/pages/[course_name]/index.test.tsx
import { render, screen } from '@testing-library/react'
import { useRouter } from 'next/router'
import { useUser } from '@clerk/nextjs'
import { IfCourseExists } from './index'

jest.mock('next/router')
jest.mock('@clerk/nextjs')

describe('IfCourseExists', () => {
  beforeEach(() => {
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
    useUser.mockReturnValue({ isLoaded: true })
    // Mock other necessary values

    render(<IfCourseExists />)

    expect(screen.getByTestId('make-new-course-page')).toBeInTheDocument()
  })
})
