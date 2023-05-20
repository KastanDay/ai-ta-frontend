// next.config.mjs
/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
await import('./src/env.mjs')
import nextI18NextConfig from './next-i18next.config.mjs'
import path from 'path'
// import { nextI18NextConfig } from './next-i18next.config.ts';

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
  experimental: {
    esmExternals: false, // To make upload thing work with /pages router.
  },
}
export default config
