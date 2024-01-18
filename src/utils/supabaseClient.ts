import { createClient } from '@supabase/supabase-js'

// const supa_url = process.env.SUPABASE_URL as string
// const supa_key = process.env.SUPABASE_SECRET as string
export const supabase = createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SECRET as string,
)