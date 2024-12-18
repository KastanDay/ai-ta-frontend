import { useState } from 'react'
import { authClient } from "@/lib/auth-client" 

export default function Page() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')

  const handleSignUp = async () => {
    await authClient.signUp.email({
      email,
      password,
      name,
    }, {
      onSuccess: () => {
        // Redirect to dashboard or home page
        window.location.href = '/dashboard'
      },
      onError: (ctx) => {
        alert(ctx.error.message)
      }
    })
  }

  const handleMicrosoftSignUp = async () => {
    await authClient.signIn.social({
      provider: "microsoft",
      callbackURL: "/dashboard"
    })
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#0E1116]">
      <div className="container flex flex-col items-center justify-center gap-8 px-4 py-16">
        <form className="flex flex-col gap-4 w-full max-w-md" onSubmit={(e) => {
          e.preventDefault()
          void handleSignUp()
        }}>
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="p-2 rounded"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="p-2 rounded"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="p-2 rounded"
          />
          <button
            type="submit"
            className="bg-white text-black p-2 rounded hover:bg-gray-100"
          >
            Sign Up
          </button>
        </form>
        <div className="flex items-center my-4">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-4 text-white">or</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        <button
          type="button"
          onClick={() => void handleMicrosoftSignUp()}
          className="w-full max-w-md bg-[#2F2F2F] text-white p-2 rounded hover:bg-[#404040] flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 23 23">
            <path fill="#f35325" d="M1 1h10v10H1z"/>
            <path fill="#81bc06" d="M12 1h10v10H12z"/>
            <path fill="#05a6f0" d="M1 12h10v10H1z"/>
            <path fill="#ffba08" d="M12 12h10v10H12z"/>
          </svg>
          Continue with Microsoft
        </button>
      </div>
    </main>
  )
}