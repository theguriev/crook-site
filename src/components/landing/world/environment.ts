import * as THREE from "three";
import { C, MOON_DIR, type Part, rng, SKY_GLSL, skyUniforms, WAVES_GLSL } from "./common";

/** The dome, drawn behind everything and carried with the camera. */
export function makeSky(): Part {
  const mat = new THREE.ShaderMaterial({
    uniforms: skyUniforms(),
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      ${SKY_GLSL}
      varying vec3 vDir;
      void main() {
        gl_FragColor = vec4(skyColor(normalize(vDir)), 1.0);
        #include <colorspace_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(900, 48, 24), mat);
  mesh.renderOrder = -10;
  mesh.frustumCulled = false;
  return { object: mesh, update: (_t, _dt, { camera }) => mesh.position.copy(camera.position) };
}

export function makeStars(count: number): Part {
  const r = rng(7);
  const pos = new Float32Array(count * 3);
  const seed = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    // upper hemisphere, denser toward the horizon the way a long exposure looks
    const u = r() * Math.PI * 2;
    const y = Math.pow(r(), 1.6) * 0.98 + 0.02;
    const rr = Math.sqrt(1 - y * y);
    pos.set([Math.cos(u) * rr * 850, y * 850, Math.sin(u) * rr * 850], i * 3);
    seed[i] = r();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("seed", new THREE.BufferAttribute(seed, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uPx: { value: 1 }, uMoonDir: { value: MOON_DIR } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    fog: false,
    vertexShader: /* glsl */ `
      attribute float seed;
      uniform float uTime;
      uniform float uPx;
      uniform vec3 uMoonDir;
      varying float vA;
      void main() {
        vec3 d = normalize(position);
        float tw = 0.55 + 0.45 * sin(uTime * (0.6 + seed * 2.4) + seed * 40.0);
        // the moon washes out the stars around it
        float wash = 1.0 - smoothstep(0.86, 0.985, dot(d, uMoonDir));
        vA = tw * wash * smoothstep(0.0, 0.12, d.y) * (0.35 + 0.65 * seed);
        gl_PointSize = (seed > 0.97 ? 3.4 : 1.6 + seed * 1.2) * uPx;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      varying float vA;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d) * vA;
        gl_FragColor = vec4(vec3(0.92, 0.94, 1.0) * a, a);
      }`,
  });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  pts.renderOrder = -9;
  return {
    object: pts,
    update: (t, _dt, { camera }) => {
      mat.uniforms.uTime.value = t;
      mat.uniforms.uPx.value = Math.min(window.devicePixelRatio, 2);
      pts.position.copy(camera.position);
    },
  };
}

/** A yolk moon with soft maria, and a halo for the bloom to catch. */
export function makeMoon(): Part {
  const group = new THREE.Group();
  const disc = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.ShaderMaterial({
      uniforms: { uYolk: { value: C.yolk } },
      transparent: true,
      depthWrite: false,
      fog: false,
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uYolk;
        varying vec2 vUv;
        float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float noise(vec2 p) {
          vec2 i = floor(p), f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
        }
        float fbm(vec2 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += a * noise(p); p *= 2.03; a *= 0.5; } return s; }
        void main() {
          vec2 p = vUv * 2.0 - 1.0;
          float r = length(p);
          float edge = smoothstep(1.0, 0.985, r);
          if (edge <= 0.0) discard;
          // a sphere's shading: brighter toward the lit limb
          float z = sqrt(max(1.0 - r * r, 0.0));
          float lit = 0.78 + 0.22 * dot(normalize(vec3(p, z)), normalize(vec3(-0.35, 0.4, 0.85)));
          float maria = smoothstep(0.48, 0.72, fbm(p * 2.2 + 3.1));
          float craters = smoothstep(0.62, 0.8, fbm(p * 7.0 + 11.0)) * 0.35;
          vec3 c = uYolk * (1.08 - maria * 0.38 - craters * 0.28) * lit;
          gl_FragColor = vec4(c, edge);
          #include <colorspace_fragment>
        }`,
    }),
  );
  const R = 38;
  disc.scale.setScalar(R * 2);
  const halo = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.ShaderMaterial({
      uniforms: { uYolk: { value: C.yolk } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      fog: false,
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uYolk;
        varying vec2 vUv;
        void main() {
          float r = length(vUv * 2.0 - 1.0) * 6.0; // the disc is r = 1
          float a = r < 1.0 ? 0.0 : 0.16 * exp(-(r - 1.0) * 2.2) + 0.025 * exp(-(r - 1.0) * 0.5);
          gl_FragColor = vec4(uYolk * a, a);
        }`,
    }),
  );
  halo.scale.setScalar(R * 12);
  halo.renderOrder = -8;
  disc.renderOrder = -7;
  group.add(halo, disc);
  return {
    object: group,
    update: (_t, _dt, { camera }) => {
      group.position.copy(camera.position).addScaledVector(MOON_DIR, 700);
      group.quaternion.copy(camera.quaternion);
    },
  };
}

export type Pool = { position: THREE.Vector3; color: THREE.Color; radius: number; intensity: number };
/** Room for every pool in the world (17 today), so none pops in or out as the camera flies. */
export const MAX_POOLS = 24;

/**
 * The sea: a grid that follows the camera in whole cells, waves from `WAVES`, the sky and the
 * moon's road in its reflection, and pools of coloured light under whatever glows above it.
 */
export function makeOcean(segments: number, pools: Pool[]): Part {
  const SIZE = 420;
  const geo = new THREE.PlaneGeometry(SIZE, SIZE, segments, segments);
  geo.rotateX(-Math.PI / 2);
  const cell = SIZE / segments;
  const poolPos = Array.from({ length: MAX_POOLS }, () => new THREE.Vector4());
  const poolCol = Array.from({ length: MAX_POOLS }, () => new THREE.Vector3());
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      ...skyUniforms(),
      uTime: { value: 0 },
      uDeep: { value: C.deep },
      uFogDensity: { value: 0.0105 },
      uPoolPos: { value: poolPos },
      uPoolCol: { value: poolCol },
      uPools: { value: 0 },
    },
    vertexShader: /* glsl */ `
      ${WAVES_GLSL}
      uniform float uTime;
      varying vec3 vWorld;
      varying vec3 vNormal;
      varying float vHeight;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vec3 s = swell(w.xz, uTime);
        w.y += s.x;
        vWorld = w.xyz;
        vHeight = s.x;
        vNormal = normalize(vec3(-s.y, 1.0, -s.z));
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */ `
      ${SKY_GLSL}
      uniform float uTime;
      uniform vec3 uDeep;
      uniform float uFogDensity;
      uniform vec4 uPoolPos[${MAX_POOLS}];
      uniform vec3 uPoolCol[${MAX_POOLS}];
      uniform int uPools;
      varying vec3 vWorld;
      varying vec3 vNormal;
      varying float vHeight;

      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
      }
      // small ripples, as a normal perturbation: the moon's road is made of these
      vec2 ripple(vec2 p, float t) {
        vec2 g = vec2(0.0);
        float a = 0.5;
        for (int i = 0; i < 4; i++) {
          vec2 q = p + vec2(t * 0.7, t * 0.45) * (1.0 + float(i) * 0.4);
          float e = 0.07;
          float n = noise(q);
          g += a * vec2(noise(q + vec2(e, 0.0)) - n, noise(q + vec2(0.0, e)) - n) / e;
          p = mat2(1.6, 1.2, -1.2, 1.6) * p;
          a *= 0.5;
        }
        return g;
      }

      void main() {
        vec3 toCam = cameraPosition - vWorld;
        float dist = length(toCam);
        vec3 V = toCam / dist;
        vec2 rp = ripple(vWorld.xz * 0.55, uTime);
        float fade = exp(-dist * 0.012); // ripples melt into the swell far off
        vec3 N = normalize(vNormal + vec3(-rp.x, 0.0, -rp.y) * 0.16 * fade);

        float fres = 0.02 + 0.98 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
        vec3 R = reflect(-V, N);
        R.y = abs(R.y);
        vec3 refl = skyColor(R);
        float m = max(dot(R, uMoonDir), 0.0);
        refl += uYolk * (pow(m, 1200.0) * 3.5 + pow(m, 160.0) * 0.18);

        vec3 body = uDeep + vec3(0.01, 0.018, 0.03) * (vHeight + 0.6);
        vec3 c = mix(body, refl, fres);

        // light from lanterns and the pirate, pooled on the water and stretched toward the eye
        for (int i = 0; i < ${MAX_POOLS}; i++) {
          if (i >= uPools) break;
          vec3 lp = uPoolPos[i].xyz;
          vec2 d = vWorld.xz - lp.xz;
          vec2 eye = normalize(cameraPosition.xz - lp.xz + 1e-4);
          float along = dot(d, eye);
          float across = dot(d, vec2(-eye.y, eye.x));
          float r = uPoolPos[i].w;
          float pool = exp(-dot(d, d) / (r * r));
          float road = exp(-across * across / (r * r * 0.08)) * exp(-max(along, 0.0) / (r * 3.0)) * step(0.0, along);
          float glint = 0.55 + 0.45 * smoothstep(0.1, 0.9, noise(vWorld.xz * 2.2 + uTime * 0.9));
          c += uPoolCol[i] * (pool * 0.5 + road * 0.9 * glint);
        }

        float fog = 1.0 - exp(-pow(uFogDensity * dist, 2.0));
        vec3 horizon = skyColor(normalize(vec3(-V.x, 0.0, -V.z)));
        c = mix(c, horizon, clamp(fog, 0.0, 1.0));
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  return {
    object: mesh,
    update: (t, _dt, { camera }) => {
      mat.uniforms.uTime.value = t;
      // snap to whole cells, so the grid does not slide under the waves
      mesh.position.set(Math.round(camera.position.x / cell) * cell, 0, Math.round(camera.position.z / cell) * cell);
      const n = Math.min(pools.length, MAX_POOLS);
      // the pools nearest the camera win the few slots there are
      const near = pools
        .map((p) => ({ p, d: p.position.distanceToSquared(camera.position) }))
        .sort((a, b) => a.d - b.d)
        .slice(0, n);
      near.forEach(({ p }, i) => {
        poolPos[i].set(p.position.x, p.position.y, p.position.z, p.radius);
        poolCol[i].set(p.color.r, p.color.g, p.color.b).multiplyScalar(p.intensity);
      });
      mat.uniforms.uPools.value = n;
    },
  };
}

/** Embers over the water, drifting up and burning out. */
export function makeEmbers(count: number): Part {
  const r = rng(31);
  const pos = new Float32Array(count * 3);
  const seed = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    pos.set([(r() - 0.5) * 110, r() * 26, 45 - r() * 360], i * 3);
    seed[i] = r();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("seed", new THREE.BufferAttribute(seed, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uPx: { value: 1 }, uYolk: { value: C.yolk } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      attribute float seed;
      uniform float uTime;
      uniform float uPx;
      varying float vA;
      void main() {
        vec3 p = position;
        float life = fract(uTime * (0.02 + seed * 0.03) + seed * 7.0);
        p.y = mod(p.y + life * 26.0, 26.0) + 0.4;
        p.x += sin(uTime * 0.4 + seed * 30.0) * 1.6;
        p.z += cos(uTime * 0.3 + seed * 20.0) * 1.2;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        float flicker = 0.6 + 0.4 * sin(uTime * (3.0 + seed * 6.0) + seed * 50.0);
        vA = flicker * smoothstep(0.0, 0.15, life) * smoothstep(1.0, 0.7, life) * smoothstep(120.0, 20.0, -mv.z);
        gl_PointSize = (2.0 + seed * 5.0) * uPx * (40.0 / max(-mv.z, 1.0));
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uYolk;
      varying float vA;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d);
        a = a * a * vA;
        gl_FragColor = vec4(mix(uYolk, vec3(1.0, 0.95, 0.8), a) * a * 1.6, a);
      }`,
  });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  return {
    object: pts,
    update: (t) => {
      mat.uniforms.uTime.value = t;
      mat.uniforms.uPx.value = Math.min(window.devicePixelRatio, 2);
    },
  };
}
