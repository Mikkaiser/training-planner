import type { MetadataRoute } from "next";

/**
 * Makes the app installable, so adding it to a phone home screen gives the
 * logo rather than a screenshot of whatever page was open.
 *
 * The icons are the maskable-safe app icon: the mark sits well inside the
 * rounded tile, so Android's circular and squircle masks crop the padding
 * rather than the squares.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Training Planner",
    short_name: "trainingplanner",
    description: "WorldSkills Software Development training planner",
    start_url: "/",
    display: "standalone",
    background_color: "#f8f9f2",
    theme_color: "#1a1c16",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
