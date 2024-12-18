import { useSession } from '@/lib/auth-client'

export function extractUserEmails(): string[] {
  const { data: session } = useSession()
  if (!session?.user?.email) return []
  
  return [session.user.email]
}