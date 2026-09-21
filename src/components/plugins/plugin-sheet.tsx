"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { CopyCommand } from "@/components/copy-command";
import { AskTag } from "@/components/plugins/ask-tag";
import { ABI, ASK_LABEL, iconSrc, pluginId, type Plugin } from "@/data/plugins";
import { REGISTRY_URL } from "@/data/site";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-2.5 font-mono text-[12.5px] font-medium tracking-[0.02em] text-muted-foreground">{children}</h3>;
}

export function PluginSheet({ plugin, onClose }: { plugin: Plugin | null; onClose: () => void }) {
  // Keep the last plugin while the sheet slides out, so the body does not vanish before the panel does.
  const [last, setLast] = useState<Plugin | null>(plugin);
  if (plugin && plugin !== last) setLast(plugin);
  const shown = plugin ?? last;
  return (
    <Sheet open={!!plugin} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        initialFocus={false}
        className="gap-0 overflow-y-auto bg-background p-0 text-base data-[side=right]:w-full data-[side=right]:sm:max-w-[560px]"
      >
        {shown && <Body plugin={shown} />}
      </SheetContent>
    </Sheet>
  );
}

function Body({ plugin }: { plugin: Plugin }) {
  const id = pluginId(plugin);
  return (
    <div className="px-5 pt-6 pb-10 sm:px-7">
      <div className="flex items-center gap-3.5 pr-11">
        <Image src={iconSrc(plugin)} alt="" width={64} height={64} className="size-16 rounded-[14px]" />
        <div>
          <SheetTitle className="font-heading text-[26px] leading-none font-bold sm:text-[30px]">{plugin.name}</SheetTitle>
          <SheetDescription className="mt-1.5 font-mono text-[13px] text-muted-foreground">
            {id} · {plugin.version} · ABI {ABI} · MIT
          </SheetDescription>
        </div>
      </div>

      <p className="mt-4.5 max-w-[52ch] text-[17px]">{plugin.blurb}</p>

      <section className="mt-6.5">
        <SectionTitle>draws in</SectionTitle>
        <p className="text-[14.5px] text-ink-2">{plugin.whereText}</p>
      </section>

      <section className="mt-6.5">
        <SectionTitle>what it asks to be allowed to do</SectionTitle>
        {plugin.asks.length ? (
          <>
            <ul className="grid list-none gap-2 p-0">
              {plugin.asks.map((a) => (
                <li key={a.text} className="flex items-start gap-2.5 rounded-[9px] border border-border bg-card px-3 py-2.5 text-[14.5px]">
                  <AskTag kind={a.kind} className="mt-px shrink-0">{ASK_LABEL[a.kind]}</AskTag>
                  <span>{a.text}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2.5 max-w-[52ch] text-[13.5px] text-muted-foreground">
              Installing is not allowing. Until its card in Plugins is answered, this plugin reaches none of it; a request outside the grant is
              refused with the sentence above.
            </p>
          </>
        ) : (
          <div className="rounded-[9px] bg-tag-none px-3 py-2.5 text-[14.5px] text-tag-none-ink">Nothing at all. It can only draw.</div>
        )}
      </section>

      <section className="mt-6.5">
        <SectionTitle>what it looks like</SectionTitle>
        {plugin.previews.length ? (
          <div className="grid gap-3.5">
            {plugin.previews.map((v) => (
              <figure key={v.src} className="m-0">
                <Image src={v.src} alt="" width={v.width} height={v.height} className="block h-auto w-full rounded-[10px] border border-line-2 bg-frame" sizes="(max-width: 640px) 100vw, 500px" />
                <figcaption className="mt-1.5 text-[13px] text-muted-foreground">{v.caption}</figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <p className="text-[13.5px] text-muted-foreground">This module carries no previews. What it does is in its description.</p>
        )}
      </section>

      <section className="mt-6.5">
        <SectionTitle>install</SectionTitle>
        <ol className="grid list-none gap-1.5 p-0 text-[14.5px] text-ink-2 [&_b]:text-foreground">
          <Step n={1}>
            In Crook, open <b>Store</b> at the foot of the sidebar and press <b>Look for plugins</b>.
          </Step>
          <Step n={2}>
            Press <b>Install</b> on {plugin.name}. One download, hashed against the list, then it runs in the window that is already open.
          </Step>
          <Step n={3}>
            Answer its card in <b>Plugins</b> if it asks for anything.
          </Step>
        </ol>
        <SectionTitle>
          <span className="mt-4 block">or by hand</span>
        </SectionTitle>
        <div className="grid gap-2">
          <CopyCommand command="crook --install-plugin ~/Downloads/plugin.wasm" className="py-2.75 pr-3 pl-3.5 text-[13.5px]" />
          <CopyCommand command={`crook --uninstall-plugin ${id}`} className="py-2.75 pr-3 pl-3.5 text-[13.5px]" />
        </div>
      </section>

      <section className="mt-6.5">
        <SectionTitle>versions</SectionTitle>
        <div className="grid gap-1.5 font-mono text-[13.5px]">
          {plugin.releases.map((r, i) => (
            <div key={r.ref} className="flex items-center gap-3 rounded-lg border border-border bg-card px-2.5 py-2">
              <span className={i === 0 ? "font-medium text-yolk-text" : ""}>{r.version}</span>
              {i === 0 && <span className="text-muted-foreground">offered</span>}
              <span className="ml-auto max-w-[200px] truncate text-muted-foreground" title={r.ref}>
                {r.ref}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6.5">
        <SectionTitle>links</SectionTitle>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" render={<Link href={plugin.repo} />}>Repository</Button>
          <Button variant="outline" render={<Link href={`${REGISTRY_URL}/blob/main/plugins/${plugin.owner}.${plugin.name}/plugin.toml`} />}>
            Registry entry
          </Button>
          <Button variant="outline" render={<Link href={`${plugin.repo}/issues`} />}>Report a problem</Button>
        </div>
      </section>
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <b className="min-w-4 font-mono text-[12.5px] font-medium text-yolk-text!">{n}</b>
      <span>{children}</span>
    </li>
  );
}
