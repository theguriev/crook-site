import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Container({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("mx-auto max-w-[1160px] px-5 sm:px-7", className)} {...props} />;
}

export function Eyebrow({ accent, children }: { accent: string; children?: React.ReactNode }) {
  return (
    <div className="eyebrow">
      <b className="font-medium text-yolk-text">{accent}</b>
      {children}
    </div>
  );
}

/** A real snapshot, rendered by Crook's own --snapshot flag. */
export function Shot({
  src,
  alt,
  caption,
  className,
  priority,
}: {
  src: StaticImageData | string;
  alt: string;
  caption?: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <figure className={cn("m-0", className)}>
      <div className="shot">
        <Image src={src} alt={alt} priority={priority} className="block h-auto w-full" sizes="(max-width: 960px) 100vw, 720px" />
      </div>
      {caption && <figcaption className="mt-2.5 text-[13.5px] text-muted-foreground">{caption}</figcaption>}
    </figure>
  );
}

export function StatusDot({ kind, className }: { kind: "run" | "wait" | "fail" | "idle"; className?: string }) {
  const color = {
    run: "bg-status-run",
    wait: "bg-status-wait",
    fail: "bg-status-fail",
    idle: "bg-status-idle",
  }[kind];
  return <i className={cn("inline-block size-2.75 shrink-0 rounded-full", color, className)} />;
}

export function Legend() {
  return (
    <div className="grid grid-cols-2 gap-x-4.5 gap-y-1.5 px-1 text-[13.5px] text-ink-2 sm:grid-cols-4">
      <span className="flex items-center gap-2 whitespace-nowrap"><StatusDot kind="run" />running</span>
      <span className="flex items-center gap-2 whitespace-nowrap"><StatusDot kind="wait" />needs input</span>
      <span className="flex items-center gap-2 whitespace-nowrap"><StatusDot kind="fail" />failed</span>
      <span className="flex items-center gap-2 whitespace-nowrap"><StatusDot kind="idle" />idle</span>
    </div>
  );
}

/** A dark pane of frosted glass over the world, for anything that has to be read. */
export function Glass({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("glass rounded-2xl", className)} {...props} />;
}

/**
 * One stop of the voyage. The copy holds still on one side while the camera settles on what the
 * section is about on the other; the pictures come up past it after a screen of open sea.
 */
export function Chapter({
  id,
  index,
  flip,
  eyebrow,
  title,
  children,
  aside,
}: {
  id: string;
  index: number;
  flip?: boolean;
  eyebrow: React.ReactNode;
  title: string;
  children: React.ReactNode;
  aside: React.ReactNode;
}) {
  return (
    <section id={id} data-station className="relative scroll-mt-0 py-[16vh]">
      <Container className="grid items-start gap-10 md:grid-cols-2 md:gap-16">
        <div className={cn("md:sticky md:top-[14vh]", flip && "md:order-2")}>
          <Glass className="p-6 sm:p-8">
            <div className="mb-4 flex items-center gap-3 font-mono text-[11.5px] tracking-[0.18em] text-white/50 uppercase">
              <span className="text-yolk">{String(index).padStart(2, "0")}</span>
              <i className="block h-px w-8 bg-white/25" />
              {id}
            </div>
            {eyebrow}
            <h2 className="mt-3 mb-4 font-heading text-[30px] leading-[1.02] font-bold tracking-[-0.02em] uppercase sm:text-[40px]">{title}</h2>
            <div className="[&_p]:max-w-[50ch] [&_p]:text-ink-2 [&_p+p]:mt-3">{children}</div>
          </Glass>
        </div>
        <div className={cn("grid gap-5 md:pt-[78vh] md:pb-[12vh]", flip && "md:order-1")}>{aside}</div>
      </Container>
    </section>
  );
}

export function Bullets({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="mt-4 grid list-none gap-2 p-0 text-[15.5px] text-ink-2">
      {items.map((it, i) => (
        <li key={i} className="relative pl-4.5 before:absolute before:top-[.62em] before:left-0 before:size-1.5 before:rounded-full before:bg-yolk">
          {it}
        </li>
      ))}
    </ul>
  );
}

export function PluginTile({ name, blurb, href }: { name: string; blurb: string; href: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 rounded-[12px] border border-white/10 bg-white/[0.04] px-3 py-2.5 no-underline transition-colors hover:border-yolk/50 hover:bg-white/[0.07]"
    >
      <Image src={`/plugins/${name}/icon.png`} alt="" width={32} height={32} className="size-8 shrink-0 rounded-lg" />
      <span>
        <b className="block text-[14.5px] leading-[1.2] font-semibold">{name}</b>
        <span className="mt-0.5 block text-[12.5px] leading-[1.3] text-muted-foreground">{blurb}</span>
      </span>
    </Link>
  );
}
