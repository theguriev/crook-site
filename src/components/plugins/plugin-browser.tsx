"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { SearchIcon, XIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PluginCard } from "@/components/plugins/plugin-card";
import { PluginSheet } from "@/components/plugins/plugin-sheet";
import {
  ABI,
  ASK_FILTER_LABEL,
  askKinds,
  INDEX_BUILT,
  pluginId,
  WHERE_FILTER_LABEL,
  type AskFilter,
  type Plugin,
  type Where,
} from "@/data/plugins";
import { cn } from "@/lib/utils";

type Sort = "least" | "name" | "version";
const SORTS: Record<Sort, string> = {
  least: "Asks for the least first",
  name: "Name A → Z",
  version: "Highest version first",
};
const ASKS = Object.keys(ASK_FILTER_LABEL) as AskFilter[];
const WHERES = Object.keys(WHERE_FILTER_LABEL) as Where[];

function subscribeHash(cb: () => void) {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
}
function readHash() {
  const hash = location.hash.replace(/^#/, "");
  // A link can arrive mangled — cut short mid-escape, or with a stray `%` — and decoding it
  // throws, which took the whole page down with it. What cannot be decoded names no plugin.
  try {
    return decodeURIComponent(hash);
  } catch {
    return hash;
  }
}

function score(p: Plugin, q: string) {
  if (!q) return 1;
  const hay = `${p.name} ${p.owner} ${p.blurb} ${p.keywords} ${p.asks.map((a) => a.text).join(" ")} ${p.whereText}`.toLowerCase();
  let s = 0;
  for (const t of q.toLowerCase().split(/\s+/).filter(Boolean)) {
    if (p.name.startsWith(t)) s += 4;
    else if (p.name.includes(t)) s += 3;
    else if (hay.includes(t)) s += 1;
    else return 0;
  }
  return s;
}

export function PluginBrowser({ plugins, onAdd }: { plugins: Plugin[]; onAdd: () => void }) {
  const [q, setQ] = useState("");
  const [asks, setAsks] = useState<Set<AskFilter>>(new Set());
  const [wheres, setWheres] = useState<Set<Where>>(new Set());
  const [sort, setSort] = useState<Sort>("least");
  const input = useRef<HTMLInputElement>(null);

  // The open card is the URL hash, so a link to #owner/name opens it and the address bar follows.
  const hash = useSyncExternalStore(subscribeHash, readHash, () => "");
  const open = useMemo(() => plugins.find((p) => pluginId(p) === hash || p.name === hash) ?? null, [plugins, hash]);

  const counts = useMemo(() => {
    const c: Partial<Record<AskFilter, number>> = {};
    for (const p of plugins) for (const k of askKinds(p)) c[k] = (c[k] ?? 0) + 1;
    return c;
  }, [plugins]);

  const rows = useMemo(() => {
    const out = plugins
      .map((p) => ({ p, s: score(p, q) }))
      .filter(({ p, s }) => {
        if (!s) return false;
        const k = askKinds(p);
        if (asks.size && ![...asks].every((a) => k.includes(a))) return false;
        if (wheres.size && ![...wheres].some((w) => p.where.includes(w))) return false;
        return true;
      });
    out.sort((a, b) => {
      if (q && b.s !== a.s) return b.s - a.s;
      if (sort === "least" && a.p.asks.length !== b.p.asks.length) return a.p.asks.length - b.p.asks.length;
      if (sort === "version") {
        const d = b.p.version.localeCompare(a.p.version, undefined, { numeric: true });
        if (d) return d;
      }
      return a.p.name.localeCompare(b.p.name);
    });
    return out.map((r) => r.p);
  }, [plugins, q, asks, wheres, sort]);

  const filtering = asks.size > 0 || wheres.size > 0;

  // "/" focuses the search unless a dialog has the keyboard.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== input.current && !(e.target as HTMLElement)?.closest("[role=dialog]")) {
        e.preventDefault();
        input.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function openCard(p: Plugin | null) {
    try {
      history.replaceState(null, "", p ? `#${pluginId(p)}` : location.pathname);
    } catch {
      /* history may be unavailable in an embedded viewer */
    }
    window.dispatchEvent(new Event("hashchange"));
  }

  const toggle = <T,>(set: Set<T>, v: T) => {
    const n = new Set(set);
    if (n.has(v)) n.delete(v);
    else n.add(v);
    return n;
  };

  return (
    <>
      <div
        className={cn(
          "mt-6 flex h-12.5 items-center gap-3 rounded-xl border-[1.5px] border-input bg-card pr-2.5 pl-4 transition-colors focus-within:border-yolk sm:h-14",
        )}
      >
        <SearchIcon className="size-5 shrink-0 text-muted-foreground" />
        <input
          ref={input}
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search plugins: branch, sound, clipboard, api.anthropic.com…"
          aria-label="Search plugins"
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground sm:text-[17px] [&::-webkit-search-cancel-button]:hidden"
        />
        {q && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setQ("");
              input.current?.focus();
            }}
            className="inline-flex rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <XIcon className="size-4" />
          </button>
        )}
        <kbd className="hidden sm:inline-block">/</kbd>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="mr-1 font-mono text-[12.5px] font-medium text-muted-foreground">asks for</span>
        {ASKS.map((a) => (
          <Chip key={a} on={asks.has(a)} onClick={() => setAsks(toggle(asks, a))}>
            {ASK_FILTER_LABEL[a]} <span className="font-mono text-[11.5px] opacity-70">{counts[a] ?? 0}</span>
          </Chip>
        ))}
        <span className="w-3" />
        <span className="mr-1 font-mono text-[12.5px] font-medium text-muted-foreground">draws in</span>
        {WHERES.map((w) => (
          <Chip key={w} on={wheres.has(w)} onClick={() => setWheres(toggle(wheres, w))}>
            {WHERE_FILTER_LABEL[w]}
          </Chip>
        ))}
      </div>

      <div className="mt-6 mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
        <span className="text-ink-2">{rows.length === plugins.length ? `${plugins.length} plugins` : `${rows.length} of ${plugins.length} plugins`}</span>
        <span className="hidden sm:inline">
          index built {INDEX_BUILT} · ABI {ABI}
        </span>
        <Select value={sort} onValueChange={(v) => v && setSort(v as Sort)} items={SORTS}>
          <SelectTrigger aria-label="Sort" className="h-8.5 w-full sm:ml-auto sm:w-auto">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(SORTS) as Sort[]).map((k) => (
              <SelectItem key={k} value={k}>
                {SORTS[k]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {rows.length ? (
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((p) => (
            <PluginCard key={p.name} plugin={p} onOpen={openCard} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-line-2 bg-card p-10 text-center text-ink-2">
          {/* What ruled everything out, rather than the search alone: with the box empty and
              the chips doing the ruling out, this used to say `Nothing matches ""`. */}
          <b className="mb-1.5 block font-heading text-xl text-foreground">
            {q ? (
              <>
                Nothing matches &ldquo;{q}&rdquo;{filtering ? " with these filters" : ""}.
              </>
            ) : (
              "No plugin fits these filters."
            )}
          </b>
          {asks.size > 0
            ? "A plugin has to ask for every permission ticked, so fewer ticks find more."
            : "Try what it draws or what it asks for, or write the one that is missing."}
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {filtering && (
              <Button
                variant="outline"
                onClick={() => {
                  setAsks(new Set());
                  setWheres(new Set());
                }}
              >
                Clear filters
              </Button>
            )}
            <Button variant="outline" onClick={onAdd}>
              Add a plugin
            </Button>
          </div>
        </div>
      )}

      <PluginSheet plugin={open} onClose={() => openCard(null)} />
    </>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-input px-3 py-1.75 text-[13.5px] text-ink-2 transition-colors hover:bg-muted sm:py-1.25",
        on && "border-foreground bg-foreground text-background hover:bg-foreground",
      )}
    >
      {children}
    </button>
  );
}
