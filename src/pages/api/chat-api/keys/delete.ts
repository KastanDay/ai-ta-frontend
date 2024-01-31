// src/pages/api/chat-api/keys/delete.ts

import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/utils/supabaseClient'
import { getAuth } from '@clerk/nextjs/server'
import posthog from 'posthog-js'
import { NextRequest, NextResponse } from 'next/server'

export const config = {
  runtime: 'edge',
}

/**
 * API handler to delete an API key for a user.
 *
 * @param {NextApiRequest} req - The incoming HTTP request.
 * @param {NextApiResponse} res - The outgoing HTTP response.
 * @returns A JSON response indicating the result of the delete operation.
 */
export default async function deleteKey(req: NextRequest, res: NextResponse) {
  // Check for the DELETE request method.
  if (req.method !== 'DELETE') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
    return
  }

  // Get the current user's email
  const currUserId = await getAuth(req).userId
  console.log('Deleting api key for: ', currUserId)

  // Ensure the user email is present
  if (!currUserId) {
    return NextResponse.json(
      { error: 'User email is required' },
      { status: 401 },
    )
  }

  try {
    // Attempt to delete the API key from the 'api_keys' table where the user_email matches.
    const { data, error } = await supabase
      .from('api_keys')
      .update({ is_active: false })
      .match({ user_id: currUserId })

    // If an error occurs during deletion, return a 500 status with the error message.
    if (error) {
      console.error('Error deleting API key:', error)
      throw error
    }

    posthog.capture('api_key_deleted', {
      currUserId,
    })

    // Respond with a success message and the data of the deleted key.
    return NextResponse.json(
      { message: 'API key deleted successfully', data },
      { status: 200 },
    )
  } catch (error) {
    // Log the error for server-side debugging.
    console.error('Failed to delete API key:', error)

    posthog.capture('api_key_deletion_failed', {
      userId: currUserId,
      error: (error as Error).message,
    })

    // Respond with a server error status and the error message.
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    )
  }
}
