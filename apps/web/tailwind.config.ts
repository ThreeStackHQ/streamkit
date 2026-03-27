import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#080e12",
          accent: "#06b6d4",
        },
      },
    },
  },
  plugins: [],
};

export default config;
