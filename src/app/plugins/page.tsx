import type { Metadata } from "next";
import { PluginsPage } from "@/components/plugins/plugins-page";
import { PLUGINS } from "@/data/plugins";

const DESCRIPTION =
  "Every plugin Crook can offer, built from source by CI and published as one static file. Search by what a plugin does, where it draws, or what it asks to be allowed.";

export const metadata: Metadata = {
  title: "Plugins",
  description: DESCRIPTION,
  // The card would otherwise be the landing's, which the root layout writes.
  openGraph: { type: "website", siteName: "Crook", title: "Plugins · Crook", description: DESCRIPTION, url: "/plugins", images: ["/opengraph-image.jpg"] },
  twitter: { card: "summary_large_image", title: "Plugins · Crook", description: DESCRIPTION, images: ["/opengraph-image.jpg"] },
};

export default function Page() {
  return <PluginsPage plugins={PLUGINS} />;
}
