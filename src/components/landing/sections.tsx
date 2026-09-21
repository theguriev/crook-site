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

/** Text on one side, a picture on the other. `flip` puts the picture first on wide screens. */
export function Feature({
  id,
  flip,
  eyebrow,
  title,
  children,
  aside,
}: {
  id: string;
  flip?: boolean;
  eyebrow: React.ReactNode;
  title: string;
  children: React.ReactNode;
  aside: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-16 border-b border-border py-14 sm:py-21">
      <Container
        className={cn(
          "grid items-start gap-12 md:grid-cols-[minmax(0,.7fr)_minmax(0,1.3fr)]",
          flip && "md:grid-cols-[minmax(0,1.3fr)_minmax(0,.7fr)]",
        )}
      >
        <div className={cn("md:sticky md:top-22", flip && "md:order-2")}>
          {eyebrow}
          <h2 className="mt-3 mb-4 text-[28px] leading-[1.1] font-bold sm:text-[34px]">{title}</h2>
          <div className="[&_p]:max-w-[48ch] [&_p]:text-ink-2 [&_p+p]:mt-3">{children}</div>
        </div>
        <div className={cn(flip && "md:order-1")}>{aside}</div>
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

export function FactsStrip() {
  const facts = [
    ["tab", "One agent, its transcript and its branch"],
    ["status", "Written by the agent itself, over the terminal it already has"],
    ["output", "A list of commands, each with everything it printed"],
    ["plugins", "Sandboxed .wasm that must ask before it reaches anything"],
  ];
  return (
    <section className="border-b border-border bg-muted">
      <Container className="grid sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-4 lg:gap-0">
        {facts.map(([k, v], i) => (
          <div
            key={k}
            className={cn(
              "border-b border-border py-4 last:border-b-0 sm:py-4.5 lg:border-b-0 lg:border-r lg:py-5.5 lg:pr-6 lg:last:border-r-0",
              i > 0 && "lg:pl-6",
            )}
          >
            <div className="mb-1.5 font-mono text-[12.5px] text-muted-foreground">{k}</div>
            <div className="font-heading text-[17px] leading-[1.3] font-semibold sm:text-[18px]">{v}</div>
          </div>
        ))}
      </Container>
    </section>
  );
}

export function PluginTile({ name, blurb, href }: { name: string; blurb: string; href: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 rounded-[10px] border border-border bg-card px-3 py-2.5 no-underline transition-colors hover:border-line-2"
    >
      <Image src={`/plugins/${name}/icon.png`} alt="" width={32} height={32} className="size-8 shrink-0 rounded-lg" />
      <span>
        <b className="block text-[14.5px] leading-[1.2] font-semibold">{name}</b>
        <span className="mt-0.5 block text-[12.5px] leading-[1.3] text-muted-foreground">{blurb}</span>
      </span>
    </Link>
  );
}
