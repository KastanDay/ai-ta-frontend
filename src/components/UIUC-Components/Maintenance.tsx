import React from 'react'
import { Title, Text } from '@mantine/core'
import Link from 'next/link'

const Maintenance = ({}: {
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
              UIUC.{' '}
              <span className="${inter.style.fontFamily} text-[hsl(280,100%,70%)]">
                chat
              </span>
            </h2>
          </Link>
          <br></br>
          <Title color="#fbbf24" order={1}>
            UIUC.chat is down for maintenance
          </Title>
          <Text size="lg">
            Motivation: Things to explosive product growth, accompanied by the
            start of the school year with blown pas our OpenAI/GPT-4 maximum
            budget and most core functionality is on pause while that is
            resolved. We are implementing two solutions: (1) bring your own
            OpenAI API keys. You can just enter your own to pay for your usage.
            We will still cover all other server and database costs because
            OpenAI is by far the most expensive. And (2) implementing better
            caching of responses, so simple and repeated queries are free for us
            to run. But cache invalidation is inherently complex and will take
            more time to implement properly.
          </Text>
        </div>
        <div className="items-left container flex flex-col justify-center gap-12 px-20 py-16 "></div>
      </main>
    </>
  )
}

export default Maintenance
