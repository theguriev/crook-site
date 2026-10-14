import * as THREE from "three";

/** Crook's colours, as the site's tokens name them. */
export const C = {
  yolk: new THREE.Color("#f9d949"),
  yolkHot: new THREE.Color("#ffe76a"),
  ink: new THREE.Color("#0a0b0e"),
  run: new THREE.Color("#9a7cff"),
  wait: new THREE.Color("#e0952f"),
  fail: new THREE.Color("#e35b5b"),
  idle: new THREE.Color("#5f6472"),
  horizon: new THREE.Color("#141925"),
  zenith: new THREE.Color("#030408"),
  deep: new THREE.Color("#02040a"),
};

/** Where the moon hangs, the same direction from wherever the camera is. */
export const MOON_DIR = new THREE.Vector3(0.22, 0.3, -1).normalize();

/**
 * The sea's swell: four directional waves. The same numbers drive the vertex shader and
 * `waveHeight`, so a buoy rides exactly the water it is drawn on.
 */
export const WAVES: [number, number, number, number, number][] = [
  // dirX, dirZ, amplitude, wavelength, speed
  [1.0, 0.35, 0.42, 26, 0.9],
  [-0.4, 1.0, 0.26, 15, 1.1],
  [0.7, -0.8, 0.14, 8.5, 1.4],
  [-0.9, -0.25, 0.08, 5.2, 1.8],
];

export function waveHeight(x: number, z: number, t: number) {
  let y = 0;
  for (const [dx, dz, a, l, s] of WAVES) {
    const len = Math.hypot(dx, dz);
    const k = (Math.PI * 2) / l;
    y += a * Math.sin(k * ((dx / len) * x + (dz / len) * z) + t * s);
  }
  return y;
}

export const WAVES_GLSL = /* glsl */ `
  const int NW = ${WAVES.length};
  const vec4 WD[NW] = vec4[NW](${WAVES.map(([dx, dz, a, l]) => {
    const len = Math.hypot(dx, dz);
    return `vec4(${(dx / len).toFixed(5)}, ${(dz / len).toFixed(5)}, ${a.toFixed(4)}, ${((Math.PI * 2) / l).toFixed(5)})`;
  }).join(", ")});
  const float WS[NW] = float[NW](${WAVES.map((w) => w[4].toFixed(3)).join(", ")});
  // height in .x, d/dx in .y, d/dz in .z
  vec3 swell(vec2 p, float t) {
    vec3 h = vec3(0.0);
    for (int i = 0; i < NW; i++) {
      float ph = WD[i].w * dot(WD[i].xy, p) + t * WS[i];
      h.x += WD[i].z * sin(ph);
      float d = WD[i].z * WD[i].w * cos(ph);
      h.y += d * WD[i].x;
      h.z += d * WD[i].y;
    }
    return h;
  }
`;

/** Sky colour toward a direction, shared by the dome and the sea's reflection. */
export const SKY_GLSL = /* glsl */ `
  uniform vec3 uHorizon;
  uniform vec3 uZenith;
  uniform vec3 uMoonDir;
  uniform vec3 uYolk;
  vec3 skyColor(vec3 d) {
    float h = clamp(d.y, -0.2, 1.0);
    vec3 c = mix(uHorizon, uZenith, pow(smoothstep(-0.02, 0.75, h), 0.55));
    float m = max(dot(d, uMoonDir), 0.0);
    c += uYolk * (pow(m, 8.0) * 0.012 + pow(m, 80.0) * 0.05);
    // a warm haze just over the water, strongest under the moon
    c += uYolk * 0.004 * exp(-abs(h) * 22.0) * (0.3 + 0.7 * pow(m, 4.0));
    return c;
  }
`;

export function skyUniforms() {
  return {
    uHorizon: { value: C.horizon.clone() },
    uZenith: { value: C.zenith.clone() },
    uMoonDir: { value: MOON_DIR.clone() },
    uYolk: { value: C.yolk.clone() },
  };
}

let glow: THREE.Texture | null = null;
/** A soft round falloff, white, for sprites and pools of light. */
export function glowTexture() {
  if (glow) return glow;
  const s = 128;
  const cv = document.createElement("canvas");
  cv.width = cv.height = s;
  const g = cv.getContext("2d")!;
  const grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.18, "rgba(255,255,255,0.55)");
  grd.addColorStop(0.45, "rgba(255,255,255,0.14)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, s, s);
  glow = new THREE.CanvasTexture(cv);
  glow.colorSpace = THREE.SRGBColorSpace;
  return glow;
}

export function glowSprite(color: THREE.Color, size: number, opacity = 1) {
  const m = new THREE.SpriteMaterial({
    map: glowTexture(),
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false,
  });
  const s = new THREE.Sprite(m);
  s.scale.setScalar(size);
  return s;
}

/** The mono font next/font loaded, by the name the canvas needs. */
export function monoFamily() {
  const v = getComputedStyle(document.documentElement).getPropertyValue("--font-jetbrains-mono").trim();
  return v || "ui-monospace, monospace";
}

export function sansFamily() {
  const v = getComputedStyle(document.documentElement).getPropertyValue("--font-ibm-plex-sans").trim();
  return v || "system-ui, sans-serif";
}

export function canvasTexture(w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void) {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const g = cv.getContext("2d")!;
  draw(g, w, h);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
}

/** Deterministic noise for placement, so the world is the same on every visit. */
export function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export const smooth = (u: number) => u * u * (3 - 2 * u);
export const damp = (a: number, b: number, lambda: number, dt: number) => THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));

/** Anything in the world that moves on its own. */
export type Part = {
  object: THREE.Object3D;
  update?: (t: number, dt: number, ctx: FrameContext) => void;
};

export type FrameContext = {
  camera: THREE.PerspectiveCamera;
  /** Fractional station index: 0 at the hero, 1 at agents, and so on. */
  station: number;
  /** The pointer, -1…1 across the viewport. */
  pointer: THREE.Vector2;
  /** Where the pointer's ray meets the plane of the CROOK letters. */
  pointerRay: THREE.Ray;
};
