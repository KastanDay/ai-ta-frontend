import React from 'react'
import { Title } from '@mantine/core'
import Link from 'next/link'

const Maintenance = ({
}: {
  // Prevent search engine indexing of Maintenance page (because it'll ruin our entire search results): https://github.com/vercel/next.js/discussions/12850#discussioncomment-3335807 
  // in _document.tsx
}) => {
  return (
    <>
      {/* can't use header, it has auth in it */}
      <main className="items-left justify-left course-page-main flex min-h-screen flex-col">
        <div className="container flex flex-col items-center justify-center gap-8 px-4 py-5 ">
          <Link href="/">
            <h2 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
              UIUC Course{' '}
              <span className="${inter.style.fontFamily} text-[hsl(280,100%,70%)]">
                AI
              </span>
            </h2>
          </Link>
          <br></br>
          <Title order={1}>UIUC.chat is down for maintenance</Title>
        </div>
        <div className="items-left container flex flex-col justify-center gap-12 px-20 py-16 "></div>
      </main>
    </>
  )
}

export default Maintenance
