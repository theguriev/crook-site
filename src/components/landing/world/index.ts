import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { C, type FrameContext, MOON_DIR, type Part, smooth } from "./common";
import { makeEmbers, makeMoon, makeOcean, makeSky, makeStars, type Pool } from "./environment";
import { makePirate } from "./pirate";
import { makeBuoys, makeLetters, makeLighthouse, makePalette, makePier, makePluginCubes, makeTower } from "./props";

/**
 * One stop of the camera per section of the page, in the order they come. `look` is where the
 * camera aims; it sits beside the thing on show, so the thing lands on the side the copy is not.
 */
const STATIONS: { cam: [number, number, number]; look: [number, number, number]; pirate: [number, number, number]; size: number }[] = [
  { cam: [0, 7, 34], look: [0, 14.5, -30], pirate: [0, 8.5, -31], size: 7.4 }, // top
  { cam: [-22, 10, -36], look: [-10, 3, -76], pirate: [9, 7, -64], size: 1.4 }, // agent
  { cam: [-1, 6, -49], look: [1.5, 5, -76], pirate: [10.5, 5.6, -71], size: 0.75 }, // answer: up close to the buoy that is waiting
  { cam: [46, 14, -58], look: [32, 13, -98], pirate: [18, 22.6, -98], size: 1.4 }, // blocks
  { cam: [-44, 10, -90], look: [-38, 12, -138], pirate: [-24, 24.6, -138], size: 1.2 }, // find
  { cam: [40, 11, -140], look: [26, 9, -178], pirate: [25, 13, -160], size: 1.3 }, // palette
  { cam: [-36, 9, -180], look: [-24, 7, -218], pirate: [-21, 11, -200], size: 1.3 }, // plugins
  { cam: [0, 24, -212], look: [0, 4, -272], pirate: [0, 9, -258], size: 2.2 }, // shell
  { cam: [0, 4.4, -236], look: [0, 7.5, -300], pirate: [0, 3.6, -282], size: 1.7 }, // install
];
export const STATION_COUNT = STATIONS.length;

export type WorldOptions = { lite: boolean; still: boolean };

export type World = {
  /** Fractional station: 0 is the hero, 1 agents, and so on. */
  setStation(f: number, jump?: boolean): void;
  setPointer(x: number, y: number): void;
  resize(): void;
  dispose(): void;
};

const v3 = (a: [number, number, number]) => new THREE.Vector3(...a);

const GRADE = {
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uAspect: { value: 1 } },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uAspect;
    varying vec2 vUv;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main() {
      vec2 c = vUv - 0.5;
      // a lens: a little chromatic fringing toward the corners
      float r2 = dot(c * vec2(uAspect, 1.0), c * vec2(uAspect, 1.0));
      vec2 off = c * r2 * 0.006;
      vec3 col;
      col.r = texture2D(tDiffuse, vUv + off).r;
      col.g = texture2D(tDiffuse, vUv).g;
      col.b = texture2D(tDiffuse, vUv - off).b;
      col *= mix(1.0, 0.38, smoothstep(0.15, 0.95, r2));
      col += (hash(vUv * 900.0 + fract(uTime * 7.0)) - 0.5) * 0.016;
      gl_FragColor = vec4(col, 1.0);
    }`,
};

export function createWorld(canvas: HTMLCanvasElement, opts: WorldOptions): World {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance", alpha: false });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  let dpr = Math.min(window.devicePixelRatio, opts.lite ? 1.25 : 1.75);
  renderer.setPixelRatio(dpr);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(C.horizon, 0.0105);
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 2000);

  // light: the moon behind, a cool key from the front, the sky all round
  scene.add(new THREE.HemisphereLight("#4a5878", "#07080c", 1.1));
  const moon = new THREE.DirectionalLight("#ffe7a3", 2.2);
  moon.position.copy(MOON_DIR).multiplyScalar(100);
  scene.add(moon);
  const key = new THREE.DirectionalLight("#c9d4ff", 1.25);
  key.position.set(-40, 60, 100);
  scene.add(key);
  const warm = new THREE.PointLight(C.yolk, 0, 0, 1.6);
  scene.add(warm);

  // reflections: the sky and the moon, baked once into an environment map
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  const envSky = makeSky();
  const envMoon = makeMoon();
  envScene.add(envSky.object, envMoon.object);
  envMoon.object.position.copy(MOON_DIR).multiplyScalar(700);
  envMoon.object.lookAt(0, 0, 0);
  envSky.object.scale.setScalar(0.5);
  const envRT = pmrem.fromScene(envScene, 0.02, 0.1, 1200);
  scene.environment = envRT.texture;
  scene.environmentIntensity = 0.55;

  const pools: Pool[] = [];
  const pirate = makePirate();
  const pirateGlow: Pool = { position: pirate.glowAt, color: C.yolk, radius: 6, intensity: 0.35 };
  pools.push(pirateGlow);

  const parts: Part[] = [
    makeSky(),
    makeStars(opts.lite ? 900 : 2200),
    makeMoon(),
    makeOcean(opts.lite ? 160 : 260, pools),
    makeEmbers(opts.lite ? 350 : 900),
    makeLetters(),
    pirate,
    makeBuoys(pools),
    makeTower(pools),
    makeLighthouse(pools),
    makePalette(),
    makePluginCubes(pools),
    makePier(pools),
  ];
  for (const p of parts) scene.add(p.object);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.6, 0.6, 0.93);
  composer.addPass(bloom);
  const grade = new ShaderPass(GRADE);
  composer.addPass(grade);
  composer.addPass(new OutputPass());

  const camCurve = new THREE.CatmullRomCurve3(STATIONS.map((s) => v3(s.cam)), false, "centripetal");
  const lookCurve = new THREE.CatmullRomCurve3(STATIONS.map((s) => v3(s.look)), false, "centripetal");
  const pirateCurve = new THREE.CatmullRomCurve3(STATIONS.map((s) => v3(s.pirate)), false, "centripetal");

  const ctx: FrameContext = { camera, station: 0, pointer: new THREE.Vector2(), pointerRay: new THREE.Ray() };
  const pointerTarget = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();
  let stationTarget = 0;
  const look = new THREE.Vector3();
  const pPos = new THREE.Vector3();
  const timer = new THREE.Timer();
  let t = 0;
  let raf = 0;
  let slow = 0;
  let needsSize = true;

  function pose(f: number) {
    const n = STATIONS.length - 1;
    const i = Math.min(Math.floor(f), n - 1);
    const u = smooth(THREE.MathUtils.clamp(f - i, 0, 1));
    const at = (i + u) / n;
    camCurve.getPoint(at, camera.position);
    lookCurve.getPoint(at, look);
    pirateCurve.getPoint(at, pPos);
    // the pirate hops between stops rather than sliding
    pPos.y += Math.sin(u * Math.PI) * (i === 0 ? 8 : 3.5);
    const size = THREE.MathUtils.lerp(STATIONS[i].size, STATIONS[i + 1].size, smooth(u));
    pirate.setPlace(pPos, size);
    // a hand-held drift, and a lean toward the pointer
    camera.position.x += Math.sin(t * 0.21) * 0.35 + ctx.pointer.x * 1.1;
    camera.position.y += Math.sin(t * 0.33) * 0.22 + ctx.pointer.y * 0.55;
    // leaving the harbour mouth, the camera climbs over the letters rather than through them
    if (i === 0) camera.position.y += Math.pow(Math.sin(u * Math.PI), 0.6) * 22;
    camera.lookAt(look);
  }

  function frame() {
    if (needsSize) setSize();
    timer.update();
    const dt = Math.min(timer.getDelta(), 0.1);
    if (!opts.still) t += dt;
    const k = 1 - Math.exp(-3 * dt);
    ctx.station += (stationTarget - ctx.station) * (opts.still ? 1 : k);
    ctx.pointer.lerp(pointerTarget, opts.still ? 0 : 1 - Math.exp(-5 * dt));
    pose(ctx.station);
    camera.updateMatrixWorld();
    raycaster.setFromCamera(ctx.pointer, camera);
    ctx.pointerRay.copy(raycaster.ray);

    for (const p of parts) p.update?.(t, dt, ctx);
    const s = pirate.object.scale.x;
    pirateGlow.radius = 2.5 * s;
    pirateGlow.intensity = 0.22;
    warm.position.copy(pirate.object.position).add(new THREE.Vector3(0, -s * 0.4, s * 1.4));
    warm.intensity = 2.2 * s;
    warm.distance = 9 * s;
    grade.uniforms.uTime.value = t;
    composer.render(dt);

    // keep up: if frames are slow for a while, draw fewer pixels from the next frame on. Not here:
    // resizing clears the canvas, and a resize after this frame's render would show a blank one.
    slow = dt > 0.034 ? slow + dt : Math.max(0, slow - dt * 0.5);
    if (slow > 1.5 && dpr > 0.75) {
      dpr = Math.max(0.75, dpr - 0.25);
      needsSize = true;
      slow = 0;
    }
    if (!opts.still) raf = requestAnimationFrame(frame);
  }

  /** Sizes are applied at the top of a frame, right before it draws, so no cleared canvas is ever shown. */
  function resize() {
    needsSize = true;
    if (opts.still) frame();
  }

  function setSize() {
    needsSize = false;
    renderer.setPixelRatio(dpr);
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    camera.aspect = w / h;
    // narrow screens see the same width of the world, from further back
    camera.fov = w / h < 1 ? 58 : 40;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    composer.setPixelRatio(dpr);
    composer.setSize(w, h);
    bloom.resolution.set(w * dpr * 0.5, h * dpr * 0.5);
    grade.uniforms.uAspect.value = w / h;
  }

  if (process.env.NODE_ENV !== "production") {
    // poke at it from the console while tuning
    (window as unknown as { __crook: unknown }).__crook = {
      scene, camera, renderer, bloom, grade, parts, ctx,
      advance: (sec: number) => (t += sec),
      frame,
    };
  }

  timer.connect(document);
  // compile every material now, not the first time each part of the world comes into view mid-flight
  // (compile ignores the frustum: it covers the whole route)
  renderer.compile(scene, camera);
  if (opts.still) frame();
  else raf = requestAnimationFrame(frame);

  return {
    setStation(f, jump) {
      stationTarget = f;
      if (jump) ctx.station = f;
      if (opts.still) frame();
    },
    setPointer(x, y) {
      pointerTarget.set(x, y);
    },
    resize,
    dispose() {
      cancelAnimationFrame(raf);
      timer.dispose();
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose();
        const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
        for (const mat of mats) {
          for (const v of Object.values(mat)) if (v instanceof THREE.Texture) v.dispose();
          mat.dispose();
        }
      });
      envRT.dispose();
      pmrem.dispose();
      composer.dispose();
      renderer.dispose();
    },
  };
}
