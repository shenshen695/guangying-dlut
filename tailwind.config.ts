import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["var(--font-manrope)", "ui-sans-serif", "system-ui"] },
      // 光影大工 Product V2：深墨色、大工蓝青与少量 Golden Hour 暖色。
      colors: { ink: "#0f172a", mist: "#f8fafc", sea: "#155e63", coral: "#f59e0b" },
    },
  },
  plugins: [],
};

export default config;
