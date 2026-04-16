import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: "var(--color-base)",
        surface: "var(--color-surface)",
        secondary: "var(--color-secondary)",
        accent: "var(--color-accent)",
        positive: "var(--color-positive)",
        negative: "var(--color-negative)",
        border: "var(--color-border)",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(219, 253, 107, 0.15), 0 8px 30px rgba(219, 253, 107, 0.08)",
      },
      backgroundImage: {
        "accent-radial":
          "radial-gradient(800px circle at var(--glow-x, 40%) var(--glow-y, 20%), rgba(219, 253, 107, 0.12), transparent 55%)",
      },
      borderRadius: {
        xl: "16px",
      },
    },
  },
  plugins: [],
};

export default config;

