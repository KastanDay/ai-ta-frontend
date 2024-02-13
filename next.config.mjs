// next.config.mjs
/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
await import('./src/env.mjs')
import nextI18NextConfig from './next-i18next.config.mjs'
import path from 'path'
import withBundleAnalyzer from '@next/bundle-analyzer'
import { withAxiom } from 'next-axiom'
import withTM from 'next-transpile-modules'

const bundleAnalyzerConfig = {
  enabled: process.env.ANALYZE === 'true',
}

/** @type {import("next").NextConfig} */
const config = {
  i18n: nextI18NextConfig.i18n,

  /**
   * If you have `experimental: { appDir: true }` set, then you must comment the below `i18n` config
   * out.
   *
   * @see https://github.com/vercel/next.js/issues/41980
   */
  // i18n: {
  //   locales: ['en'],
  //   defaultLocale: 'en',
  // },
  images: {
    domains: [
      'images.unsplash.com',
      'github.com',
      'uiuc-chatbot.s3.us-east-1.amazonaws.com',
    ],
  },
  experimental: {
    esmExternals: false, // To make upload thing work with /pages router.
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,PUT,POST,DELETE,OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value:
              'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept',
          },
        ],
      },
    ]
  },
}

const withAxiomConfig = withAxiom(config)
const withBundleAnalyzerConfig =
  withBundleAnalyzer(bundleAnalyzerConfig)(config)
const withTMConfig = withTM(['rowstack'])(withBundleAnalyzerConfig)

export default {
  ...withAxiomConfig,
  ...withTMConfig,
}
