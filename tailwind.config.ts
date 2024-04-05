import { type Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class', // 'media' or 'class' (media uses system settings, class uses globals.css)
  theme: {
    extend: {
      fontFamily: {
        // See fonts.ts for the other half
        montserratHeading: ['var(--font-montserratHeading)'],
        montserratParagraph: ['var(--font-montserratParagraph)'],
        // rubikPuddles: ['var(--font-rubikPuddles)'],
        // mono: ['var(--font-roboto-mono)'],
      },
    },
  },
  // plugins: [require('daisyui')],
} satisfies Config
