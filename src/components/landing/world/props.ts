import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import {
  C,
  canvasTexture,
  damp,
  glowSprite,
  monoFamily,
  type Part,
  rng,
  roundRect,
  sansFamily,
  smooth,
  waveHeight,
} from "./common";
import type { Pool } from "./environment";

/* ------------------------------------------------------------------ CROOK, in blocks */

/** The hero's 5×7 face, the same one the old pixel field spelled the name in. */
const FONT: Record<string, string[]> = {
  C: [".###.", "#...#", "#....", "#....", "#....", "#...#", ".###."],
  R: ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
  O: [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  K: ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
};
const BANDS = ["#fff3b3", "#fde47f", "#F9D949", "#F9D949", "#dcbb35", "#b6971f", "#8f7615"];

export const LETTERS_Z = -30;

export function makeLetters(): Part {
  const pitch = 2.1;
  const cells: { x: number; y: number; z: number; row: number; col: number }[] = [];
  const word = "CROOK";
  const cols = word.length * 6 - 1;
  [...word].forEach((ch, li) => {
    // the first O is the pirate's place
    if (li === 2) return;
    FONT[ch].forEach((line, row) => {
      [...line].forEach((px, c) => {
        if (px !== "#") return;
        const col = li * 6 + c;
        for (let d = 0; d < 2; d++) {
          cells.push({
            x: (col - (cols - 1) / 2) * pitch,
            y: (6 - row) * pitch + 2.2,
            z: LETTERS_Z - d * pitch,
            row,
            col,
          });
        }
      });
    });
  });

  const geo = new RoundedBoxGeometry(pitch * 0.94, pitch * 0.94, pitch * 0.94, 3, 0.16);
  const heat = new THREE.InstancedBufferAttribute(new Float32Array(cells.length), 1);
  geo.setAttribute("heat", heat);
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.38, metalness: 0.15, emissive: C.yolk, emissiveIntensity: 0.1 });
  mat.onBeforeCompile = (s) => {
    s.vertexShader = s.vertexShader
      .replace("#include <common>", "#include <common>\nattribute float heat;\nvarying float vHeat;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvHeat = heat;");
    s.fragmentShader = s.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying float vHeat;")
      .replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\ntotalEmissiveRadiance *= 1.0 + vHeat * 9.0;");
  };
  const mesh = new THREE.InstancedMesh(geo, mat, cells.length);
  // the instances move every frame; a bounds taken at the first one would cull the lot
  mesh.frustumCulled = false;
  const color = new THREE.Color();
  cells.forEach((c, i) => mesh.setColorAt(i, color.set(BANDS[c.row])));

  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const s = new THREE.Vector3(1, 1, 1);
  const p = new THREE.Vector3();
  const push = new Float32Array(cells.length);
  const hit = new THREE.Vector3();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -LETTERS_Z);
  let born = -1;

  return {
    object: mesh,
    update(t, dt, { pointerRay, station }) {
      if (born < 0) born = t;
      const age = t - born;
      const has = station < 0.9 && pointerRay.intersectPlane(plane, hit) !== null;
      cells.forEach((c, i) => {
        // rise out of the sea, a column at a time
        const rise = smooth(THREE.MathUtils.clamp((age - 0.25 - c.col * 0.045 - c.row * 0.02) / 1.4, 0, 1));
        const near = has ? Math.max(0, 1 - Math.hypot(hit.x - c.x, hit.y - c.y) / 6.5) : 0;
        push[i] = damp(push[i], near, 6, dt);
        const sway = Math.sin(t * 0.9 + c.x * 0.22 + c.z * 0.3) * 0.12;
        p.set(c.x, c.y - (1 - rise) * 22 + sway, c.z + push[i] * 2.2);
        e.set(Math.sin(t * 0.5 + c.col) * 0.04 + push[i] * 0.4, push[i] * 0.3 * Math.sign(hit.x - c.x || 1), 0);
        q.setFromEuler(e);
        m.compose(p, q, s);
        mesh.setMatrixAt(i, m);
        heat.setX(i, push[i]);
      });
      mesh.instanceMatrix.needsUpdate = true;
      heat.needsUpdate = true;
    },
  };
}

/* ------------------------------------------------------------------ agents: buoys */

type Status = "run" | "wait" | "fail" | "idle";
const STATUS_LABEL: Record<Status, string> = { run: "running", wait: "needs input", fail: "failed", idle: "idle" };

function labelTexture(kind: Status, title: string, branch: string) {
  const col = "#" + C[kind].getHexString();
  return canvasTexture(640, 168, (g, w, h) => {
    roundRect(g, 4, 4, w - 8, h - 8, 26);
    g.fillStyle = kind === "wait" ? "rgba(58,47,38,0.92)" : "rgba(22,24,31,0.88)";
    g.fill();
    g.lineWidth = 2;
    g.strokeStyle = kind === "wait" ? "rgba(224,149,47,0.6)" : "rgba(255,255,255,0.1)";
    g.stroke();
    g.fillStyle = col;
    g.beginPath();
    g.arc(52, 62, 15, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#ecebe4";
    g.font = `500 38px ${sansFamily()}`;
    g.textBaseline = "middle";
    g.fillText(title, 86, 62);
    g.fillStyle = "#8b8f9a";
    g.font = `400 28px ${monoFamily()}`;
    g.fillText(`${branch} · ${STATUS_LABEL[kind]}`, 86, 114);
  });
}

const AGENTS: { kind: Status; title: string; branch: string; at: [number, number] }[] = [
  { kind: "run", title: "port the tab bar", branch: "eugen/tab-options", at: [-4, -64] },
  { kind: "wait", title: "sandbox the plugin host", branch: "main", at: [6, -70] },
  { kind: "fail", title: "bisect the flaky test", branch: "eugen/atlas-repro", at: [-10, -82] },
  { kind: "idle", title: "release notes", branch: "main", at: [14, -88] },
];

export function makeBuoys(pools: Pool[]): Part {
  const group = new THREE.Group();
  const hullMat = new THREE.MeshStandardMaterial({ color: "#1b1e26", roughness: 0.55, metalness: 0.3 });
  const trimMat = new THREE.MeshStandardMaterial({ color: "#3a3f4b", roughness: 0.4, metalness: 0.6 });
  // a float, turned on a lathe
  const hullGeo = new THREE.LatheGeometry(
    [
      [0, -1.1], [0.5, -1.05], [1.05, -0.6], [1.25, 0], [1.2, 0.25], [0.55, 0.45], [0.35, 0.5], [0, 0.5],
    ].map(([x, y]) => new THREE.Vector2(x, y)),
    40,
  );
  const ringGeo = new THREE.TorusGeometry(1.24, 0.08, 10, 48);
  const mastGeo = new THREE.CylinderGeometry(0.07, 0.1, 3.2, 10);
  const cageGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.75, 6, 1, true);
  const capGeo = new THREE.ConeGeometry(0.55, 0.45, 6);
  const lampGeo = new THREE.SphereGeometry(0.3, 20, 14);

  const items = AGENTS.map((a, i) => {
    const buoy = new THREE.Group();
    buoy.add(new THREE.Mesh(hullGeo, hullMat));
    const ring = new THREE.Mesh(ringGeo, trimMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.05;
    buoy.add(ring);
    const mast = new THREE.Mesh(mastGeo, trimMat);
    mast.position.y = 2;
    buoy.add(mast);
    const cage = new THREE.Mesh(cageGeo, new THREE.MeshStandardMaterial({ color: "#2b2f39", wireframe: true }));
    cage.position.y = 3.95;
    buoy.add(cage);
    const cap = new THREE.Mesh(capGeo, trimMat);
    cap.position.y = 4.55;
    buoy.add(cap);
    const lampMat = new THREE.MeshBasicMaterial({ color: C[a.kind].clone().multiplyScalar(2.2) });
    const lamp = new THREE.Mesh(lampGeo, lampMat);
    lamp.position.y = 3.95;
    buoy.add(lamp);
    const glow = glowSprite(C[a.kind], 5, 0.8);
    glow.position.y = 3.95;
    buoy.add(glow);

    const tex = labelTexture(a.kind, a.title, a.branch);
    const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, fog: false }));
    label.scale.set(5, 1.31, 1);
    label.position.y = 6.3;
    buoy.add(label);

    group.add(buoy);
    const pool: Pool = { position: new THREE.Vector3(a.at[0], 0, a.at[1]), color: C[a.kind], radius: 2.8, intensity: 0.5 };
    pools.push(pool);
    return { a, buoy, lampMat, glow, pool, phase: i * 1.7 };
  });

  const base = new THREE.Color();
  return {
    object: group,
    update(t) {
      for (const it of items) {
        const [x, z] = it.a.at;
        const y = waveHeight(x, z, t);
        const sx = waveHeight(x + 1, z, t) - y;
        const sz = waveHeight(x, z + 1, t) - y;
        it.buoy.position.set(x, y - 0.1, z);
        it.buoy.rotation.set(sz * 0.9, it.phase, -sx * 0.9);
        // running breathes, waiting blinks, failed holds, idle is barely lit
        let k = 1;
        if (it.a.kind === "run") k = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(t * 2.4));
        if (it.a.kind === "wait") k = Math.sin(t * 5) > -0.2 ? 1 : 0.25;
        if (it.a.kind === "idle") k = 0.35;
        it.lampMat.color.copy(base.copy(C[it.a.kind]).multiplyScalar(0.6 + 1.8 * k));
        it.glow.material.opacity = 0.25 + 0.65 * k;
        it.pool.intensity = 0.15 + 0.5 * k;
        it.pool.position.set(x, 0, z);
      }
    },
  };
}

/* ------------------------------------------------------------------ blocks + find */

const BLOCKS: { cmd: string; out: string[]; kind?: "fail" | "open" }[] = [
  { cmd: "crook --agent running", out: ["", ""], kind: "open" },
  { cmd: "cargo test -p crook_tabs", out: ["test tab_titles_follow_osc_2 ... FAILED", "error: test failed, to rerun pass `--lib`"], kind: "fail" },
  { cmd: "git switch -c eugen/tab-options", out: ["Switched to a new branch 'eugen/tab-options'", ""] },
  { cmd: "rg -n 'tab' src/panel.rs", out: ["41:  fn tab_row(&self, tab: &Tab) -> Row {", "88:  // a tab that exits closes its pane"] },
  { cmd: "cargo build --release", out: ["Compiling crook v0.1.13", "Finished `release` profile in 41.07s"] },
  { cmd: "ls ~/.config/crook", out: ["plugins  settings.toml  sessions", ""] },
];

function blockTexture(b: (typeof BLOCKS)[number], find: boolean) {
  return canvasTexture(1024, 236, (g, w, h) => {
    g.fillStyle = b.kind === "fail" ? "#2a1719" : "#14161c";
    g.fillRect(0, 0, w, h);
    if (b.kind === "open") {
      g.fillStyle = "#f9d949";
      g.fillRect(0, 0, 10, h);
    }
    if (b.kind === "fail") {
      g.fillStyle = "#e35b5b";
      g.fillRect(0, 0, 10, h);
    }
    const mono = monoFamily();
    g.textBaseline = "middle";
    g.font = `500 40px ${mono}`;
    const line = (txt: string, x: number, y: number, col: string) => {
      // find: every "tab" on the block lights amber, the first one yolk
      if (find) {
        let i = txt.indexOf("tab");
        while (i >= 0) {
          const x0 = x + g.measureText(txt.slice(0, i)).width;
          const ww = g.measureText("tab").width;
          g.fillStyle = b.cmd.startsWith("rg") && y < 100 ? "#f9d949" : "rgba(224,149,47,0.75)";
          g.fillRect(x0 - 2, y - 24, ww + 4, 46);
          i = txt.indexOf("tab", i + 3);
        }
      }
      g.fillStyle = col;
      g.fillText(txt, x, y);
    };
    g.fillStyle = "#f9d949";
    g.fillText("❯", 38, 62);
    line(b.cmd, 84, 62, "#ecebe4");
    g.font = `400 32px ${mono}`;
    b.out.forEach((o, i) => line(o, 84, 128 + i * 50, b.kind === "fail" && i === 0 ? "#ffa3a3" : "#8b8f9a"));
    if (b.kind === "open") {
      g.fillStyle = "#f9d949";
      g.fillRect(84 + g.measureText("").width, 112, 18, 34);
    }
  });
}

export const TOWER_AT = new THREE.Vector3(18, 0, -98);

export function makeTower(pools: Pool[]): Part {
  const group = new THREE.Group();
  group.position.copy(TOWER_AT);
  group.rotation.y = 0.6;
  const geo = new RoundedBoxGeometry(13, 2.6, 6, 3, 0.18);
  const side = new THREE.MeshStandardMaterial({ color: "#14161c", roughness: 0.42, metalness: 0.35 });
  const slabs = BLOCKS.map((b, i) => {
    const plain = blockTexture(b, false);
    const found = blockTexture(b, true);
    const face = new THREE.MeshStandardMaterial({
      map: plain,
      emissiveMap: plain,
      emissive: new THREE.Color("#ffffff"),
      emissiveIntensity: 0.85,
      roughness: 0.5,
    });
    // the text sits on its own plane just proud of the slab's front
    const slab = new THREE.Group();
    slab.add(new THREE.Mesh(geo, side));
    const front = new THREE.Mesh(new THREE.PlaneGeometry(12.4, 2.86 * (236 / 260)), face);
    front.position.z = 3.01;
    slab.add(front);
    group.add(slab);
    return { slab, face, plain, found, i, kind: b.kind };
  });
  const stripe = glowSprite(C.yolk, 6, 0.35);
  group.add(stripe);
  pools.push({ position: TOWER_AT.clone().add(new THREE.Vector3(0, 0, 4)), color: C.yolk, radius: 5, intensity: 0.18 });

  let lit = false;
  return {
    object: group,
    update(t, _dt, { station }) {
      // between "find" and its neighbours the matches light up
      const wantFind = station > 2.55 && station < 3.6;
      if (wantFind !== lit) {
        lit = wantFind;
        for (const s of slabs) {
          s.face.map = s.face.emissiveMap = lit ? s.found : s.plain;
          s.face.needsUpdate = true;
        }
      }
      // the open block on top, the oldest at the bottom; the stack breathes
      const spread = 3.1 + Math.sin(t * 0.6) * 0.15;
      for (const s of slabs) {
        const k = slabs.length - 1 - s.i;
        s.slab.position.set(Math.sin(t * 0.4 + s.i) * 0.25, 1.2 + k * spread + Math.sin(t * 0.8 + s.i * 0.9) * 0.12, 0);
        s.slab.rotation.y = Math.sin(t * 0.3 + s.i * 0.7) * 0.06;
      }
      stripe.position.set(-6.4, 1.2 + (slabs.length - 1) * spread, 3.2);
      stripe.material.opacity = 0.25 + 0.15 * Math.sin(t * 2.4);
    },
  };
}

export const LIGHTHOUSE_AT = new THREE.Vector3(-24, 0, -138);

export function makeLighthouse(pools: Pool[]): Part {
  const group = new THREE.Group();
  group.position.copy(LIGHTHOUSE_AT);

  // the rock it stands on
  const r = rng(11);
  const rockMat = new THREE.MeshStandardMaterial({ color: "#1a1c22", roughness: 0.95, flatShading: true });
  for (let i = 0; i < 14; i++) {
    const g = new THREE.IcosahedronGeometry(1, 0);
    const rock = new THREE.Mesh(g, rockMat);
    const a = r() * Math.PI * 2, d = r() * 6;
    rock.position.set(Math.cos(a) * d, -0.4 + r() * 0.8, Math.sin(a) * d);
    rock.scale.set(2 + r() * 3, 1 + r() * 2.2, 2 + r() * 3);
    rock.rotation.set(r() * 3, r() * 3, r() * 3);
    group.add(rock);
  }

  const bands = canvasTexture(16, 256, (g, _w, h) => {
    for (let i = 0; i < 6; i++) {
      g.fillStyle = i % 2 ? "#1c1f27" : "#d9d4c5";
      g.fillRect(0, (i * h) / 6, 16, h / 6);
    }
  });
  const tower = new THREE.Mesh(
    new THREE.CylinderGeometry(1.7, 2.6, 18, 32, 1, true),
    new THREE.MeshStandardMaterial({ map: bands, roughness: 0.7 }),
  );
  tower.position.y = 10;
  group.add(tower);
  const metal = new THREE.MeshStandardMaterial({ color: "#2b2f39", roughness: 0.4, metalness: 0.7 });
  const gallery = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 0.35, 32), metal);
  gallery.position.y = 19.1;
  group.add(gallery);
  const lampRoom = new THREE.Mesh(
    new THREE.CylinderGeometry(1.35, 1.35, 2.1, 16, 1, true),
    new THREE.MeshStandardMaterial({ color: "#000", emissive: C.yolkHot, emissiveIntensity: 2.4, side: THREE.DoubleSide }),
  );
  lampRoom.position.y = 20.4;
  group.add(lampRoom);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.9, 1.8, 16), metal);
  roof.position.y = 22.3;
  group.add(roof);
  const lampGlow = glowSprite(C.yolk, 14, 0.9);
  lampGlow.position.y = 20.4;
  group.add(lampGlow);

  // two beams back to back, sweeping
  const beamMat = new THREE.ShaderMaterial({
    uniforms: { uYolk: { value: C.yolk } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    vertexShader: /* glsl */ `
      varying float vAlong;
      varying vec3 vN;
      varying vec3 vV;
      void main() {
        vAlong = uv.y;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal);
        vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uYolk;
      varying float vAlong;
      varying vec3 vN;
      varying vec3 vV;
      void main() {
        float edge = pow(abs(dot(vN, vV)), 1.4);
        float a = edge * pow(vAlong, 1.6) * 0.32;
        gl_FragColor = vec4(uYolk * a, a);
      }`,
  });
  const beamGeo = new THREE.ConeGeometry(7, 90, 32, 1, true);
  beamGeo.translate(0, -45, 0); // apex at the lamp
  beamGeo.rotateZ(Math.PI / 2);
  const spin = new THREE.Group();
  spin.position.y = 20.4;
  for (const dir of [0, Math.PI]) {
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.rotation.y = dir;
    beam.rotation.z = -0.05;
    spin.add(beam);
  }
  group.add(spin);

  const pool: Pool = { position: LIGHTHOUSE_AT.clone(), color: C.yolk, radius: 7, intensity: 0.3 };
  pools.push(pool);
  const sweep = new THREE.Vector3();
  const sweepPool: Pool = { position: new THREE.Vector3(), color: C.yolk, radius: 6, intensity: 0.22 };
  pools.push(sweepPool);

  return {
    object: group,
    update(t) {
      spin.rotation.y = t * 0.55;
      // where the beam meets the sea
      sweep.set(Math.cos(-t * 0.55) * 40, 0, Math.sin(-t * 0.55) * 40);
      sweepPool.position.copy(LIGHTHOUSE_AT).add(sweep);
    },
  };
}

/* ------------------------------------------------------------------ palette */

export const PALETTE_AT = new THREE.Vector3(14, 9, -178);

const ROWS: [string, string, string][] = [
  [">", "commands", "cmd-k"],
  ["@", "tabs", "@"],
  ["#", "settings", "#"],
  ["?", "keys", "?"],
  [">", "Split right", "cmd-d"],
  ["@", "port the tab bar", "~/crook"],
  ["#", "Recent directories", "General"],
  ["?", "Next waiting tab", "cmd-j"],
];

function tileTexture([sig, name, meta]: [string, string, string], hot: boolean) {
  return canvasTexture(640, 128, (g, w, h) => {
    roundRect(g, 3, 3, w - 6, h - 6, 22);
    g.fillStyle = hot ? "rgba(249,217,73,0.95)" : "rgba(20,22,28,0.92)";
    g.fill();
    g.strokeStyle = hot ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.12)";
    g.lineWidth = 2;
    g.stroke();
    g.textBaseline = "middle";
    g.font = `500 44px ${monoFamily()}`;
    g.fillStyle = hot ? "#1a1d24" : "#f9d949";
    g.fillText(sig, 34, h / 2 + 2);
    g.font = `500 38px ${sansFamily()}`;
    g.fillStyle = hot ? "#1a1d24" : "#ecebe4";
    g.fillText(name, 88, h / 2 + 2);
    g.font = `400 28px ${monoFamily()}`;
    g.fillStyle = hot ? "#3a3f4b" : "#8b8f9a";
    g.textAlign = "right";
    g.fillText(meta, w - 32, h / 2 + 2);
  });
}

export function makePalette(): Part {
  const group = new THREE.Group();
  group.position.copy(PALETTE_AT);
  const bar = canvasTexture(1024, 150, (g, w, h) => {
    roundRect(g, 3, 3, w - 6, h - 6, 30);
    g.fillStyle = "rgba(14,15,20,0.96)";
    g.fill();
    g.strokeStyle = "#f9d949";
    g.lineWidth = 4;
    g.stroke();
    g.textBaseline = "middle";
    g.font = `500 54px ${monoFamily()}`;
    g.fillStyle = "#ecebe4";
    g.fillText("rec", 56, h / 2 + 3);
    g.fillStyle = "#f9d949";
    g.fillRect(56 + g.measureText("rec").width + 6, h / 2 - 28, 24, 56);
    g.textAlign = "right";
    g.font = `400 36px ${monoFamily()}`;
    g.fillStyle = "#8b8f9a";
    g.fillText("cmd-k", w - 52, h / 2 + 3);
  });
  const barMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(13, 13 * (150 / 1024)),
    new THREE.MeshBasicMaterial({ map: bar, transparent: true, side: THREE.DoubleSide }),
  );
  group.add(barMesh);
  const barGlow = glowSprite(C.yolk, 18, 0.18);
  group.add(barGlow);

  const tiles = ROWS.map((row, i) => {
    const plain = tileTexture(row, false);
    const hot = tileTexture(row, true);
    const mat = new THREE.MeshBasicMaterial({ map: plain, transparent: true, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(7.5, 1.5), mat);
    group.add(mesh);
    return { mesh, mat, plain, hot, i };
  });

  const toCam = new THREE.Vector3();
  return {
    object: group,
    update(t, _dt, { camera }) {
      // the box faces whoever is looking; the rows orbit it on a tilted ring
      toCam.copy(camera.position);
      barMesh.lookAt(toCam);
      const active = Math.floor(t / 1.2) % tiles.length;
      for (const tl of tiles) {
        const a = (tl.i / tiles.length) * Math.PI * 2 + t * 0.16;
        tl.mesh.position.set(Math.cos(a) * 10, Math.sin(a) * 3.2 + Math.sin(t + tl.i) * 0.2, Math.sin(a) * 6.5);
        tl.mesh.lookAt(toCam);
        const want = tl.i === active ? tl.hot : tl.plain;
        if (tl.mat.map !== want) {
          tl.mat.map = want;
          tl.mat.needsUpdate = true;
        }
      }
    },
  };
}

/* ------------------------------------------------------------------ plugins */

export const PLUGINS_AT = new THREE.Vector3(-12, 6.5, -218);
const PLUGIN_NAMES = ["pirate", "chips", "markdown", "dziling", "emoji", "worktree"];

export function makePluginCubes(pools: Pool[]): Part {
  const group = new THREE.Group();
  group.position.copy(PLUGINS_AT);
  const loader = new THREE.TextureLoader();
  // frosted glass: the sea and the moon in its faces, the module inside lit from within
  const glass = new THREE.MeshPhysicalMaterial({
    color: "#cfd6ff",
    roughness: 0.12,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
    envMapIntensity: 2.2,
    side: THREE.DoubleSide,
  });
  const cubeGeo = new RoundedBoxGeometry(3, 3, 3, 4, 0.28);
  const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(3.25, 3.25, 3.25));
  const cageMat = new THREE.LineBasicMaterial({ color: C.yolk, transparent: true, opacity: 0.55 });
  const cubes = PLUGIN_NAMES.map((name, i) => {
    const holder = new THREE.Group();
    const cube = new THREE.Mesh(cubeGeo, glass);
    holder.add(cube);
    const cage = new THREE.LineSegments(edges, cageMat);
    holder.add(cage);
    const tex = loader.load(`/plugins/${name}/icon.png`);
    tex.colorSpace = THREE.SRGBColorSpace;
    const icon = new THREE.Mesh(
      new THREE.PlaneGeometry(1.7, 1.7),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, toneMapped: false }),
    );
    holder.add(icon);
    const inner = glowSprite(C.yolk, 4.5, 0.35);
    holder.add(inner);
    const a = (i / PLUGIN_NAMES.length) * Math.PI * 2;
    const home = new THREE.Vector3(Math.cos(a) * 7, Math.sin(i * 1.3) * 1.6, Math.sin(a) * 4.5);
    group.add(holder);
    return { holder, cube, cage, icon, home, i };
  });
  const core = glowSprite(C.yolk, 10, 0.25);
  group.add(core);
  pools.push({ position: PLUGINS_AT.clone().setY(0), color: C.yolk, radius: 8, intensity: 0.12 });

  return {
    object: group,
    update(t, _dt, { camera }) {
      for (const c of cubes) {
        const a = t * 0.12 + (c.i / cubes.length) * Math.PI * 2;
        c.holder.position.set(Math.cos(a) * 7.5, c.home.y + Math.sin(t * 0.9 + c.i) * 0.4, Math.sin(a) * 4.5);
        c.cube.rotation.set(t * 0.2 + c.i, t * 0.27 + c.i * 0.5, 0);
        c.cage.rotation.copy(c.cube.rotation);
        c.icon.lookAt(camera.position);
      }
    },
  };
}

/* ------------------------------------------------------------------ the pier */

export const PIER_Z0 = -246;
export const PIER_LEN = 40;

export function makePier(pools: Pool[]): Part {
  const group = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: "#2a2018", roughness: 0.9 });
  const r = rng(5);
  const planks = new THREE.InstancedMesh(new THREE.BoxGeometry(5, 0.18, 0.7), wood, Math.floor(PIER_LEN / 0.85));
  const m = new THREE.Matrix4();
  for (let i = 0; i < planks.count; i++) {
    m.makeRotationY((r() - 0.5) * 0.04);
    m.setPosition((r() - 0.5) * 0.15, 1.5 + (r() - 0.5) * 0.05, PIER_Z0 - i * 0.85);
    planks.setMatrixAt(i, m);
  }
  group.add(planks);
  const postGeo = new THREE.CylinderGeometry(0.2, 0.24, 4, 8);
  for (let z = 0; z <= PIER_LEN; z += 5) {
    for (const x of [-2.3, 2.3]) {
      const post = new THREE.Mesh(postGeo, wood);
      post.position.set(x, 0, PIER_Z0 - z);
      group.add(post);
    }
  }
  // lamps along it, warm
  const lampMat = new THREE.MeshBasicMaterial({ color: C.yolk.clone().multiplyScalar(2.5) });
  const poleMat = new THREE.MeshStandardMaterial({ color: "#2b2f39", metalness: 0.6, roughness: 0.4 });
  for (let z = 4; z <= PIER_LEN; z += 12) {
    for (const x of [-2.4, 2.4]) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 3, 8), poleMat);
      pole.position.set(x, 3, PIER_Z0 - z);
      group.add(pole);
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8), lampMat);
      lamp.position.set(x, 4.6, PIER_Z0 - z);
      group.add(lamp);
      const glow = glowSprite(C.yolk, 3.4, 0.7);
      glow.position.copy(lamp.position);
      group.add(glow);
      pools.push({ position: lamp.position.clone().setY(0), color: C.yolk, radius: 2.4, intensity: 0.3 });
    }
  }
  return { object: group };
}
