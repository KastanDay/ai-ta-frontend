import { type NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export default async function handler(req: NextRequest, res: NextResponse) {
  // Example response:  {'map_id': 'iframef4967ad7-ff37-4098-ad06-7e1e1a93dd93', 'map_link': 'https://atlas.nomic.ai/map/ed222613-97d9-46a9-8755-12bbc8a06e3a/f4967ad7-ff37-4098-ad06-7e1e1a93dd93'}
  try {
    const course_name = req.nextUrl.searchParams.get('course_name')
    const map_type = req.nextUrl.searchParams.get('map_type') || ''
    console.log('course_name:', course_name)
    console.log('map_type:', map_type)

    const url = `https://flask-production-751b.up.railway.app/getNomicMap?course_name=${course_name}&${map_type ? `map_type=${map_type}` : ''}`
    console.log('Fetching nomic map:', url)

    const response = await fetch(url)
    const data = await response.json()

    const parsedData: NomicMapData = {
      map_id: data.map_id,
      map_link: data.map_link,
    }
    console.log('Fetched nomic map:', parsedData)
    return NextResponse.json(parsedData)
  } catch (error) {
    console.error('Error fetching nomic map:', error)
    return NextResponse.json({ success: false })
  }
}
