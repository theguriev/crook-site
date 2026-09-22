"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowRightIcon, DownloadIcon, PlayIcon } from "lucide-react";
import { CopyCommand } from "@/components/copy-command";
import { PixelField } from "@/components/landing/pixel-field";
import { INSTALL_COMMAND, RELEASE_LINE, RELEASES_URL, VERSION } from "@/data/site";

/** The first section. Deliberately one look in both themes. */
export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const markRef = useRef<HTMLDivElement>(null);

  return (
    <section
      ref={sectionRef}
      id="top"
      className="relative overflow-hidden border-b border-[#22252e] bg-[#0c0d11] px-5 py-10 text-center text-[#e8e6dc] sm:px-7 sm:py-16 sm:pb-18"
    >
      <PixelField markRef={markRef} sectionRef={sectionRef} />
      <div className="relative z-10 mx-auto flex max-w-[960px] flex-col items-center">
        <Link
          href={RELEASES_URL}
          className="inline-flex max-w-full items-center gap-2.5 border border-yolk/40 bg-[#0c0d11]/70 px-3.5 py-1.75 font-mono text-[12px] text-yolk no-underline transition-colors hover:border-yolk hover:bg-yolk hover:text-[#0c0d11] sm:text-[13px]"
        >
          <span className="text-left">{VERSION} — {RELEASE_LINE}</span>
          <ArrowRightIcon className="size-3.5 shrink-0" />
        </Link>

        <div ref={markRef} role="img" aria-label="Crook, with the pirate mark" className="my-8 h-30 w-full sm:mt-11 sm:mb-10" />

        <h1 className="max-w-[30ch] font-mono text-[clamp(22px,2.7vw,32px)] leading-[1.25] font-medium tracking-[-0.01em] text-[#ecebe4]">
          A terminal whose unit of work is an agent, not a tab.
        </h1>
        <p className="mt-4 max-w-[80ch] font-mono text-[15px] leading-[1.7] text-[#a0a3ac] [&>span]:block [&>span]:text-balance">
          <span>A tab is one agent&rsquo;s workspace: its transcript, its directory, its state.</span>
          <span>The panel lists what is being worked on. A dot on each row says how it is going.</span>
        </p>

        <div className="mt-8.5 flex flex-wrap justify-center gap-3">
          <a
            href="#install"
            className="inline-flex h-10.5 items-center gap-2.25 rounded-[3px] border border-yolk bg-yolk px-4.5 font-mono text-[15px] font-medium text-[#0c0d11] no-underline transition-colors hover:border-[#ffe76a] hover:bg-[#ffe76a] active:scale-[.97]"
          >
            <DownloadIcon className="size-4.5" />
            Get Crook
          </a>
          <a
            href="#agent"
            className="inline-flex h-10.5 items-center gap-2.25 rounded-[3px] border border-[#3a3f4b] bg-[#0c0d11]/60 px-4.5 font-mono text-[15px] font-medium text-[#ecebe4] no-underline transition-colors hover:border-[#6b7080] hover:bg-[#1a1d24] active:scale-[.97]"
          >
            <PlayIcon className="size-4 fill-current" />
            See what it does
          </a>
        </div>

        <CopyCommand
          command={INSTALL_COMMAND}
          wrap="sm"
          className="mt-9 w-full max-w-[860px] border-[#2b2f39] bg-[#08090c] text-left text-[13.5px]"
        />
        <p className="mt-3 font-mono text-[13px] text-[#7d818c]">
          macOS and Linux. Windows is a{" "}
          <Link href={RELEASES_URL} className="text-[#a0a3ac]">
            .zip on the releases page
          </Link>
          . MIT.
        </p>
      </div>
    </section>
  );
}
