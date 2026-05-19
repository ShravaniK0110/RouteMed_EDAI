import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      },
      colors: {
        primary: '#A1614A',
        secondary: '#F5E6D3',
        accent: '#C41E3A',
        dark: '#8C8980',
        ink: '#1E1A17',
        paper: '#FAF3EB',
        muted: '#E8D9C8',
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      boxShadow: {
        'warm': '0 2px 16px rgba(161, 97, 74, 0.12)',
        'warm-lg': '0 8px 32px rgba(161, 97, 74, 0.16)',
      }
    },
  },
  plugins: [],
};
export default config;