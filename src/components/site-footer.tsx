import Link from "next/link";
import { PirateMark } from "@/components/pirate-mark";
import { API_CRATE_URL, REPO_URL, TEMPLATE_URL } from "@/data/site";

export function SiteFooter({ links }: { links?: { href: string; label: string }[] }) {
  const items = links ?? [
    { href: REPO_URL, label: "Source" },
    { href: "/plugins", label: "Plugin registry" },
    { href: TEMPLATE_URL, label: "Write a plugin" },
    { href: API_CRATE_URL, label: "crook_plugin_api" },
  ];
  return (
    <footer className="border-t border-border pt-8 pb-12">
      <div className="mx-auto flex max-w-[1160px] flex-wrap items-center gap-x-8 gap-y-4 px-5 text-sm text-muted-foreground sm:px-7">
        <Link href="/" className="flex items-center gap-2.5 font-heading text-[17px] font-bold text-foreground no-underline">
          <PirateMark />
          Crook
        </Link>
        <span>MIT licence · built in Rust</span>
        <ul className="m-0 flex list-none flex-wrap gap-x-5 gap-y-3 p-0 sm:ml-auto">
          {items.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="text-ink-2 no-underline hover:text-foreground">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}

