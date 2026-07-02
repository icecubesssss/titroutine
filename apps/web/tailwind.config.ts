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
        background: "#FDFBF7", // Trắng Ngà
        foreground: "#4B4B4B", // Xám đen
        "earth-bg": "#FDFBF7",
        "earth-text": "#4B4B4B",
        "fire-red": "#FF3B30",
        "earth-brown": "#8B4513",
        "fire-orange": "#FF9500",
      },
    },
  },
  plugins: [],
};
export default config;
