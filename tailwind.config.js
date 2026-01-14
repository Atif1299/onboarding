/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#42bdd1',
          50: '#f0fafb',
          100: '#d9f2f5',
          200: '#b8e7ed',
          300: '#87d5e1',
          400: '#42bdd1',
          500: '#2ba5ba',
          600: '#26869b',
          700: '#246c7d',
          800: '#245866',
          900: '#224a57',
        },
      },
    },
  },
  plugins: [],
}
