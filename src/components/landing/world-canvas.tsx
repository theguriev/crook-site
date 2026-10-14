"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Where the reader is, as a fractional station: section i of the `[data-station]` sections is
 * station i. The camera holds still while the copy of a section is read, and flies to the next one
 * in the last stretch before it.
 */
function readStation() {
  const els = [...document.querySelectorAll<HTMLElement>("[data-station]")];
  if (els.length === 0) return 0;
  const y = window.scrollY + window.innerHeight * 0.4;
  const tops = els.map((e) => e.getBoundingClientRect().top + window.scrollY);
  for (let i = 0; i < els.length - 1; i++) {
    if (y < tops[i + 1]) {
      const frac = Math.max(0, (y - tops[i]) / (tops[i + 1] - tops[i]));
      return i + Math.min(1, Math.max(0, (frac - 0.45) / 0.55));
    }
  }
  return els.length - 1;
}

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!c.getContext("webgl2");
  } catch {
    return false;
  }
}

/** The harbour behind the landing: fixed to the viewport, driven by the scroll. */
export function WorldCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !hasWebGL()) return;
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const lite = window.innerWidth < 768 || (navigator.hardwareConcurrency ?? 8) <= 4;
      // the world draws labels on canvases in the page's own fonts
      await document.fonts.ready;
      const { createWorld } = await import("./world");
      if (disposed) return;
      let world: ReturnType<typeof createWorld>;
      try {
        world = createWorld(canvas, { lite, still });
      } catch {
        return; // no world, the fallback backdrop stays
      }
      world.setStation(readStation(), true);
      requestAnimationFrame(() => setReady(true));

      const onScroll = () => world.setStation(readStation());
      const onResize = () => {
        world.resize();
        onScroll();
      };
      const onPointer = (e: PointerEvent) => {
        if (e.pointerType !== "mouse") return;
        world.setPointer((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onResize);
      window.addEventListener("pointermove", onPointer, { passive: true });
      cleanup = () => {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onResize);
        window.removeEventListener("pointermove", onPointer);
        world.dispose();
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return (
    <div aria-hidden className="world-backdrop pointer-events-none fixed inset-0 z-0">
      <canvas ref={ref} className={cn("block size-full transition-opacity duration-[1400ms]", ready ? "opacity-100" : "opacity-0")} />
    </div>
  );
}

/** The chapter ticks down the right edge; the current one is long and lit. */
export function ChapterRail({ chapters }: { chapters: { id: string; label: string }[] }) {
  const [at, setAt] = useState(0);
  useEffect(() => {
    const on = () => setAt(Math.round(readStation()));
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <nav aria-label="Chapters" className="fixed top-1/2 right-5 z-20 hidden -translate-y-1/2 lg:block">
      <ol className="m-0 grid list-none gap-1 p-0">
        {chapters.map((c, i) => (
          <li key={c.id}>
            <a
              href={`#${c.id}`}
              aria-current={i === at ? "true" : undefined}
              className="group flex items-center justify-end gap-3 py-1.5 font-mono text-[11px] tracking-[0.12em] text-white/0 uppercase no-underline transition-colors hover:text-white/70 aria-[current]:text-white/80"
            >
              <span>{c.label}</span>
              <i
                className={cn(
                  "block h-px bg-white/35 transition-all duration-500 group-hover:bg-white/80",
                  i === at ? "w-7 bg-yolk!" : "w-3.5",
                )}
              />
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
