import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

/** Tokens in app/globals.css; theme via data-theme on <html>. */
const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      spacing: {
        ...defaultTheme.spacing,
        "1": "0.3125rem",
        "2": "0.625rem",
        "3": "0.9375rem",
        "4": "1.25rem",
        "6": "1.875rem",
        "8": "2.5rem",
        "10": "3.125rem",
        "12": "3.75rem",
        "16": "5rem",
      },
      fontFamily: {
        sans: ["Roboto", "system-ui", "sans-serif"],
      },
      fontSize: {
        "2xs": "11px",
        sm: "13px",
        base: "15px",
        nav: ["14px", { lineHeight: "1.35" }],
        stat: ["26px", { lineHeight: "1.2" }],
      },
      colors: {
        base: "var(--color-base)",
        surface: "var(--color-surface)",
        "surface-raised": "var(--color-surface-raised)",
        "tp-accent": "var(--color-accent)",
        positive: "var(--color-positive)",
        negative: "var(--color-negative)",
        "accent-border": "var(--color-border)",

        background: "var(--color-base)",
        foreground: "var(--color-text-primary)",
        card: "var(--color-surface-raised)",
        "card-foreground": "var(--color-text-primary)",
        popover: "var(--color-surface-raised)",
        "popover-foreground": "var(--color-text-primary)",
        primary: {
          DEFAULT: "var(--color-accent)",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "var(--color-accent-muted)",
          foreground: "var(--color-text-accent)",
        },
        muted: {
          DEFAULT: "var(--color-accent-muted)",
          foreground: "var(--color-text-secondary)",
        },
        accent: {
          DEFAULT: "var(--color-accent-muted)",
          foreground: "var(--color-text-primary)",
        },
        destructive: {
          DEFAULT: "var(--color-negative)",
          foreground: "var(--color-text-primary)",
        },
        border: "var(--color-border)",
        input: "var(--color-border)",
        ring: "rgba(37, 99, 235, 0.45)",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(37, 99, 235, 0.12), 0 8px 30px rgba(37, 99, 235, 0.06)",
        cta: "var(--cta-shadow)",
        "cta-hover": "var(--cta-shadow-hover)",
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
