import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Arctic Aria",
    short_name: "Arctic Aria",
    description: "A personal planning workspace prototype.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#fcfcfd",
    theme_color: "#fcfcfd",
    icons: [
      {
        src: "/icons/pwa-icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/pwa-icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
