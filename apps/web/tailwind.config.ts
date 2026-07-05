import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    // lib holds class-name data (room bgClass in rooms.ts, …) — without this the
    // classes only referenced there are never generated.
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--theme-bg)",
        foreground: "var(--theme-text)",
        "earth-bg": "var(--theme-bg)",
        "earth-text": "var(--theme-text)",
        "fire-red": "#FF3B30",
        "earth-brown": "var(--theme-accent)",
        "fire-orange": "#FF9500",
        "theme-bg": "var(--theme-bg)",
        "theme-text": "var(--theme-text)",
        "theme-border": "var(--theme-border)",
        "theme-accent": "var(--theme-accent)",
        "theme-accent-light": "var(--theme-accent-light)",
        "theme-accent-dark": "var(--theme-accent-dark)",
        "theme-card-bg": "var(--theme-card-bg)",
        "theme-card-border": "var(--theme-card-border)",
        "theme-btn-bg": "var(--theme-btn-bg)",
        "theme-btn-text": "var(--theme-btn-text)",
        "theme-btn-border": "var(--theme-btn-border)",
      },
    },
  },
  plugins: [],
};
export default config;
