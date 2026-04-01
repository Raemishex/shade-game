import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: "#C8A44E",
        dark: "#0D0D0C",
        cream: "#E8E4D8",
        green: "#B8D4A8",
        blue: "#A8C4E0",
        orange: "#E0C4A8",
        red: "#E8593C",
        pink: "#F0997B",
      },
      fontFamily: {
        nunito: ["Nunito", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
