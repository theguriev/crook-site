import { BellIcon } from "lucide-react";
import { PirateMark } from "@/components/pirate-mark";
import { StatusDot } from "@/components/landing/sections";
import { cn } from "@/lib/utils";

/** A frame the colour of Crook's own window, for things drawn rather than captured. */
export function Drawing({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-xl border border-line-2 bg-frame p-3.5 font-mono text-[13px] text-frame-ink shadow-lift sm:p-4.5 sm:text-sm",
        className,
      )}
      {...props}
    />
  );
}

const ROWS = [
  { kind: "run", name: "port the tab bar", branch: "eugen/tab-options", status: "running" },
  { kind: "wait", name: "sandbox the plugin host", branch: "main", status: "needs input" },
  { kind: "fail", name: "bisect the flaky test", branch: "eugen/atlas-repro", status: "failed · exit 1" },
] as const;

const HOOKS: [string, string][] = [
  ["UserPromptSubmit", "crook --agent running"],
  ["Notification", "crook --agent needs-input"],
  ["Stop", "crook --agent idle"],
];

export function AgentStatusDrawing() {
  return (
    <Drawing
      role="img"
      aria-label="A header chip reading 1 waiting, three tab rows with running, waiting and failed states, and the three Claude Code hook lines that produce them"
    >
      <div className="mb-4 flex items-center gap-3.5 border-b border-[#2b2f39] pb-3.5">
        <span className="inline-flex items-center gap-2 rounded-lg bg-[#262a33] px-3 py-1.5 font-sans text-sm whitespace-nowrap text-[#f0b354]">
          <BellIcon className="size-3.75" />1 waiting
        </span>
        <span className="ml-auto hidden font-sans text-[13px] text-frame-mute sm:block">
          (1 waiting) sandbox the plugin host — Crook
        </span>
      </div>
      <div className="grid gap-2 font-sans">
        {ROWS.map((r) => (
          <div
            key={r.name}
            className={cn(
              "grid grid-cols-[20px_1fr] items-center gap-x-2.5 gap-y-1.5 rounded-lg px-2.5 py-2.5 sm:grid-cols-[24px_1fr_auto] sm:gap-3 sm:px-3",
              r.kind === "wait" ? "bg-[#3a2f26]" : "bg-[#1f222a]",
            )}
          >
            <StatusDot kind={r.kind} className="size-3.5" />
            <div>
              <div className="text-[15px] text-[#ecebe4]">{r.name}</div>
              <div className="font-mono text-[12.5px] text-frame-mute">{r.branch}</div>
            </div>
            <span
              className={cn(
                "col-start-2 font-mono text-[11.5px] sm:col-start-auto sm:text-xs",
                r.kind === "wait" ? "text-[#f0b354]" : "text-frame-mute",
              )}
            >
              {r.status}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-1.5 border-t border-[#2b2f39] pt-3.5 text-xs sm:text-[13px]">
        <div className="text-frame-mute"># ~/.claude/settings.json, printed by --agent-hooks</div>
        {HOOKS.map(([hook, cmd]) => (
          <div key={hook} className="grid grid-cols-[minmax(0,17ch)_auto_1fr] gap-x-2">
            <span className="text-[#b09dff]">{hook}</span>
            <span>→</span>
            <span className="text-yolk">{cmd}</span>
          </div>
        ))}
      </div>
    </Drawing>
  );
}

export function PirateChipDrawing() {
  return (
    <Drawing
      className="flex items-center gap-5.5"
      role="img"
      aria-label="The pirate chip reading 47 percent, with the session meter under it"
    >
      <span className="inline-flex items-center gap-2.5 rounded-[10px] bg-[#262a33] px-3.5 py-2 font-sans text-lg text-[#ecebe4] sm:text-[22px]">
        <PirateMark className="size-6.5" />
        47%
      </span>
      <div className="flex-1 font-sans">
        <div className="flex justify-between text-sm">
          <span>
            Session <span className="text-frame-mute">resets in 3h 30m</span>
          </span>
          <span>47%</span>
        </div>
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-[3px] bg-[#2b2f39]">
          <i className="block h-full w-[47%] bg-frame-mute" />
        </div>
      </div>
    </Drawing>
  );
}
