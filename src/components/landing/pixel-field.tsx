"use client";

import { useEffect, useRef } from "react";

/** The pirate mark rasterised to 23×23: y is yolk, k is the black of the eye, patch and smile. */
const PIRATE = [
  "........yyyyyyy........",
  "......yyyyyyyyyyy......",
  "....kyyyyyyyyyyyyyy....",
  "...ykkkkkkkyyyyyyyyy...",
  "..yyyyyyyyykkkkkyyyyy..",
  "..yyyykkkyykkkkkkkyyy..",
  ".yyyykkkkyykkkkkkkkyyy.",
  ".yyyykkkkyykkkkkkkkkyy.",
  "yyyyykkkkyyykkkkkkkykky",
  "yyyyyykkkyyyykkkkkkyykk",
  "yyyyyyykyyyyyyykkyyyyyy",
  "yyyyyyyyyyyyyyyyyyyyyyy",
  "yyykyyyyyyyyyyyyyyykyyy",
  "yyykyyyyyyyyyyyyyyykyyy",
  "yyykkyyyyyyyyyyyyykkyyy",
  ".yyykyyyyyyyyyyyyykyyy.",
  ".yyykkyyyyyyyyyyykkyyy.",
  "..yyykkyyyyyyyyykkyyy..",
  "..yyyykkyyyyyyykkyyyy..",
  "...yyyyykkkkkkkyyyyy...",
  "....yyyyyyyyyyyyyyy....",
  "......yyyyyyyyyyy......",
  "........yyyyyyy........",
];

const FONT: Record<string, string[]> = {
  C: [".###.", "#...#", "#....", "#....", "#....", "#...#", ".###."],
  R: ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
  O: [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  K: ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
};
const WORD = "CROOK";
const BANDS = ["#fff3b3", "#fde47f", "#F9D949", "#F9D949", "#dcbb35", "#b6971f", "#8f7615"];
const DARK = "#101116";

type Target = { x: number; y: number; s: number; c: string; k: boolean; sx: number; sy: number; d: number };
type Cell = { x: number; y: number; a: number; ph: number; sp: number };

function makeRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const ease = (u: number) => 1 - Math.pow(1 - u, 3);

type Props = {
  /** The element the wordmark is centred in; the canvas covers the whole section. */
  markRef: React.RefObject<HTMLDivElement | null>;
  sectionRef: React.RefObject<HTMLElement | null>;
};

export function PixelField({ markRef, sectionRef }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = canvasRef.current;
    const sec = sectionRef.current;
    const box = markRef.current;
    if (!cv || !sec || !box) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = 0;
    let H = 0;
    let cell = 12;
    let cells: Cell[] = [];
    let targets: Target[] = [];
    const pointer = { x: -9999, y: -9999 };
    let t0 = performance.now();
    let running = false;
    let raf = 0;

    function layout() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = sec!.getBoundingClientRect();
      W = r.width;
      H = r.height;
      cv!.width = Math.round(W * dpr);
      cv!.height = Math.round(H * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      const avail = Math.min(box!.getBoundingClientRect().width, 900);
      const L = Math.max(7, Math.min(24, Math.floor(avail / 38)));
      const p = (L * 7) / 23;
      const gap = 2 * L;
      const letters = WORD.length * 5 * L + (WORD.length - 1) * L;
      const total = 23 * p + gap + letters;
      box!.style.height = `${Math.round(7 * L)}px`;
      const b = box!.getBoundingClientRect();
      const s = sec!.getBoundingClientRect();
      const ox = b.left - s.left + (b.width - total) / 2;
      const oy = b.top - s.top;

      const next: Target[] = [];
      for (let y = 0; y < 23; y++) {
        for (let x = 0; x < 23; x++) {
          const ch = PIRATE[y].charAt(x);
          if (ch === ".") continue;
          next.push({
            x: ox + x * p,
            y: oy + y * p,
            s: p,
            c: ch === "k" ? DARK : BANDS[Math.min(6, Math.floor((y / 23) * 7))],
            k: ch === "k",
            sx: 0,
            sy: 0,
            d: 0,
          });
        }
      }
      const lx = ox + 23 * p + gap;
      for (let i = 0; i < WORD.length; i++) {
        const g = FONT[WORD.charAt(i)];
        for (let y = 0; y < 7; y++) {
          for (let x = 0; x < 5; x++) {
            if (g[y].charAt(x) !== "#") continue;
            next.push({ x: lx + i * 6 * L + x * L, y: oy + y * L, s: L, c: BANDS[y], k: false, sx: 0, sy: 0, d: 0 });
          }
        }
      }
      const rnd = makeRandom(11);
      for (const t of next) {
        t.sx = t.x + (rnd() - 0.5) * W * 0.9;
        t.sy = t.y + (rnd() - 0.5) * H * 1.2;
        t.d = rnd() * 0.45;
      }
      targets = next;

      cell = Math.max(9, Math.round(L / 2));
      const cols = Math.ceil(W / cell);
      const rows = Math.ceil(H / cell);
      const rnd2 = makeRandom(3);
      const field: Cell[] = [];
      for (let cy = 0; cy < rows; cy++) {
        for (let cx = 0; cx < cols; cx++) {
          const e = Math.max(Math.abs(cx / cols - 0.5) * 2, Math.abs(cy / rows - 0.5) * 2);
          const prob = 0.006 + 0.13 * Math.pow(e, 4);
          if (rnd2() < prob) field.push({ x: cx * cell, y: cy * cell, a: 0.05 + rnd2() * 0.12, ph: rnd2() * 6.28, sp: 0.3 + rnd2() * 0.6 });
        }
      }
      cells = field;
    }

    function draw(now: number) {
      const t = (now - t0) / 1000;
      ctx!.clearRect(0, 0, W, H);
      for (const c of cells) {
        const tw = reduce ? 1 : 0.75 + 0.25 * Math.sin(c.ph + t * c.sp);
        const dx = c.x + cell / 2 - pointer.x;
        const dy = c.y + cell / 2 - pointer.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        const glow = d < 140 ? 1 - d / 140 : 0;
        const a = Math.min(0.75, c.a * tw + glow * glow * 0.6);
        ctx!.fillStyle = `rgba(249,217,73,${a.toFixed(3)})`;
        ctx!.fillRect(c.x + 1, c.y + 1, cell - 2, cell - 2);
      }
      if (pointer.x > 0) {
        const r = 110;
        const x0 = Math.max(0, Math.floor((pointer.x - r) / cell));
        const x1 = Math.min(Math.ceil(W / cell), Math.ceil((pointer.x + r) / cell));
        const y0 = Math.max(0, Math.floor((pointer.y - r) / cell));
        const y1 = Math.min(Math.ceil(H / cell), Math.ceil((pointer.y + r) / cell));
        for (let gy = y0; gy < y1; gy++) {
          for (let gx = x0; gx < x1; gx++) {
            const ddx = gx * cell + cell / 2 - pointer.x;
            const ddy = gy * cell + cell / 2 - pointer.y;
            const dd = Math.sqrt(ddx * ddx + ddy * ddy);
            if (dd > r) continue;
            const g = 1 - dd / r;
            ctx!.fillStyle = `rgba(249,217,73,${(g * g * 0.18).toFixed(3)})`;
            ctx!.fillRect(gx * cell + 1, gy * cell + 1, cell - 2, cell - 2);
          }
        }
      }
      for (const q of targets) {
        const u = reduce ? 1 : Math.min(1, Math.max(0, (t - q.d) / 0.7));
        const e = ease(u);
        const x = q.sx + (q.x - q.sx) * e;
        const y = q.sy + (q.y - q.sy) * e;
        ctx!.fillStyle = q.c;
        ctx!.globalAlpha = q.k ? e : 0.35 + 0.65 * e;
        ctx!.fillRect(x, y, q.s + 0.5, q.s + 0.5);
        ctx!.globalAlpha = 1;
      }
    }

    function loop(now: number) {
      draw(now);
      if (running) raf = requestAnimationFrame(loop);
    }
    function start() {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(loop);
    }
    function stop() {
      running = false;
      cancelAnimationFrame(raf);
    }
    const still = () => reduce && draw(performance.now());

    const onMove = (e: PointerEvent) => {
      const r = sec!.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
      still();
    };
    const onLeave = () => {
      pointer.x = -9999;
      pointer.y = -9999;
      still();
    };
    const onResize = () => {
      layout();
      still();
    };

    sec.addEventListener("pointermove", onMove);
    sec.addEventListener("pointerleave", onLeave);
    window.addEventListener("resize", onResize);

    let io: IntersectionObserver | undefined;
    if (!reduce) {
      io = new IntersectionObserver((en) => (en[0].isIntersecting ? start() : stop()));
      io.observe(sec);
    }

    layout();
    t0 = performance.now();
    if (reduce) draw(t0);
    else start();
    document.fonts?.ready.then(onResize);

    return () => {
      stop();
      io?.disconnect();
      sec.removeEventListener("pointermove", onMove);
      sec.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", onResize);
    };
  }, [markRef, sectionRef]);

  return <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 block h-full w-full" />;
}
