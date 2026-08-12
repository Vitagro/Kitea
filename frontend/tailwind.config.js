/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        kitea: {
          navy: "#0B1F3A",
          blue: "#1D4ED8",
          amber: "#F59E0B",
        },
      },
    },
  },
  plugins: [],
};
