import { type AppType } from 'next/app'
import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { Analytics } from '@vercel/analytics/react'
import { appWithTranslation } from 'next-i18next'

import '~/styles/globals.css'
import Maintenance from '~/components/UIUC-Components/Maintenance'

import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

// PostHog initialization code remains the same...

const MyApp: AppType = ({ Component, pageProps: { ...pageProps } }) => {
  const router = useRouter()
  const queryClient = new QueryClient()

  // PostHog useEffect remains the same...

  if (process.env.NEXT_PUBLIC_MAINTENANCE === 'true') {
    return <Maintenance />
  } else {
    return (
      <PostHogProvider client={posthog}>
        <QueryClientProvider client={queryClient}>
          <ReactQueryDevtools
            initialIsOpen={false}
            position="left"
            buttonPosition="bottom-left"
          />
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
                backgroundColors: ['#2e026d', '#020307'],
                nearlyBlack: ['#0E1116'],
                nearlyWhite: ['#F7F7F7'],
                disabled: ['#2A2F36'],
                errorBackground: ['#dc2626'],
                errorBorder: ['#dc2626'],
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
            <Notifications position="bottom-center" zIndex={2077} />
            <Component {...pageProps} />
            <Analytics />
          </MantineProvider>
        </QueryClientProvider>
      </PostHogProvider>
    )
  }
}

export default appWithTranslation(MyApp)