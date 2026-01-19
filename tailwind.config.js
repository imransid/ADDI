/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#C49A6C',
        secondary: '#E5E7EB',
        accent: '#A46C4A',
      },
    },
  },
  plugins: [],
};