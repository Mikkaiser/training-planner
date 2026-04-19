import type { Config } from "tailwindcss";

/** Tokens in app/globals.css; theme via data-theme on <html>. */
const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-comfortaa)", "ui-sans-serif", "system-ui", "sans-serif"],
        heading: ["var(--font-poppins)", "ui-sans-serif", "sans-serif"],
        comfortaa: ["var(--font-comfortaa)", "ui-sans-serif", "sans-serif"],
        poppins: ["var(--font-poppins)", "ui-sans-serif", "sans-serif"],
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
        card: "rgba(9, 14, 26, 0.6)",
        "card-foreground": "var(--color-text-primary)",
        popover: "rgba(9, 14, 26, 0.8)",
        "popover-foreground": "var(--color-text-primary)",
        primary: {
          DEFAULT: "var(--color-accent)",
          foreground: "#090e1a",
        },
        secondary: {
          DEFAULT: "var(--color-accent-muted)",
          foreground: "var(--color-accent)",
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
        input: "rgba(0, 212, 255, 0.12)",
        ring: "rgba(0, 212, 255, 0.35)",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(0, 212, 255, 0.15), 0 8px 30px rgba(0, 212, 255, 0.08)",
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
