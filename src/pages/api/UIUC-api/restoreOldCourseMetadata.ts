// src/pages/api/UIUC-api/restoreOldCourseMetadata.ts
import { kv } from '@vercel/kv'
import { type CourseMetadata } from '~/types/courseMetadata'
import { type NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import { join } from 'path'

export default async function handler(req: NextRequest, res: NextResponse) {
  try {
    // Read the backup file
    const filePath = join(process.cwd(), 'backupOldCourseMetadatas.json')
    const oldMetadatas = JSON.parse(await fs.readFile(filePath, 'utf-8'))

    console.log('Starting restore for keys: ', oldMetadatas.length)

    // Iterate over each old metadata
    for (const { key, value } of oldMetadatas) {
      // Restore the old metadata to the KV store
      await kv.set(key, value as CourseMetadata)
    }

    console.log('Old metadata restored from file:', filePath)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error restoring old course metadata:', error)
    return NextResponse.json({ success: false })
  }
}
