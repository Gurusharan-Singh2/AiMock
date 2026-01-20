/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // This ensures Tailwind scans all your files in src
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: "#0F285F",    // Deep Navy Blue
          lightBlue: "#eef2ff", // Light Background
          orange: "#F59E0B",  // Accent Orange
          text: "#1E293B",    // Slate Text
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)'], 
      },
    },
  },
  plugins: [],
};