import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#17211f",
        mist: "#f4f7f5",
        moss: "#5f7f6f",
        ember: "#c96f38",
        skyglass: "#dcebed",
      },
      boxShadow: {
        soft: "0 14px 45px rgba(23, 33, 31, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
