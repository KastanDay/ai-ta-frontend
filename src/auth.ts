import { betterAuth } from "better-auth"
import { Pool } from "pg"

export const auth = betterAuth({
    database: new Pool({
        connectionString: process.env.POSTGRES_DEV_CONNECTION_STRING as string
    }),
    emailAndPassword: {
        enabled: true
    },
    socialProviders: {
        microsoft: {
            clientId: process.env.MICROSOFT_CLIENT_ID as string,
            clientSecret: process.env.MICROSOFT_CLIENT_SECRET as string,
        },
    },
})