import Link from "next/link";
import { ArrowRightIcon, DownloadIcon, PlayIcon } from "lucide-react";
import { CopyCommand } from "@/components/copy-command";
import { INSTALL_COMMAND, RELEASE_LINE, RELEASES_URL, VERSION } from "@/data/site";

const FACTS = [
  ["tab", "One agent, its transcript and its branch"],
  ["status", "Written by the agent itself, over the terminal it already has"],
  ["output", "A list of commands, each with everything it printed"],
  ["plugins", "Sandboxed .wasm that must ask before it reaches anything"],
];

/** The first screen: the copy down the left, the harbour and the name in blocks behind it. */
export function Hero() {
  return (
    <section
      id="top"
      data-station
      className="relative overflow-hidden px-5 pt-24 pb-[12vh] sm:px-7 sm:pt-28"
    >
      <div className="hero-scrim pointer-events-none absolute inset-0" />

      <div className="relative mx-auto flex min-h-[calc(100svh-7rem)] w-full max-w-[1160px] flex-col justify-between">
        <div>
          <Link
            href={RELEASES_URL}
            className="hero-in inline-flex max-w-full items-center gap-2.5 rounded-full border border-yolk/35 bg-black/40 px-3.5 py-1.5 font-mono text-[12px] text-yolk no-underline backdrop-blur-md transition-colors hover:border-yolk hover:bg-yolk hover:text-[#0c0d11] sm:text-[12.5px]"
          >
            <span className="text-left">
              {VERSION} — {RELEASE_LINE}
            </span>
            <ArrowRightIcon className="size-3.5 shrink-0" />
          </Link>

          <h1 className="hero-in mt-7 max-w-[16ch] font-heading text-[clamp(32px,4.4vw,58px)] leading-[0.98] font-bold tracking-[-0.025em] text-[#f4f2ea] uppercase [animation-delay:120ms]">
            A terminal whose unit of work is an agent, not a tab.
          </h1>
          <p className="hero-in mt-5 max-w-[46ch] text-[16px] leading-[1.6] text-[#b7b9c0] [animation-delay:240ms]">
            A tab is one agent&rsquo;s workspace: its transcript, its directory, its state. The panel lists what is being worked on. A
            dot on each row says how it is going.
          </p>
        </div>

        <div className="mt-[30vh] grid items-end gap-x-6 gap-y-5 pb-2 lg:grid-cols-[auto_minmax(0,1fr)_auto]">
          <div className="hero-in flex flex-wrap gap-3 [animation-delay:360ms]">
            <a
              href="#install"
              className="inline-flex h-11 items-center gap-2.25 rounded-full border border-yolk bg-yolk px-5 font-mono text-[15px] font-medium text-[#0c0d11] no-underline transition-[background-color,border-color,scale] hover:border-[#ffe76a] hover:bg-[#ffe76a] active:scale-[.97]"
            >
              <DownloadIcon className="size-4.5" />
              Get Crook
            </a>
            <a
              href="#agent"
              className="inline-flex h-11 items-center gap-2.25 rounded-full border border-white/20 bg-black/35 px-5 font-mono text-[15px] font-medium text-[#ecebe4] no-underline backdrop-blur-md transition-[background-color,border-color,scale] hover:border-white/45 hover:bg-white/10 active:scale-[.97]"
            >
              <PlayIcon className="size-4 fill-current" />
              See what it does
            </a>
          </div>

          <div className="hero-in min-w-0 max-w-[680px] [animation-delay:480ms]">
            <CopyCommand
              command={INSTALL_COMMAND}
              wrap
              className="w-full border-white/12 bg-black/45 py-2.5 text-left text-[13px] backdrop-blur-md"
            />
            <p className="mt-2 font-mono text-[12px] text-[#8b8f9a]">
              macOS and Linux. Windows is a{" "}
              <Link href={RELEASES_URL} className="text-[#b7b9c0]">
                .zip on the releases page
              </Link>
              . MIT.
            </p>
          </div>

          <div className="hidden items-center gap-3 pb-8 font-mono text-[11px] tracking-[0.2em] text-white/45 uppercase lg:flex">
            Scroll to sail <i className="scroll-cue block h-px w-14 bg-white/30" />
          </div>
        </div>
      </div>

      <div className="glass relative mx-auto mt-[28vh] w-full max-w-[1160px] rounded-2xl px-6 py-6 sm:px-8">
        <ol className="m-0 grid list-none gap-x-6 gap-y-5 p-0 sm:grid-cols-2 lg:grid-cols-4">
          {FACTS.map(([k, v], i) => (
            <li key={k}>
              <div className="flex items-baseline gap-3">
                <span className="font-heading text-[30px] leading-none font-medium text-white/85 tabular-nums">0{i + 1}</span>
                <span className="font-mono text-[12px] text-yolk">{k}</span>
              </div>
              <p className="mt-2 text-[14.5px] leading-[1.4] text-[#b7b9c0]">{v}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
