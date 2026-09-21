"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  command: string;
  className?: string;
  /** Wrap long commands instead of scrolling them: always, or only below the sm breakpoint. */
  wrap?: boolean | "sm";
};

export function CopyCommand({ command, className, wrap }: Props) {
  const [done, setDone] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(command);
    } catch {
      /* a viewer without clipboard access still sees the command */
    }
    setDone(true);
    setTimeout(() => setDone(false), 1600);
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-[10px] border border-line-2 bg-frame py-3.5 pr-3.5 pl-4.5 font-mono text-[14.5px] text-frame-ink",
        wrap === true && "items-start",
        wrap === "sm" && "items-start sm:items-center",
        className,
      )}
    >
      <span className="shrink-0 text-yolk">$</span>
      <code
        className={cn(
          "min-w-0 flex-1",
          wrap === true && "break-all whitespace-pre-wrap",
          wrap === "sm" && "break-all whitespace-pre-wrap sm:overflow-x-auto sm:whitespace-nowrap",
          !wrap && "overflow-x-auto whitespace-nowrap",
        )}
      >
        {command}
      </code>
      <button
        type="button"
        onClick={copy}
        className={cn(
          "shrink-0 cursor-pointer rounded-md border px-2.5 py-1.25 font-mono text-[12.5px] font-medium transition-colors",
          done
            ? "border-yolk text-yolk"
            : "border-frame-line text-[#b7b9c0] hover:border-[#6b7080] hover:text-white",
        )}
      >
        {done ? "copied" : "copy"}
      </button>
    </div>
  );
}
