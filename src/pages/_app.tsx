import { type AppType } from 'next/app'
import { type Session } from 'next-auth'
import { SessionProvider } from 'next-auth/react'
import { MantineProvider } from '@mantine/core'
import { Analytics } from '@vercel/analytics/react'
import { appWithTranslation } from 'next-i18next'

import { api } from '~/utils/api'

import '~/styles/globals.css'

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  return (
    // <SessionProvider session={session}>
    <MantineProvider
      withGlobalStyles
      withNormalizeCSS
      theme={{
        colorScheme: 'dark',
        colors: {
          // Add your color
          deepBlue: ['#E9EDFC', '#C1CCF6', '#99ABF0' /* ... */],
          lime: ['#a3e635', '#65a30d', '#365314' /* ... */],
          aiPurple: ['#C06BF9'],
          // or replace default theme color
          // blue: ['#E9EDFC', '#C1CCF6', '#99ABF0' /* ... */],
        },
        // primaryColor: 'aiPurple',

        shadows: {
          // md: '1px 1px 3px rgba(0, 0, 0, .25)',
          // xl: '5px 5px 3px rgba(0, 0, 0, .25)',
        },

        headings: {
          fontFamily: 'Montserrat, Roboto, sans-serif',
          sizes: {
            h1: { fontSize: '3rem' },
            h2: { fontSize: '2.2rem' },
          },
        },
        defaultGradient: {
          from: '#dc2626',
          to: '#431407',
          deg: 80,
        },
      }}
    >
      <Component {...pageProps} />
      <Analytics />
    </MantineProvider>
    // </SessionProvider>
  )
}

// export default .withTRPC(MyApp)

export default api.withTRPC(appWithTranslation(MyApp))
