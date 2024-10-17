import { ContextWithMetadata } from '~/types/chat'
import posthog from 'posthog-js'
// import * as Sentry from '@sentry/nextjs'

export const createProject = async (
  project_name: string,
  project_description: string | undefined,
  project_owner_email: string,
): Promise<boolean> => {
  const requestBody = {
    project_name: project_name,
    project_description: project_description,
    project_owner_email: project_owner_email,
  }
  const url = 'https://flask-production-751b.up.railway.app/createProject'

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })
    if (!response.ok) {
      console.error(
        'Failed to create the project. Err status:',
        response.status,
      )
      throw new Error(
        'Failed to create the project. Err status:' + response.status,
      )
    }
    // Log success to PostHog
    posthog.capture('project_created', {
      project_name: project_name,
      project_owner_email: project_owner_email,
    })
    return true
  } catch (error) {
    console.error(error)
    // Log error to Sentry
    // Sentry.captureException(error, {
    //   tags: {
    //     project_name: project_name,
    //     project_owner_email: project_owner_email,
    //   },
    // })
    return false
  }
}

export default createProject
