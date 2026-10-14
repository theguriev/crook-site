import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { C, damp, glowSprite, type Part } from "./common";

/*
 * Crook's pirate, from crook/assets/pirate.svg, made solid. The SVG is a 330-unit square with the
 * face a circle of radius 165 at its centre; every feature below is that drawing's own path,
 * wrapped onto a sphere by projecting it straight back from the front, the way the flat mark is
 * the sphere seen head on.
 */

const S = 165;
/** SVG coordinates to the unit disc, y up. */
const uv = (x: number, y: number) => new THREE.Vector2((x - S) / S, (S - y) / S);

/** A point of the unit disc, lifted onto the unit sphere's front, `lift` above its surface. */
function onSphere(p: THREE.Vector2, lift: number, out = new THREE.Vector3()) {
  const r2 = Math.min(p.lengthSq(), 0.9999);
  out.set(p.x, p.y, Math.sqrt(1 - r2)).normalize();
  return out.multiplyScalar(1 + lift);
}

function strapShape() {
  const s = new THREE.Shape();
  const m = (x: number, y: number) => uv(x, y);
  s.moveTo(...m(58.9785, 38.5674).toArray());
  const c = (a: number, b: number, c2: number, d: number, e: number, f: number) =>
    s.bezierCurveTo(...m(a, b).toArray(), ...m(c2, d).toArray(), ...m(e, f).toArray());
  c(124.05, 42.5976, 173.144, 50.4562, 215.506, 66.1719);
  c(256.659, 81.4393, 291.14, 104.001, 327.646, 137.086);
  c(328.667, 143.081, 329.365, 149.186, 329.721, 155.383);
  c(290.091, 117.762, 254.405, 93.4024, 211.332, 77.4229);
  c(168.174, 61.4116, 117.219, 53.6681, 46.792, 49.8838);
  c(50.6608, 45.9117, 54.7287, 42.1348, 58.9785, 38.5674);
  return s;
}

function patchShape() {
  const s = new THREE.Shape();
  const m = (x: number, y: number) => uv(x, y);
  s.moveTo(...m(191.998, 139.995).toArray());
  const c = (a: number, b: number, c2: number, d: number, e: number, f: number) =>
    s.bezierCurveTo(...m(a, b).toArray(), ...m(c2, d).toArray(), ...m(e, f).toArray());
  c(164.77, 120.673, 155.693, 101.23, 162, 75.5486);
  c(163.831, 68.0938, 167.868, 60.6939, 175.238, 58.5457);
  c(200.133, 51.2892, 252.363, 72.6646, 273.003, 93.5801);
  c(280.655, 101.335, 280.327, 113.212, 275.086, 122.763);
  c(256.385, 156.85, 219.365, 159.415, 191.998, 139.995);
  return s;
}

/** Splits every triangle into four until none is longer than `max`, so a wrap stays round. */
function subdivide(geo: THREE.BufferGeometry, max: number) {
  let g = geo.index ? geo.toNonIndexed() : geo;
  for (let pass = 0; pass < 6; pass++) {
    const p = g.getAttribute("position") as THREE.BufferAttribute;
    const out: number[] = [];
    let split = false;
    const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
    for (let i = 0; i < p.count; i += 3) {
      a.fromBufferAttribute(p, i);
      b.fromBufferAttribute(p, i + 1);
      c.fromBufferAttribute(p, i + 2);
      const longest = Math.max(a.distanceTo(b), b.distanceTo(c), c.distanceTo(a));
      if (longest <= max) {
        out.push(...a.toArray(), ...b.toArray(), ...c.toArray());
        continue;
      }
      split = true;
      const ab = a.clone().lerp(b, 0.5), bc = b.clone().lerp(c, 0.5), ca = c.clone().lerp(a, 0.5);
      for (const t of [[a, ab, ca], [ab, b, bc], [ca, bc, c], [ab, bc, ca]]) for (const v of t) out.push(v.x, v.y, v.z);
    }
    g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(out, 3));
    if (!split) break;
  }
  return g;
}

/** A flat shape extruded by `depth`, then bent onto the sphere: a raised inlay, edges and all. */
function wrapped(shape: THREE.Shape, depth: number) {
  const flat = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: depth * 0.5,
    bevelSize: 0.008,
    bevelSegments: 2,
    curveSegments: 48,
  });
  const g = subdivide(flat, 0.035);
  const p = g.getAttribute("position") as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  const flatP = new THREE.Vector2();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    flatP.set(v.x, v.y);
    onSphere(flatP, v.z - depth * 0.25, v);
    p.setXYZ(i, v.x, v.y, v.z);
  }
  const smoothG = mergeVertices(g, 1e-5);
  smoothG.computeVertexNormals();
  return smoothG;
}

/**
 * The strap does not stop at the drawing's edge: it carries on round the back of the head, along
 * the circle through both of its ends and a point behind.
 */
function strapBack(radius: number) {
  const a = onSphere(uv(53, 44), 0);
  const b = onSphere(uv(329.5, 146), 0);
  const c = new THREE.Vector3(0.25, 0.42, -0.87).normalize();
  // circumcircle of a, b, c
  const ab = b.clone().sub(a), ac = c.clone().sub(a);
  const n = ab.clone().cross(ac);
  const centre = a
    .clone()
    .add(
      n.clone().cross(ab).multiplyScalar(ac.lengthSq()).add(ac.clone().cross(n).multiplyScalar(ab.lengthSq())).divideScalar(2 * n.lengthSq()),
    );
  const r = centre.distanceTo(a);
  const u = a.clone().sub(centre).normalize();
  const w = n.clone().normalize().cross(u);
  const angle = (p: THREE.Vector3) => {
    const d = p.clone().sub(centre);
    return Math.atan2(d.dot(w), d.dot(u));
  };
  let tb = angle(b), tc = angle(c);
  // walk from a to b the long way, through c
  if (tb < 0) tb += Math.PI * 2;
  if (tc < 0) tc += Math.PI * 2;
  const through = tc > tb ? [tb, Math.PI * 2] : [0, tb];
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 64; i++) {
    const t = through[0] + ((through[1] - through[0]) * i) / 64;
    pts.push(centre.clone().addScaledVector(u, Math.cos(t) * r).addScaledVector(w, Math.sin(t) * r).normalize().multiplyScalar(1.012));
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 96, radius, 10, false);
}

function smile(radius: number) {
  // the lower half of a circle: centre (165, 171), radius 114
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 48; i++) {
    const a = Math.PI + (Math.PI * i) / 48;
    pts.push(onSphere(uv(165 + Math.cos(a) * 114, 171 - Math.sin(a) * 114), 0.004));
  }
  const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 96, radius, 12, false);
  const cap = new THREE.SphereGeometry(radius, 16, 12);
  return { tube: g, cap, ends: [pts[0], pts[pts.length - 1]] };
}

export type Pirate = Part & {
  /** Where the body is, for the pool of light under it. */
  glowAt: THREE.Vector3;
  setPlace(position: THREE.Vector3, scale: number): void;
};

export function makePirate(): Pirate {
  const root = new THREE.Group(); // placed by the stations
  const bob = new THREE.Group(); // floats
  const head = new THREE.Group(); // looks at the pointer
  root.add(bob);
  bob.add(head);

  const skin = new THREE.MeshPhysicalMaterial({
    color: C.yolk,
    roughness: 0.32,
    clearcoat: 1,
    clearcoatRoughness: 0.18,
    sheen: 0.4,
    sheenColor: new THREE.Color("#fff3b3"),
    emissive: C.yolk,
    emissiveIntensity: 0.07,
  });
  const black = new THREE.MeshPhysicalMaterial({
    color: "#08080a",
    roughness: 0.22,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
  });

  head.add(new THREE.Mesh(new THREE.SphereGeometry(1, 96, 64), skin));
  head.add(new THREE.Mesh(wrapped(strapShape(), 0.035), black));
  head.add(new THREE.Mesh(strapBack(0.032), black));
  head.add(new THREE.Mesh(wrapped(patchShape(), 0.05), black));

  const { tube, cap, ends } = smile(15 / 2 / S);
  head.add(new THREE.Mesh(tube, black));
  for (const e of ends) {
    const m = new THREE.Mesh(cap, black);
    m.position.copy(e);
    head.add(m);
  }

  // the eye: an ellipsoid set into the surface, with a glint so it reads as wet
  const eyeAt = onSphere(uv(103.5, 110.5), -0.03);
  const eye = new THREE.Group();
  eye.position.copy(eyeAt);
  eye.lookAt(eyeAt.clone().multiplyScalar(2));
  const ball = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 24), black);
  ball.scale.set(30.5 / S, 42.5 / S, 0.09);
  eye.add(ball);
  const glint = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 8), new THREE.MeshBasicMaterial({ color: "#ffffff" }));
  glint.position.set(-0.06, 0.1, 0.08);
  eye.add(glint);
  head.add(eye);

  // a warm light inside the world that the head throws on the water and the letters
  const halo = glowSprite(C.yolk, 4.2, 0.07);
  bob.add(halo);

  const target = new THREE.Euler();
  const place = { pos: new THREE.Vector3(), scale: 1 };
  const glowAt = new THREE.Vector3();
  let nextBlink = 2.5;
  let blink = 0;

  return {
    object: root,
    glowAt,
    setPlace(position, scale) {
      place.pos.copy(position);
      place.scale = scale;
    },
    update(t, dt, { pointer, camera }) {
      root.position.copy(place.pos);
      root.scale.setScalar(place.scale);
      bob.position.y = Math.sin(t * 1.1) * 0.22;
      bob.rotation.z = Math.sin(t * 0.7) * 0.05;

      // face the camera, then lean toward the pointer
      const toCam = camera.position.clone().sub(root.position);
      const yaw = Math.atan2(toCam.x, toCam.z);
      const pitch = -Math.atan2(toCam.y, Math.hypot(toCam.x, toCam.z)) * 0.6;
      target.set(pitch - pointer.y * 0.28, yaw + pointer.x * 0.45, -pointer.x * 0.08);
      head.rotation.x = damp(head.rotation.x, target.x, 4, dt);
      head.rotation.y = damp(head.rotation.y, target.y, 4, dt);
      head.rotation.z = damp(head.rotation.z, target.z, 4, dt);

      if (t > nextBlink) {
        blink = 1;
        nextBlink = t + 2.4 + Math.random() * 3.6;
      }
      blink = Math.max(0, blink - dt * 7);
      const lid = 1 - Math.sin(blink * Math.PI) * 0.92;
      eye.scale.y = lid;
      glint.visible = lid > 0.5;

      glowAt.copy(root.position).setY(0);
    },
  };
}
