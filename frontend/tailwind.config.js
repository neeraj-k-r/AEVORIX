/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F8FAFC',
        card: {
          surface: '#FFFFFF',
          border: '#E2E8F0',
        },
        primary: {
          DEFAULT: '#1E8885',
          hover: '#176B69',
        },
        verification: {
          bg: '#E6F4EA',
          text: '#137333',
        },
        alert: {
          bg: '#FCE8E6',
          text: '#C5221F',
        },
      },
    },
  },
  plugins: [],
}