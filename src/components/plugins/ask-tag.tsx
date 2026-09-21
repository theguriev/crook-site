import { ASK_LABEL, type AskFilter } from "@/data/plugins";
import { cn } from "@/lib/utils";

const STYLE: Record<AskFilter, string> = {
  none: "bg-tag-none text-tag-none-ink",
  files: "bg-tag-files text-tag-files-ink",
  net: "bg-tag-net text-tag-net-ink",
  shell: "bg-tag-shell text-tag-shell-ink",
  misc: "bg-tag-misc text-tag-misc-ink",
};

export function AskTag({ kind, className, children }: { kind: AskFilter; className?: string; children?: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center rounded-md px-2 py-0.75 font-mono text-xs font-medium whitespace-nowrap", STYLE[kind], className)}>
      {children ?? (kind === "none" ? "nothing" : ASK_LABEL[kind])}
    </span>
  );
}
