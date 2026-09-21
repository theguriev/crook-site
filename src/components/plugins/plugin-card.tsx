import Image from "next/image";
import { ABI, askKinds, iconSrc, pluginId, WHERE_LABEL, type Plugin } from "@/data/plugins";
import { AskTag } from "@/components/plugins/ask-tag";

export function PluginCard({ plugin, onOpen }: { plugin: Plugin; onOpen: (p: Plugin) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(plugin)}
      className="flex cursor-pointer flex-col gap-3 rounded-xl border border-border bg-card p-4 text-left text-card-foreground transition-[border-color,transform] hover:-translate-y-px hover:border-line-2 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:p-4.5"
    >
      <div className="flex items-center gap-3">
        <Image src={iconSrc(plugin)} alt="" width={44} height={44} className="size-11 shrink-0 rounded-[10px]" />
        <div>
          <div className="font-heading text-[19px] leading-[1.1] font-bold">{plugin.name}</div>
          <div className="mt-0.75 font-mono text-[12.5px] text-muted-foreground">
            {pluginId(plugin)} · {plugin.version}
          </div>
        </div>
      </div>
      <p className="text-[15px] leading-[1.45] text-ink-2 sm:min-h-[2.9em]">{plugin.blurb}</p>
      <div className="flex flex-wrap gap-1.5">
        {askKinds(plugin).map((k) => (
          <AskTag key={k} kind={k} />
        ))}
      </div>
      <div className="mt-auto flex items-center gap-2.5 border-t border-border pt-2.5 font-mono text-[12.5px] text-muted-foreground">
        <span>MIT</span>
        <span>ABI {ABI}</span>
        <span className="ml-auto text-ink-2">
          {plugin.where.length ? plugin.where.map((w) => WHERE_LABEL[w]).join(", ") : "no drawing"}
        </span>
      </div>
    </button>
  );
}
