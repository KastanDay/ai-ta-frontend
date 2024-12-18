import { useRouter } from 'next/router'
import { signIn } from '@/lib/auth-client'

export default function SignInPage() {
  const router = useRouter()
  const query_param_course_name = Object.keys(router.query)[0]

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#0E1116]">
      <div className="container flex flex-col items-center justify-center gap-8 px-4 py-16">
        <button
          onClick={() => {
            signIn.social({
              provider: "microsoft",
              callbackURL: query_param_course_name ? `/${query_param_course_name}` : '/',
              errorCallbackURL: '/sign-in'
            })
          }}
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          Sign in with Microsoft
        </button>
      </div>
    </main>
  )
}