import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: { sans: ["var(--font-manrope)", "ui-sans-serif", "system-ui"] },
      colors: { ink: "#16202a", mist: "#f5f6f2", sea: "#4c8b8f", coral: "#de8068" },
    },
  },
  plugins: [],
};

export default config;
