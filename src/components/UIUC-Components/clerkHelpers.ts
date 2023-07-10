
import { type UserResource } from '@clerk/types'

export function extractEmailsFromClerk(
  user: UserResource | undefined | null,
): string[] {
  // Extract all possible emails from Clerk user object.
  // Both manually set emails and social logins.
  if (!user) return []

  const externalEmails =
    user.externalAccounts?.map((account) => account.emailAddress) || []
  const userEmails =
    user.emailAddresses?.map((account) => account.emailAddress) || []

  const emails = [...externalEmails, ...userEmails].filter(
    (email) => email !== undefined,
  ) as string[]

  return Array.from(new Set(emails))
}
