import { type AppType } from 'next/app'
import { type Session } from 'next-auth'
import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { Analytics } from '@vercel/analytics/react'
import { appWithTranslation } from 'next-i18next'
import { ClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/themes'

import { api } from '~/utils/api'

import '~/styles/globals.css'
import Maintenance from '~/components/UIUC-Components/Maintenance'
import clearLocalStorageOnce from 'src/pages/api/UIUC-api/clearLocalStorage'

import { useReportWebVitals } from 'next-axiom'

// For axiom Web Vitals logging: https://axiom.co/docs/apps/vercel#sending-logs-to-axiom
import { NextWebVitalsMetric } from 'next/app'

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  useReportWebVitals(((metric: NextWebVitalsMetric) => {
    console.log(metric)
  }) as any)

  if (process.env.NEXT_PUBLIC_MAINTENANCE === 'true') {
    return <Maintenance />
  } else {
    // ! This seems to cause huge bugs with streaming answers!
    // if (typeof window !== 'undefined') { // Check for window object to make sure we are in the client
    //   clearLocalStorageOnce(); // Clear local storage once per user
    // }


    return (
      <ClerkProvider
        appearance={{
          baseTheme: dark,
        }}
        {...pageProps}
      >
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
          <Notifications position="bottom-center" zIndex={2077} />
          <Component {...pageProps} />
          <Analytics />
        </MantineProvider>
      </ClerkProvider>
    )
  }
}

// export default .withTRPC(MyApp)

export default api.withTRPC(appWithTranslation(MyApp))
