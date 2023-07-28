import { DocumentProps, Head, Html, Main, NextScript } from 'next/document'

import i18nextConfig from '../../next-i18next.config.mjs'

type Props = DocumentProps & {
  // add custom document props
}

export default function Document(props: Props) {
  const currentLocale =
    props.__NEXT_DATA__.locale ?? i18nextConfig.i18n.defaultLocale

  if (process.env.NEXT_PUBLIC_MAINTENANCE === 'true') {
    return (
      <Html lang={currentLocale}>
        <Head>
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-title" content="Chatbot UI"></meta>
          {/* Prevent search engine indexing of Maintenance page: https://github.com/vercel/next.js/discussions/12850#discussioncomment-3335807  */}
          <meta name="robots" content="noindex" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }

  return (
    <Html lang={currentLocale}>
      <Head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Chatbot UI"></meta>
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
