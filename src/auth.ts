import { betterAuth } from "better-auth"
import { Pool } from "pg"
 
export const auth = betterAuth({
    database: new Pool({
        connectionString: "postgresql://postgres:8fyvaXYuPXTY4mjsZToZjsEGuzaem4Dv74jwtfky@bigbird-vm.humpback-symmetric.ts.net:5432"
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