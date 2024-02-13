// src/pages/api/chat-api/keys/rotate.ts

import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/utils/supabaseClient'
import { v4 as uuidv4 } from 'uuid'
import { getAuth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

export const config = {
  runtime: 'edge',
}

/**
 * API handler to rotate an API key for a user.
 *
 * @param {NextApiRequest} req - The incoming HTTP request.
 * @param {NextApiResponse} res - The outgoing HTTP response.
 * @returns A JSON response indicating the result of the key rotation operation.
 */
export default async function rotateKey(req: NextRequest, res: NextResponse) {
  // Only allow PUT requests, reject all others with method not allowed error.
  if (req.method !== 'PUT') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
  }
  // Get the current user's email
  const currUserId = await getAuth(req).userId
  console.log('Rotating api key for: ', currUserId)

  // Ensure the user email is present
  if (!currUserId) {
    return NextResponse.json(
      { error: 'User email is required' },
      { status: 401 },
    )
  }

  // Retrieve the existing API key for the user.
  const { data: existingKey, error: existingKeyError } = await supabase
    .from('api_keys')
    .select('key')
    .eq('user_id', currUserId)
    .eq('is_active', true)

  // Handle potential errors during retrieval of the existing key.
  if (existingKeyError) {
    console.error('Error retrieving existing API key:', existingKeyError)
    return NextResponse.json(
      { error: existingKeyError.message },
      { status: 500 },
    )
  }

  // If no existing key is found, inform the user to generate one.
  if (!existingKey || existingKey.length === 0) {
    return NextResponse.json(
      { error: 'API key not found for user, please generate one!' },
      { status: 404 },
    )
  }

  // Generate a new API key.
  const rawApiKey = uuidv4()

  // Create a sanitized API key by removing dashes and adding a prefix
  const newApiKey = `uc_${rawApiKey.replace(/-/g, '')}`

  // Update the API key in the database with the new key.
  const { data, error } = await supabase
    .from('api_keys')
    .update({ key: newApiKey, is_active: true, modified_at: new Date() })
    .match({ user_id: currUserId })

  // Handle potential errors during the update operation.
  if (error) {
    console.error('Error updating API key:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Respond with a success message and the new API key.
  return NextResponse.json(
    { message: 'API key rotated successfully', newApiKey },
    { status: 200 },
  )
}
