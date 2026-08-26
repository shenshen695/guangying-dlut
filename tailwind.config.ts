import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["var(--font-manrope)", "ui-sans-serif", "system-ui"] },
      colors: { ink: "#16202a", mist: "#f5f6f2", sea: "#4c8b8f", coral: "#de8068" },
    },
  },
  plugins: [],
};

export default config;
