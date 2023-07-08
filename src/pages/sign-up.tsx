import { SignUp } from '@clerk/nextjs'

export default function Page() {
  return (
    <>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#0E1116]">
        <div className="container flex flex-col items-center justify-center gap-8 px-4 py-16 ">
          <SignUp />
        </div>
      </main>
    </>
  )
}
