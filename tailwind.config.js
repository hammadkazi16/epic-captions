/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',

        // MAIN APP BACKGROUND (Frase-style)
        'app-gradient': 'linear-gradient(to bottom, #0B1F3A, #0E2A47)',
      },
      colors: {
        // Backgrounds
        'bg-gradient-from': '#0B1F3A',
        'bg-gradient-to': '#0E2A47',

        // Optional semantic colors
        'navy-dark': '#0B1F3A',
        'navy-light': '#0E2A47',

        // Accent (for buttons later)
        'accent-green': '#22C55E',
      },
    },
  },
  plugins: [],
};
