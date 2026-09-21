"use client";

import { useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Container } from "@/components/landing/sections";
import { Button } from "@/components/ui/button";
import { PluginBrowser } from "@/components/plugins/plugin-browser";
import { AddPluginDialog } from "@/components/plugins/add-plugin-dialog";
import { INDEX_URL, type Plugin } from "@/data/plugins";
import { API_CRATE_URL, REGISTRY_URL, REPO_URL, TEMPLATE_URL } from "@/data/site";

const NAV = [
  { href: TEMPLATE_URL, label: "Write a plugin" },
  { href: API_CRATE_URL, label: "crook_plugin_api" },
  { href: REGISTRY_URL, label: "Registry on GitHub" },
];

const PROMISES: [string, React.ReactNode][] = [
  ["Built here, from the commit", "A pull request contains no binaries. The job that runs a stranger's build has a read-only token and nothing to publish with."],
  ["The description is the module's own", "Id, version, ABI, capabilities, icon and previews are read out of the built artifact by Crook's own reader."],
  ["The hash is what was built", <><code>sha256</code> catches a truncated download or a moved URL. It is not a signature and nothing here calls it one.</>],
  ["Withdrawing is a sentence", <><code>yanked = &quot;why&quot;</code> stops a version being offered and tells anybody running it what happened. The file stays put.</>],
];

export function PluginsPage({ plugins }: { plugins: Plugin[] }) {
  const [adding, setAdding] = useState(false);

  return (
    <>
      <SiteHeader
        section="Plugins"
        links={NAV}
        menuOnly={[
          { href: `${REGISTRY_URL}/blob/main/CONTRIBUTING.md`, label: "Contributing" },
          { href: REPO_URL, label: "Crook" },
        ]}
        action={
          <Button className="h-9 px-3.5 text-sm font-semibold" onClick={() => setAdding(true)}>
            Add a plugin
          </Button>
        }
      />

      <main>
        <section className="border-b border-border pt-7 pb-5 sm:pt-11 sm:pb-5.5">
          <Container>
            <h1 className="text-[clamp(28px,3.6vw,40px)] leading-[1.08] font-bold">Every plugin Crook can offer.</h1>
            <p className="mt-2 max-w-[64ch] text-ink-2">
              Built from source by CI, published as one static file, read by the same code the terminal decides with. Search by what a
              plugin does, where it draws, or what it asks to be allowed.
            </p>
            <PluginBrowser plugins={plugins} onAdd={() => setAdding(true)} />
          </Container>
        </section>

        <section className="bg-muted pt-9 pb-10">
          <Container>
            <h2 className="mb-1.5 text-[22px] font-bold">There is no server.</h2>
            <p className="max-w-[66ch] text-[15px] text-ink-2">
              The terminal fetches this one JSON file and, when somebody presses Install, one <code>.wasm</code>. It sends no account, no
              machine id and no list of what is installed. Offline, Crook shows the copy it already has.
            </p>
            <div className="my-3 mb-5.5 flex items-center gap-2.5 overflow-x-auto rounded-[9px] bg-frame px-3.5 py-2.75 font-mono text-[12.5px] text-frame-ink sm:text-[13.5px]">
              <span className="text-yolk">GET</span>
              <code className="whitespace-nowrap">{INDEX_URL}</code>
            </div>
            <div className="grid gap-5.5 sm:grid-cols-2 lg:grid-cols-4">
              {PROMISES.map(([k, v]) => (
                <div key={k}>
                  <b className="mb-1 block font-heading text-[16.5px] font-semibold">{k}</b>
                  <p className="text-sm text-ink-2">{v}</p>
                </div>
              ))}
            </div>
          </Container>
        </section>
      </main>

      <SiteFooter
        links={[
          { href: `${REGISTRY_URL}/blob/main/CONTRIBUTING.md`, label: "Contributing" },
          { href: `${REGISTRY_URL}/blob/main/CODEOWNERS`, label: "Code owners" },
          { href: REPO_URL, label: "Crook" },
        ]}
      />

      <AddPluginDialog open={adding} onOpenChange={setAdding} />
    </>
  );
}
