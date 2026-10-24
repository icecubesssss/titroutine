import type { MetadataRoute } from "next";

// Makes the app installable to the home screen. No service worker yet: push
// reminders are deferred, and install alone doesn't need one.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Titroutine",
    short_name: "Titroutine",
    description: "Your Cozy Habit Tracker & Virtual Pet",
    start_url: "/",
    display: "standalone",
    background_color: "#FDFBF7",
    theme_color: "#FDFBF7",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
