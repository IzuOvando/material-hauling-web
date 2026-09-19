import type { Config } from "tailwindcss";
const { fontFamily } = require("tailwindcss/defaultTheme");

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      fontFamily: {
        sans: ["var(--montserrat)", ...fontFamily.sans],
      },
      colors: {
        primary: {
          DEFAULT: "rgb(var(--primary-color) / <alpha-value>)",
          dark: "rgb(var(--primary-dark-color) / <alpha-value>)",
          light: "rgb(var(--primary-light-color) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "rgb(var(--secondary-color) / <alpha-value>)",
          dark: "rgb(var(--secondary-dark-color) / <alpha-value>)",
          light: "rgb(var(--secondary-light-color) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--accent-color) / <alpha-value>)",
          dark: "rgb(var(--accent-dark-color) / <alpha-value>)",
          light: "rgb(var(--accent-light-color) / <alpha-value>)",
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;
