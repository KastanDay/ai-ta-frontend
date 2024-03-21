import { supabase } from '@/utils/supabaseClient'
import { NextRequest, NextResponse } from 'next/server'

export const config = {
  runtime: 'edge',
}

export default async function upsertN8nAPIKey(
  req: NextRequest,
  res: NextResponse,
) {
  const { course_name, n8n_api_key } = await req.json()
  if (!course_name || !n8n_api_key) {
    return new NextResponse(
      JSON.stringify({
        success: false,
        error: 'course_name and n8n_api_key are required',
      }),
      { status: 400 },
    )
  }
  const { data, error } = await supabase
    .from('projects')
    .update({ n8n_api_key: n8n_api_key })
    .eq('course_name', course_name)
    .select()

  if (error) {
    console.error('Error upserting N8n key to Supabase:', error)
    return new NextResponse(JSON.stringify({ success: false, error: error }), {
      status: 500,
    })
  }
  return new NextResponse(JSON.stringify({ success: true }), { status: 200 })
}
