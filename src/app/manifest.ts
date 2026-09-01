import type { MetadataRoute } from "next";

/**
 * Web App Manifest (spec: PWA installability). Lets Android/Chrome and
 * desktop browsers install Orbits to the home screen / app list with the
 * real brand icon, name, and theme colors instead of a generic globe icon.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Orbits",
    short_name: "Orbits",
    description:
      "The operating layer for product teams to manage the work that doesn't fit cleanly into JIRA.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b1220",
    theme_color: "#0b1220",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
