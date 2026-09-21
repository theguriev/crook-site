import type { Metadata } from "next";
import { PluginsPage } from "@/components/plugins/plugins-page";
import { PLUGINS } from "@/data/plugins";

export const metadata: Metadata = {
  title: "Plugins",
  description:
    "Every plugin Crook can offer, built from source by CI and published as one static file. Search by what a plugin does, where it draws, or what it asks to be allowed.",
};

export default function Page() {
  return <PluginsPage plugins={PLUGINS} />;
}
