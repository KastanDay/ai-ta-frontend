import { betterAuth } from "better-auth"
import { Pool } from "pg"

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.SUPABASE_URL,
    ssl: {
      rejectUnauthorized: false
    },
  }),
  headers: {
    apikey: process.env.SUPABASE_KEY
  },
  emailAndPassword: {
    enabled: true
  },
  socialProviders: {
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
    }
  },
})