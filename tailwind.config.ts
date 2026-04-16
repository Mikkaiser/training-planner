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
        "tp-secondary": "var(--color-secondary)",
        "tp-accent": "var(--color-accent)",
        positive: "var(--color-positive)",
        negative: "var(--color-negative)",
        "accent-border": "var(--color-border)",

        background: "var(--color-base)",
        foreground: "rgba(244, 253, 217, 0.7)",
        card: "rgba(35, 39, 61, 0.7)",
        "card-foreground": "rgba(244, 253, 217, 0.7)",
        popover: "rgba(35, 39, 61, 0.9)",
        "popover-foreground": "rgba(244, 253, 217, 0.8)",
        primary: {
          DEFAULT: "var(--color-accent)",
          foreground: "rgba(28, 31, 51, 0.95)",
        },
        secondary: {
          DEFAULT: "rgba(244, 253, 217, 0.08)",
          foreground: "var(--color-secondary)",
        },
        muted: {
          DEFAULT: "rgba(244, 253, 217, 0.06)",
          foreground: "rgba(244, 253, 217, 0.7)",
        },
        accent: {
          DEFAULT: "rgba(219, 253, 107, 0.14)",
          foreground: "var(--color-secondary)",
        },
        destructive: {
          DEFAULT: "var(--color-negative)",
          foreground: "var(--color-secondary)",
        },
        border: "var(--color-border)",
        input: "rgba(244, 253, 217, 0.08)",
        ring: "rgba(219, 253, 107, 0.35)",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(219, 253, 107, 0.15), 0 8px 30px rgba(219, 253, 107, 0.08)",
      },
      backgroundImage: {
        "accent-radial":
          "radial-gradient(800px circle at var(--glow-x, 40%) var(--glow-y, 20%), rgba(219, 253, 107, 0.12), transparent 55%)",
      },
      borderRadius: {
        lg: "12px",
        xl: "16px",
      },
    },
  },
  plugins: [],
};

export default config;

