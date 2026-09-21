"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MenuIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PirateMark } from "@/components/pirate-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

export type NavLink = { href: string; label: string };

type Props = {
  /** Text after the wordmark, e.g. "Plugins" on the registry. */
  section?: string;
  links: NavLink[];
  /** Extra links that only appear in the mobile menu. */
  menuOnly?: NavLink[];
  /** The one action on the right: a link, or a button handled by the page. */
  action: React.ReactNode;
  /** Set on the landing, where the nav is mono to match the field. */
  mono?: boolean;
};

export function SiteHeader({ section, links, menuOnly = [], action, mono }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="relative mx-auto flex h-15 max-w-[1160px] items-center gap-3.5 px-5 sm:px-7 md:gap-7">
        <Link href="/" className="flex items-center gap-2.5 font-heading text-xl font-bold no-underline">
          <PirateMark />
          Crook
          {section && (
            <>
              <span className="mx-0.5 font-medium text-muted-foreground">/</span>
              {section}
            </>
          )}
        </Link>

        <nav className={cn("ml-auto hidden gap-5.5 md:flex", mono ? "font-mono text-sm" : "text-[15px]")}>
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-ink-2 no-underline hover:text-foreground">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <ThemeToggle />
          {action}
          <Button
            variant="outline"
            size="icon"
            className="md:hidden"
            aria-label="Menu"
            aria-expanded={open}
            aria-controls="site-menu"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <XIcon /> : <MenuIcon />}
          </Button>
        </div>

        <nav
          id="site-menu"
          aria-label="Menu"
          hidden={!open}
          className="absolute inset-x-0 top-full border-b border-border bg-background px-5 pt-2 pb-4 shadow-lift sm:px-7 md:hidden!"
        >
          {[...links, ...menuOnly].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block border-b border-border py-3.25 font-mono text-[15px] font-medium no-underline last:border-b-0"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
