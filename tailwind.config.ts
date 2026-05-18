import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./providers/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "rgb(var(--background) / <alpha-value>)",
        foreground: "rgb(var(--text-secondary) / <alpha-value>)",
        surface: {
          DEFAULT: "rgb(var(--surface) / <alpha-value>)",
          secondary: "rgb(var(--surface-secondary) / <alpha-value>)",
        },
        border: {
          DEFAULT: "rgb(var(--border) / <alpha-value>)",
          divider: "rgb(var(--border) / <alpha-value>)",
        },
        heading: "rgb(var(--text-primary) / <alpha-value>)",
        body: "rgb(var(--text-primary) / <alpha-value>)",
        muted: "rgb(var(--text-secondary) / <alpha-value>)",
        primary: {
          DEFAULT: "rgb(var(--primary) / <alpha-value>)",
          hover: "#B91C1C",
          soft: "rgb(var(--primary-soft) / <alpha-value>)",
          foreground: "#FFFFFF",
        },
        brand: {
          50: "#FEF2F2",
          100: "#FEE2E2",
          200: "#FECACA",
          300: "#FCA5A5",
          400: "#F87171",
          500: "#EF4444",
          600: "#DC2626",
          700: "#B91C1C",
          800: "#991B1B",
          900: "#7F1D1D",
        },
        success: {
          DEFAULT: "#16A34A",
          soft: "rgb(var(--success-soft) / <alpha-value>)",
        },
        warning: {
          DEFAULT: "#D97706",
          soft: "rgb(var(--warning-soft) / <alpha-value>)",
        },
        danger: {
          DEFAULT: "#DC2626",
          soft: "rgb(var(--danger-soft) / <alpha-value>)",
        },
        info: {
          DEFAULT: "#2563EB",
          soft: "rgb(var(--info-soft) / <alpha-value>)",
        },
        chart: {
          grid: "rgb(var(--chart-grid) / <alpha-value>)",
          tick: "rgb(var(--chart-tick) / <alpha-value>)",
          tooltip: {
            bg: "rgb(var(--chart-tooltip-bg) / <alpha-value>)",
            border: "rgb(var(--chart-tooltip-border) / <alpha-value>)",
          },
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
      boxShadow: {
        soft: "0 1px 2px 0 rgb(0 0 0 / 0.04), 0 1px 3px 0 rgb(0 0 0 / 0.06)",
        card: "0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)",
        lift: "0 4px 12px -2px rgb(0 0 0 / 0.08), 0 2px 6px -2px rgb(0 0 0 / 0.04)",
        "dark-card":
          "0 1px 3px 0 rgb(0 0 0 / 0.3), 0 1px 2px -1px rgb(0 0 0 / 0.2)",
        "dark-lift":
          "0 8px 24px -4px rgb(0 0 0 / 0.45), 0 4px 8px -4px rgb(0 0 0 / 0.3)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.35s ease-out forwards",
        shimmer: "shimmer 1.5s infinite",
      },
      spacing: {
        dashboard: "1.5rem",
        section: "2rem",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
