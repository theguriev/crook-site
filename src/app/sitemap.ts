import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://crook.id/", changeFrequency: "weekly", priority: 1 },
    { url: "https://crook.id/plugins", changeFrequency: "weekly", priority: 0.7 },
  ];
}
