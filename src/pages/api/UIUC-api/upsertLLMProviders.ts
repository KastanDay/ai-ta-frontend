// upsertCourseMetadata.ts
import { kv } from '@vercel/kv'
import { type NextRequest, NextResponse } from 'next/server'
import { ProjectWideLLMProviders } from '~/types/courseMetadata'
import { AllLLMProviders } from '~/types/LLMProvider'

export const runtime = 'edge'

export default async function handler(req: NextRequest, res: NextResponse) {
  // Ensure it's a POST request
  if (req.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
  }

  const requestBody = await req.text()
  let courseName: string
  let llmProviders: AllLLMProviders
  let defaultModelID: string
  let defaultTemperature: number

  try {
    const parsedBody = JSON.parse(requestBody)
    courseName = parsedBody.projectName as string
    llmProviders = parsedBody.llmProviders as AllLLMProviders
    defaultModelID = parsedBody.defaultModelID as string
    defaultTemperature = parsedBody.defaultTemperature as number
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

  try {
    const redisKey = `${courseName}-llms`
    const existingLLMs = (await kv.get(redisKey)) as ProjectWideLLMProviders

    // If a key is "defined but hidden" then replace that Provider with one from the DB.
    Object.keys(llmProviders).forEach((providerName) => {
      const typedProviderName = providerName as keyof AllLLMProviders
      const provider = llmProviders[typedProviderName]
      if (provider?.apiKey == '') {
        // If the key is empty, delete it. That's our convention.
        delete provider.apiKey
      }
      if (provider?.apiKey === 'this key is defined, but hidden') {
        if (existingLLMs && existingLLMs[typedProviderName]) {
          // @ts-ignore - idk how to get around this 'cannot be undefined' thing.
          llmProviders[typedProviderName] = {
            ...provider,
            ...existingLLMs[typedProviderName],
          } as AllLLMProviders[typeof typedProviderName]
          console.log(
            `Replacing hidden key for ${providerName} with existing data`,
          )
        } else {
          console.log(
            'Removing hidden key for',
            providerName,
            'data',
            llmProviders[typedProviderName],
          )
          delete llmProviders[typedProviderName]
          // console.log(`Removing hidden key for ${providerName}`)
        }
      }
    })

    if (!existingLLMs) {
      console.log('No existing LLM keys.')
    }

    // Combine the existing metadata with the new metadata, prioritizing the new values
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
