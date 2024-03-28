import { createClient } from '@supabase/supabase-js'

const supa_url = process.env.SUPABASE_URL as string
const supa_key = process.env.SUPABASE_SECRET as string

console.log('supa_url: ', supa_url)
console.log('supa_key: ', supa_key)

export const supabase = createClient(
  supa_url,
  supa_key,
  // process.env.SUPABASE_URL as string,
  // process.env.SUPABASE_SECRET as string,
)
