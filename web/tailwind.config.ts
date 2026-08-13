import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
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

export default config;
