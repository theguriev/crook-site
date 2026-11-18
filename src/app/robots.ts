import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/healthz" },
    sitemap: "https://crook.id/sitemap.xml",
  };
}
