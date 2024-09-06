// upsertCourseMetadata.ts
import { kv } from '@vercel/kv'
import { type NextRequest, NextResponse } from 'next/server'
import { AllLLMProviders } from '~/types/LLMProvider'

export const runtime = 'edge'

export default async function handler(req: NextRequest, res: NextResponse) {
  // Ensure it's a POST request
  if (req.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
  }

  const requestBody = await req.text()
  let courseName, llmProviders, defaultModelID, defaultTemperature

  try {
    const parsedBody = JSON.parse(requestBody)
    courseName = parsedBody.courseName
    llmProviders = parsedBody.llmProviders
    defaultModelID = parsedBody.defaultModelID
    defaultTemperature = parsedBody.defaultTemperature
  } catch (error) {
    console.error('Error parsing request body:', error)
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // Check if all required variables are defined
  if (!courseName || !llmProviders || !defaultModelID || !defaultTemperature) {
    console.error('Error: Missing required parameters')
    return NextResponse.json(
      { error: 'Missing required parameters' },
      { status: 400 },
    )
  }

  // Type checking
  if (
    typeof courseName !== 'string' ||
    typeof defaultModelID !== 'string' ||
    typeof defaultTemperature !== 'string'
  ) {
    console.error('Error: Invalid parameter types')
    return NextResponse.json(
      { error: 'Invalid parameter types' },
      { status: 400 },
    )
  }

  if (typeof llmProviders !== 'object' || llmProviders === null) {
    console.error('Error: Invalid llmProviders')
    return NextResponse.json({ error: 'Invalid llmProviders' }, { status: 400 })
  }

  console.log('API Request:', requestBody)
  console.log('courseMetadata:', llmProviders)

  try {
    // Redis Structured like this:
    // "{
    //    "Provider": {"key": "val"},
    //    "Provider2": {"key-2": "val-2"}},
    //    "defaultModel": "llama",
    //    "defaultTemp": 1.0"
    // }"

    const redisKey = `${courseName}-llms`

    const existingLLMs = kv.get(redisKey)
    if (!existingLLMs) {
      // TODO
      console.log('No existing LLM keys.')
    }

    // Combine the existing metadata with the new metadata, prioritizing the new values (order matters!)
    const combined_llms = { ...existingLLMs, ...llmProviders }

    if (defaultModelID) {
      combined_llms.defaultModel = defaultModelID
    }

    if (defaultTemperature) {
      combined_llms.defaultTemp = defaultTemperature
    }

    console.log('-----------------------------------------')
    console.log('EXISTING course metadata:', existingLLMs)
    console.log('passed into upsert metadata:', llmProviders)
    console.log('FINAL COMBINED course metadata:', combined_llms)
    console.log('^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^')

    // Save the combined metadata
    await kv.set(redisKey, combined_llms)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error setting course metadata:', error)
    return NextResponse.json({ success: false })
  }
}
