// Nolann Petri — Lignes. One exact grid and one front of light. The front sweeps left to right and builds
// whatever it crosses (the name rises into walls, then a city), turns at the far end and sweeps back, folding
// everything flat. Scroll drives it; the pointer lifts the grid like a finger under paper. Raw WebGL2.
import { $, clamp, lerp, reduce } from './site.js';

const exp = $('#exp'), canvas = $('#lines');
const body = document.body;
const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, depth: true, powerPreference: 'high-performance' });

/* =============================================================================================
   Small linear algebra
   ============================================================================================= */
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scl = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const ease = t => t * t * t * (t * (t * 6 - 15) + 10);          // smootherstep
function perspective(fov, aspect, near, far) {
  const f = 1 / Math.tan(fov / 2), nf = 1 / (near - far);
  return [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0];
}
function view(eye, fwd, up) {
  const z = scl(fwd, -1), x = norm(cross(up, z)), y = cross(z, x);
  return [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -dot(x, eye), -dot(y, eye), -dot(z, eye), 1];
}
function mul(a, b) {
  const o = new Array(16);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
    o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
  }
  return o;
}
function invert(m) {
  const [a00, a01, a02, a03, a10, a11, a12, a13, a20, a21, a22, a23, a30, a31, a32, a33] = m;
  const b00 = a00 * a11 - a01 * a10, b01 = a00 * a12 - a02 * a10, b02 = a00 * a13 - a03 * a10, b03 = a01 * a12 - a02 * a11;
  const b04 = a01 * a13 - a03 * a11, b05 = a02 * a13 - a03 * a12, b06 = a20 * a31 - a21 * a30, b07 = a20 * a32 - a22 * a30;
  const b08 = a20 * a33 - a23 * a30, b09 = a21 * a32 - a22 * a31, b10 = a21 * a33 - a23 * a31, b11 = a22 * a33 - a23 * a32;
  const d = 1 / (b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06);
  return [(a11 * b11 - a12 * b10 + a13 * b09) * d, (a02 * b10 - a01 * b11 - a03 * b09) * d, (a31 * b05 - a32 * b04 + a33 * b03) * d, (a22 * b04 - a21 * b05 - a23 * b03) * d,
    (a12 * b08 - a10 * b11 - a13 * b07) * d, (a00 * b11 - a02 * b08 + a03 * b07) * d, (a32 * b02 - a30 * b05 - a33 * b01) * d, (a20 * b05 - a22 * b02 + a23 * b01) * d,
    (a10 * b10 - a11 * b08 + a13 * b06) * d, (a01 * b08 - a00 * b10 - a03 * b06) * d, (a30 * b04 - a31 * b02 + a33 * b00) * d, (a21 * b02 - a20 * b04 - a23 * b00) * d,
    (a11 * b07 - a10 * b09 - a12 * b06) * d, (a00 * b09 - a01 * b07 + a02 * b06) * d, (a31 * b01 - a30 * b03 - a32 * b00) * d, (a20 * b03 - a21 * b01 + a22 * b00) * d];
}
let seed = 1;
const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

/* =============================================================================================
   The world. Ground is y = 0, one unit per grid cell. The name lies on the ground reading along +x,
   the tops of its letters toward -z, so it reads upright from straight above.
   ============================================================================================= */
const H_WALL = 4.4;
const LETTERS = {
  N: [4, [[0, 0, 0, 6], [0, 6, 4, 0], [4, 0, 4, 6]]],
  O: [4, [[1, 0, 3, 0], [3, 0, 4, 1], [4, 1, 4, 5], [4, 5, 3, 6], [3, 6, 1, 6], [1, 6, 0, 5], [0, 5, 0, 1], [0, 1, 1, 0]]],
  L: [3.5, [[0, 6, 0, 0], [0, 0, 3.5, 0]]],
  A: [4, [[0, 0, 2, 6], [2, 6, 4, 0], [2 / 3, 2, 10 / 3, 2]]],
  P: [4, [[0, 0, 0, 6], [0, 6, 3, 6], [3, 6, 4, 5], [4, 5, 4, 4], [4, 4, 3, 3], [3, 3, 0, 3]]],
  E: [3.5, [[3.5, 6, 0, 6], [0, 6, 0, 0], [0, 0, 3.5, 0], [0, 3, 2.8, 3]]],
  T: [4, [[0, 6, 4, 6], [2, 6, 2, 0]]],
  R: [4, [[0, 0, 0, 6], [0, 6, 3, 6], [3, 6, 4, 5], [4, 5, 4, 4], [4, 4, 3, 3], [3, 3, 0, 3], [2, 3, 4, 0]]],
  I: [0, [[0, 0, 0, 6]]],
};
const GAP = 1.5, WORD = 4;
const strokes = [];          // [ax, az, bx, bz, petri]
{
  const words = ['NOLANN', 'PETRI'];
  const width = words.reduce((w, word, i) => w + [...word].reduce((s, c) => s + LETTERS[c][0], 0) + GAP * (word.length - 1) + (i ? WORD : 0), 0);
  let x = -width / 2;
  words.forEach((word, wi) => {
    if (wi) x += WORD;
    [...word].forEach((c, ci) => {
      const [w, st] = LETTERS[c];
      st.forEach(([u0, v0, u1, v1]) => strokes.push([x + u0, 3 - v0, x + u1, 3 - v1, wi]));
      x += w + (ci < word.length - 1 ? GAP : 0);
    });
  });
}
const NAME_HALF = Math.max(...strokes.map(s => Math.max(Math.abs(s[0]), Math.abs(s[2]))));

// The camera's ground path: straight through three gaps between letters, wide turns outside, then down an avenue.
const PATH = [[-46, 15], [-34, 13.5], [-22, 11], [-18, 7], [-18, 0], [-18, -7], [-16, -10.5], [-7, -12.5], [2, -10.5], [4.75, -7], [4.75, 0], [4.75, 7],
  [7.5, 10.2], [13.4, 11.8], [19.3, 10.2], [22, 7], [22, 0], [22, -7], [25.5, -11], [35, -12.5], [48, -9], [62, -2], [80, 5], [100, 1.5], [120, -5.5],
  [140, -1.5], [160, 5], [180, 1.5], [200, -4], [218, -2], [232, 0]];
const path = (() => {
  // centripetal Catmull-Rom through the points, sampled densely and re-parameterised by arc length
  const P = [PATH[0].map((v, i) => 2 * v - PATH[1][i]), ...PATH, PATH[PATH.length - 1].map((v, i) => 2 * v - PATH[PATH.length - 2][i])];
  const pts = [];
  for (let i = 1; i < P.length - 2; i++) {
    const [p0, p1, p2, p3] = [P[i - 1], P[i], P[i + 1], P[i + 2]];
    const d = (a, b) => Math.pow(Math.hypot(a[0] - b[0], a[1] - b[1]), 0.5) || 1e-4;
    const t0 = 0, t1 = t0 + d(p0, p1), t2 = t1 + d(p1, p2), t3 = t2 + d(p2, p3);
    for (let k = 0; k < 60; k++) {
      const t = t1 + (t2 - t1) * k / 60;
      const L = (a, b, ta, tb) => [0, 1].map(j => ((tb - t) * a[j] + (t - ta) * b[j]) / (tb - ta));
      const A1 = L(p0, p1, t0, t1), A2 = L(p1, p2, t1, t2), A3 = L(p2, p3, t2, t3);
      const B1 = L(A1, A2, t0, t2), B2 = L(A2, A3, t1, t3);
      pts.push(L(B1, B2, t1, t2));
    }
  }
  pts.push(PATH[PATH.length - 1]);
  const s = [0];
  for (let i = 1; i < pts.length; i++) s.push(s[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const len = s[s.length - 1];
  const at = u => {
    const target = clamp(u, 0, 1) * len;
    let lo = 0, hi = s.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (s[m] < target) lo = m; else hi = m; }
    const f = (target - s[lo]) / Math.max(1e-6, s[hi] - s[lo]);
    return [lerp(pts[lo][0], pts[hi][0], f), lerp(pts[lo][1], pts[hi][1], f)];
  };
  return { at, len };
})();
const camHeight = x => 1.35 + 5.4 * ease(clamp((x - 34) / 190));
const pathZ = (() => {
  const S = Array.from({ length: 801 }, (_, i) => path.at(i / 800));
  return x => {
    if (x <= S[0][0]) return S[0][1];
    for (let i = 1; i < S.length; i++) if (S[i][0] >= x) { const a = S[i - 1], b = S[i]; return lerp(a[1], b[1], (x - a[0]) / Math.max(1e-6, b[0] - a[0])); }
    return S[S.length - 1][1];
  };
})();

// Towers: a city on the grid past the name, kept clear of the avenue, taller towards the far end.
const towers = [];
{
  seed = 7;
  const samples = Array.from({ length: 401 }, (_, i) => path.at(i / 400));
  const clearance = (x, z) => samples.reduce((d, p) => (Math.abs(p[0] - x) < 30 ? Math.min(d, Math.hypot(p[0] - x, p[1] - z)) : d), 1e9);
  for (let x = 38; x < 250; x += 3) for (let z = -84; z <= 84; z += 3) {
    if (rnd() > 0.27) continue;
    const hs = 0.6 + rnd() * 1.1 + (rnd() < 0.12 ? 0.9 : 0);
    const cx = x + (rnd() - 0.5), cz = z + (rnd() - 0.5);
    if (clearance(cx, cz) < hs + 4.5) continue;
    if (cx > 215 && Math.abs(cz) < 14 + hs) continue;          // the road straight out of the city stays open
    const far = clamp((cx - 38) / 200), side = clamp(Math.abs(cz) / 80);
    let h = 1.5 + rnd() * 7 + Math.pow(rnd(), 3) * (18 + 80 * far) * (1 - side * 0.5);
    if (rnd() < 0.03 + far * 0.05) h += 40 + rnd() * 60;
    towers.push([cx, cz, hs, h]);
  }
}

/* =============================================================================================
   Geometry. Lines are instanced quads expanded on screen; faces only write depth
   (hidden-line rendering, so the volumes have weight).
   ============================================================================================= */
const coarse = innerWidth < 820 || (navigator.hardwareConcurrency || 8) <= 4;
const L = { A: [], B: [], K: [], T: [] };
const line = (a, b, k, t = [0, 0, 0, 0]) => { L.A.push(...a); L.B.push(...b); L.K.push(...k); L.T.push(...t); };
{
  // the grid: cut into short pieces near the action (so it can bend under the pointer), long ones beyond
  const X0 = -80, X1 = 262, Z0 = -84, Z1 = 84;
  const fine = (x, z) => x >= -64 && x < 64 && z >= -44 && z < 44;
  const step = (x, z) => (fine(x, z) ? (coarse ? 2 : 1) : 3);
  for (let z = Z0; z <= Z1; z++) for (let x = X0; x < X1;) { const k = Math.min(step(x, z), X1 - x); line([x, 0, z], [x + k, 0, z], [z % 5 ? 0 : 1, 0, 0, 0]); x += k; }
  for (let x = X0; x <= X1; x++) for (let z = Z0; z < Z1;) { const k = Math.min(step(x, z), Z1 - z); line([x, 0, z], [x, 0, z + k], [x % 5 ? 0 : 1, 0, 0, 0]); z += k; }
  const FAR = 720, S = 24;
  for (let z = -FAR; z <= FAR; z += 5) for (let x = -FAR; x < FAR; x += S) {
    if (z >= Z0 && z <= Z1 && x + S > X0 && x < X1) continue;
    line([x, 0, z], [x + S, 0, z], [1, 0, 0, 0]);
  }
  for (let x = -FAR; x <= FAR; x += 5) for (let z = -FAR; z < FAR; z += S) {
    if (x >= X0 && x <= X1 && z + S > Z0 && z < Z1) continue;
    line([x, 0, z], [x, 0, z + S], [1, 0, 0, 0]);
  }
}
{
  // the name: traced in order at the start, then walls with their top edges and corners
  const total = strokes.reduce((s, [ax, az, bx, bz]) => s + Math.hypot(bx - ax, bz - az), 0);
  let acc = 0;
  const corners = new Map();
  strokes.forEach(([ax, az, bx, bz, petri]) => {
    const l = Math.hypot(bx - ax, bz - az);
    line([ax, 0, az], [bx, 0, bz], [2, acc / total, l / total, petri], [H_WALL, 0, 0, 0]);
    line([ax, 0, az], [bx, 0, bz], [3, 0, 0, petri], [H_WALL, 0, 0, 0]);
    acc += l;
    [[ax, az], [bx, bz]].forEach(([x, z]) => corners.set(`${x.toFixed(3)},${z.toFixed(3)}`, [x, z, petri]));
  });
  corners.forEach(([x, z, petri]) => line([x, 0, z], [x, 0, z], [4, 0, 0, petri], [H_WALL, 0, 0, 0]));
}
{
  // towers: vertical edges, the top, the footprint, and a floor line every few units
  const E = [[-1, 0, -1, -1, 1, -1], [1, 0, -1, 1, 1, -1], [1, 0, 1, 1, 1, 1], [-1, 0, 1, -1, 1, 1],
    [-1, 1, -1, 1, 1, -1], [1, 1, -1, 1, 1, 1], [1, 1, 1, -1, 1, 1], [-1, 1, 1, -1, 1, -1],
    [-1, 0, -1, 1, 0, -1], [1, 0, -1, 1, 0, 1], [1, 0, 1, -1, 0, 1], [-1, 0, 1, -1, 0, -1]];
  towers.forEach(([cx, cz, hs, h]) => {
    E.forEach(e => line(e.slice(0, 3), e.slice(3), [5, -1, 0, 0], [cx, cz, hs, h]));
    const floors = Math.min(14, Math.floor(h / 4));
    for (let f = 1; f < floors; f++) {
      const y = f / floors;
      [[-1, -1, 1, -1], [1, -1, 1, 1], [1, 1, -1, 1], [-1, 1, -1, -1]].forEach(([a, b, c, d]) => line([a, y, b], [c, y, d], [5, y, 1, 0], [cx, cz, hs, h]));
    }
  });
}
// The ending: the name again, standing ahead of the camera once the city is gone.
const YC = 7;
{
  const total = strokes.reduce((s, [ax, az, bx, bz]) => s + Math.hypot(bx - ax, bz - az), 0);
  let acc = 0;
  strokes.forEach(([ax, az, bx, bz, petri]) => {
    const l = Math.hypot(bx - ax, bz - az);
    line([0, YC - az, ax], [0, YC - bz, bx], [6, acc / total, l / total, petri]);
    acc += l;
  });
}
const lineCount = L.K.length / 4;

const F = { P: [], K: [], T: [] };
const vert = (p, k, t) => { F.P.push(...p); F.K.push(...k); F.T.push(...t); };
const quad = (a, b, c, d, k, t) => [a, b, c, a, c, d].forEach(p => vert(p, k, t));
strokes.forEach(([ax, az, bx, bz]) => quad([ax, 0, az], [bx, 0, bz], [bx, 1, bz], [ax, 1, az], [3, 0, 0, 0], [H_WALL, 0, 0, 0]));
towers.forEach(t => {
  const k = [5, 0, 0, 0];
  quad([-1, 0, -1], [1, 0, -1], [1, 1, -1], [-1, 1, -1], k, t);
  quad([1, 0, -1], [1, 0, 1], [1, 1, 1], [1, 1, -1], k, t);
  quad([1, 0, 1], [-1, 0, 1], [-1, 1, 1], [1, 1, 1], k, t);
  quad([-1, 0, 1], [-1, 0, -1], [-1, 1, -1], [-1, 1, 1], k, t);
  quad([-1, 1, -1], [1, 1, -1], [1, 1, 1], [-1, 1, 1], k, t);
});
const faceCount = F.P.length / 3;

/* =============================================================================================
   Shaders. One function places every point of the world for the current moment; lines and faces share it.
   ============================================================================================= */
const WORLD = `
uniform float uFront, uFold, uErase, uTrace, uReveal, uFade, uMouseOn;
uniform vec3 uMouse;
float spring(float t) {                                   // 0 to 1, a little overshoot, then still
  t = max(t, 0.0);
  return 1.0 - exp(-4.2 * t) * (cos(6.5 * t) + 0.65 * sin(6.5 * t));
}
float built(float x, float lag) {                         // raised by the front, laid flat again by the eraser behind it
  return spring((uFront - x) / lag) * clamp(1.0 - spring((x - uFold) / lag), 0.0, 1.0) * clamp(1.0 - spring((uErase - x) / lag), 0.0, 1.0);
}
float bump(vec2 p) {                                      // the pointer lifts the paper
  vec2 d = p - uMouse.xz;
  return uMouseOn * 1.15 * exp(-dot(d, d) / 30.0);
}
// kind: 0,1 grid · 2 letter base · 3 letter top / wall face · 4 letter corner · 5 tower · 6 the name, standing, at the end
vec3 place(vec3 p, vec4 k, vec4 t, float endB) {
  float kind = k.x;
  vec3 w = p;
  if (kind > 2.5 && kind < 4.5) {
    float h = t.x * built(p.x, 4.0);
    w.y = (kind < 3.5 ? p.y : endB) * h;                  // wall faces carry y = 0 or 1; corners run ground to top
  }
  if (kind > 4.5) {
    float g = built(t.x, 7.0 + t.w * 0.08);
    w = vec3(t.x + p.x * t.z, p.y * t.w * g, t.y + p.z * t.z);
  }
  w.y += bump(w.xz);
  return w;
}`;

const LINE_VS = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aQ;
layout(location = 1) in vec3 iA;
layout(location = 2) in vec3 iB;
layout(location = 3) in vec4 iK;
layout(location = 4) in vec4 iT;
uniform mat4 uV, uP;
uniform vec2 uRes;
uniform float uDpr, uFog, uLod, uTrace2, uX2, uGrid;
uniform vec3 uCam;
${WORLD}
out float vD, vCore, vHalo, vA;
out vec3 vCol;
void main() {
  float kind = iK.x;
  vec3 A, B;
  if (kind > 5.5) {
    A = iA + vec3(uX2, 0.0, 0.0); B = iB + vec3(uX2, 0.0, 0.0);   // standing in the plane x = uX2
  } else {
    A = place(iA, iK, iT, 0.0); B = place(iB, iK, iT, 1.0);
    if (kind > 2.5 && kind < 3.5) { A.y += iT.x * built(iA.x, 4.0); B.y += iT.x * built(iB.x, 4.0); }
  }
  float alpha = kind < 0.5 ? 0.13 : kind < 1.5 ? 0.3 : (kind < 4.5 || kind > 5.5) ? 0.95 : (iK.y < 0.0 ? 0.62 : 0.26);
  // the name is traced segment by segment, at the start and again at the end
  float tip = 0.0;
  if ((kind > 1.5 && kind < 2.5) || kind > 5.5) {
    float tr = kind > 5.5 ? uTrace2 : uTrace;
    float f = clamp((tr - iK.y) / max(iK.z, 1e-4), 0.0, 1.0);
    B = mix(A, B, f);
    tip = f > 0.0 && f < 0.999 && tr < 1.0 ? 1.0 : 0.0;
    alpha *= step(0.001, f);
  }
  if (kind > 2.5 && kind < 4.5) {
    float h = max(built(iA.x, 4.0), built(iB.x, 4.0));
    alpha *= smoothstep(0.004, 0.06, h) * step(0.999, uTrace);
  }
  if (kind > 4.5 && kind < 5.5) {
    float g = built(iT.x, 7.0 + iT.w * 0.08);
    alpha *= smoothstep(0.002, 0.03, g);
    if (iK.y >= 0.0) alpha *= smoothstep(iK.y - 0.02, iK.y + 0.01, g);   // floors appear as the top passes them
  }
  vec3 M = (A + B) * 0.5;
  // light: the fronts and the pointer
  float df = abs(M.x - uFront), dg = abs(M.x - uFold), de = abs(M.x - uErase);
  float lf = (exp(-df * df / 0.18) + 0.35 * exp(-df * df / 4.0)) * step(uFront, 400.0) + (exp(-dg * dg / 0.18) + 0.35 * exp(-dg * dg / 4.0)) * step(uFold, 380.0)
           + (exp(-de * de / 0.18) + 0.35 * exp(-de * de / 4.0)) * step(-400.0, uErase) * (kind < 5.5 ? 1.0 : 0.0);
  vec2 dm = M.xz - uMouse.xz;
  float lm = uMouseOn * exp(-dot(dm, dm) / 46.0);
  float light = clamp(lf + lm * 0.8 * step(kind, 5.5) + tip, 0.0, 1.6);
  if (kind > 5.5) light = max(light, 0.22);                 // the sign glows a little on its own
  vec3 white = vec3(0.93, 0.93, 0.92), yellow = vec3(0.953, 0.827, 0.29);
  float petri = kind > 1.5 && kind < 2.5 ? iK.w * (1.0 - clamp(built(M.x, 4.0), 0.0, 1.0)) : kind > 5.5 ? iK.w : 0.0;
  vCol = mix(mix(white, yellow, petri * 0.85), yellow, clamp(light, 0.0, 1.0));
  if (kind < 1.5) {
    alpha *= 1.0 - smoothstep(uReveal - 10.0, uReveal, length(M.xz));
    alpha *= smoothstep(0.006, 0.07, abs(normalize(M - uCam).y));   // grazing lines fade toward the horizon
    alpha *= uGrid;
  }
  if (kind > 1.5 && kind < 5.5) alpha *= 1.0 - smoothstep(0.0, 10.0, uErase - M.x);   // what the eraser laid flat fades away
  // reach of the eye: fine lines thin out with distance, everything sinks into the dark
  vec4 va = uV * vec4(A, 1.0), vb = uV * vec4(B, 1.0);
  float dist = length(((va + vb) * 0.5).xyz);
  if (kind < 0.5) alpha *= 1.0 - smoothstep(uLod * 0.3, uLod, dist);
  if (kind > 4.5 && kind < 5.5 && iK.y >= 0.0) alpha *= 1.0 - smoothstep(70.0, 190.0, dist);   // far floors melt into their towers
  if (kind < 5.5) alpha *= exp(-max(dist - 30.0, 0.0) / uFog);
  if (kind > 1.5) alpha *= uFade;
  alpha = min(1.0, alpha + light * (kind < 1.5 ? 0.55 : 0.35) * step(0.0005, alpha));
  // clip against the near plane before going to the screen
  vA = 1.0;
  float near = 0.05;
  if (va.z > -near && vb.z > -near) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); vA = 0.0; vD = 0.0; vCore = 0.0; vHalo = 0.0; return; }
  if (va.z > -near) va = mix(va, vb, (va.z + near) / (va.z - vb.z));
  if (vb.z > -near) vb = mix(vb, va, (vb.z + near) / (vb.z - va.z));
  vec4 ca = uP * va, cb = uP * vb;
  vec2 sa = ca.xy / ca.w * 0.5 * uRes, sb = cb.xy / cb.w * 0.5 * uRes;
  vec2 dir = sb - sa; float len = length(dir);
  if (kind < 1.5) {
    // how far apart this line and its neighbour look on screen: where the grid gets tight, it fades
    vec3 dW = iB - iA;
    vec3 off = abs(dW.x) > abs(dW.z) ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
    vec4 c0 = uP * (uV * vec4(M, 1.0)), c1 = uP * (uV * vec4(M + off * (kind < 0.5 ? 1.0 : 5.0), 1.0));
    if (c0.w > 0.05 && c1.w > 0.05) {
      vec2 g = (c0.xy / c0.w - c1.xy / c1.w) * 0.5 * uRes / uDpr;
      vA *= smoothstep(2.5, 11.0, length(g));
    }
  }
  dir = len > 1e-4 ? dir / len : vec2(1.0, 0.0);
  vec2 nrm = vec2(-dir.y, dir.x);
  vCore = 0.55 * uDpr * ((kind > 1.5 && kind < 4.5) || kind > 5.5 ? 1.25 : 1.0);
  float reach = (1.5 + 7.0 * light) * uDpr;
  float halfW = vCore + reach + uDpr;
  vec4 c = aQ.x < 0.5 ? ca : cb;
  vec2 s = (aQ.x < 0.5 ? sa : sb) + nrm * aQ.y * halfW + dir * (aQ.x < 0.5 ? -1.0 : 1.0) * vCore;
  gl_Position = vec4(s / (0.5 * uRes) * c.w, c.z, c.w);
  vD = aQ.y * halfW;
  vA *= alpha;
  vHalo = reach * (0.25 + light) / (1.0 + dist / 70.0);
}`;

const LINE_FS = `#version 300 es
precision highp float;
in float vD, vCore, vHalo, vA;
in vec3 vCol;
out vec4 o;
void main() {
  float d = abs(vD);
  float core = 1.0 - smoothstep(vCore - 0.6, vCore + 0.9, d);
  float halo = exp(-d * d / max(vHalo * vHalo, 1e-3)) * 0.35 * step(0.3, vHalo);
  float a = (core + halo) * vA;
  o = vec4(vCol * a, a);
}`;

const FACE_VS = `#version 300 es
precision highp float;
layout(location = 0) in vec3 aP;
layout(location = 1) in vec4 aK;
layout(location = 2) in vec4 aT;
uniform mat4 uV, uP;
${WORLD}
void main() {
  vec3 w = place(aP, aK, aT, aP.y);
  gl_Position = uP * uV * vec4(w, 1.0);
}`;
const LAMP_VS = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aQ;
uniform mat4 uV, uP;
uniform vec2 uRes;
uniform vec3 uLamp;
uniform float uDpr, uLen;
out vec2 vQ;
void main() {
  vec4 c = uP * uV * vec4(uLamp, 1.0);
  if (c.w < 0.06) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); vQ = vec2(1e4); return; }
  vec2 ext = vec2(uLen, 30.0);                             // half size in css px: a long thin streak
  gl_Position = vec4((c.xy / c.w + aQ * ext * uDpr / (0.5 * uRes)) * c.w, c.z, c.w);
  vQ = aQ * ext;
}`;
const LAMP_FS = `#version 300 es
precision highp float;
in vec2 vQ;
uniform float uAmt, uLen;
out vec4 o;
void main() {
  float r2 = dot(vQ, vQ);
  float core = exp(-r2 / 7.0);
  float glow = exp(-r2 / 260.0) * 0.4;
  float streak = exp(-abs(vQ.x) / (uLen * 0.26)) * exp(-vQ.y * vQ.y / 2.4);
  vec3 col = vec3(1.0, 0.97, 0.9) * core + vec3(0.42, 0.76, 1.0) * (streak + glow);
  float a = (core + streak + glow) * uAmt;
  o = vec4(col * uAmt, a);
}`;

const FACE_FS = `#version 300 es
precision mediump float;
out vec4 o;
void main() { o = vec4(0.0); }`;

/* =============================================================================================
   GL setup
   ============================================================================================= */
let progL = null, progF = null, progS = null, vaoL, vaoF, vaoS, UL = {}, UF = {}, US = {};
const UNI = ['uV', 'uP', 'uRes', 'uDpr', 'uFog', 'uLod', 'uCam', 'uLamp', 'uLen', 'uAmt', 'uFront', 'uFold', 'uErase', 'uTrace', 'uTrace2', 'uX2', 'uGrid', 'uReveal', 'uFade', 'uMouseOn', 'uMouse'];
function shader(type, src) {
  const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
  return s;
}
function program(vs, fs) {
  const p = gl.createProgram();
  gl.attachShader(p, shader(gl.VERTEX_SHADER, vs)); gl.attachShader(p, shader(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  const u = {}; UNI.forEach(n => { u[n] = gl.getUniformLocation(p, n); });
  return [p, u];
}
function attrib(loc, data, size, divisor = 0) {
  const b = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, b);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
  gl.vertexAttribDivisor(loc, divisor);
}
if (gl) {
  try {
    [progL, UL] = program(LINE_VS, LINE_FS);
    [progF, UF] = program(FACE_VS, FACE_FS);
    [progS, US] = program(LAMP_VS, LAMP_FS);
    vaoL = gl.createVertexArray(); gl.bindVertexArray(vaoL);
    attrib(0, [0, -1, 1, -1, 0, 1, 1, 1], 2);
    attrib(1, L.A, 3, 1); attrib(2, L.B, 3, 1); attrib(3, L.K, 4, 1); attrib(4, L.T, 4, 1);
    vaoF = gl.createVertexArray(); gl.bindVertexArray(vaoF);
    attrib(0, F.P, 3); attrib(1, F.K, 4); attrib(2, F.T, 4);
    vaoS = gl.createVertexArray(); gl.bindVertexArray(vaoS);
    attrib(0, [-1, -1, 1, -1, -1, 1, 1, 1], 2);
    gl.bindVertexArray(null);
  } catch (e) { console.warn(e); progL = null; }
}
const live = !!(gl && progL);
if (!live) { exp.classList.add('nogl'); body.classList.add('ready'); }

/* =============================================================================================
   The camera: a straight-down plan, a swoop to street level, a run along the path,
   a climb until the city is small, then home again behind the returning front
   ============================================================================================= */
const TOP = 89.4 * Math.PI / 180;
function orbit(T, yaw, pitch, dist, fov) {
  const f = [Math.sin(yaw) * Math.cos(pitch), -Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch)];
  const up = [Math.sin(yaw) * Math.sin(pitch), Math.cos(pitch), -Math.cos(yaw) * Math.sin(pitch)];
  return { eye: sub(T, scl(f, dist)), at: T, up, fov };
}
function rail(u) {
  const p0 = path.at(u), ahead = p0[0] < 30 ? 0.024 : 0.04;
  const p = p0, q = path.at(u + ahead), r0 = path.at(u - 0.02), r1 = path.at(u + 0.02);
  const y = camHeight(p[0]);
  const eye = [p[0], y, p[1]];
  let at = [q[0], y + 0.05 + (y - 1.35) * 0.15, q[1]];
  if (p[0] < 30) {
    const w = 0.5 * clamp((Math.abs(p[1]) - 4) / 5) * clamp((27 - p[0]) / 6);
    at = mix3(at, [clamp(p[0] + (q[0] - p[0]) * 2, -NAME_HALF, NAME_HALF), 1.8, 0], w);
  }
  // bank a little into the turns
  const a = Math.atan2(p[1] - r0[1], p[0] - r0[0]), b = Math.atan2(r1[1] - p[1], r1[0] - p[0]);
  let turn = b - a; turn = Math.atan2(Math.sin(turn), Math.cos(turn));
  const fwd = norm(sub(at, eye)), right = norm(cross(fwd, [0, 1, 0]));
  const roll = clamp(turn * 0.9, -0.09, 0.09);
  const up = norm(add(scl([0, 1, 0], Math.cos(roll)), scl(right, Math.sin(roll))));
  return { eye, at, up, fov: lerp(64, 58, clamp((p[0] - 30) / 60)) };
}
let D0 = 80;
const topDown = (k = 1) => orbit([0, 0, 0], 0, TOP, D0 * k, 30);
// progress marks along the scroll
const M = { hold: 0.04, rise: 0.16, run0: 0.24, run1: 0.62, erased: 0.72, name1: 0.84, menu: 0.88 };
let X2 = 430;                                              // where the name stands up again (set per screen shape)
// key moments; the camera runs a smooth curve through them (cubic Hermite, Catmull-Rom tangents)
let KEYS = [];
function buildKeys() {
  const K = [];
  const k = (p, c) => K.push({ p, v: [...c.eye, ...c.at, ...c.up, c.fov] });
  k(0, topDown(1));
  k(M.hold, topDown(0.96));
  k(0.1, orbit([-3, 1, 0], 0.22, 62 * Math.PI / 180, D0 * 0.82, 34));
  const pf = clamp((1 - W / Hh) / 0.55);                  // how much of a portrait frame this is
  k(M.rise, orbit([-6 + 4 * pf, 2, 0], 0.5 - 0.2 * pf, 35 * Math.PI / 180, 60 * (1 + 1.7 * pf), 40));
  k(0.2, orbit([-26 + 8 * pf, 1.6, 9 - 3 * pf], 0.95 - 0.25 * pf, 16 * Math.PI / 180, 28 * (1 + 0.9 * pf), 52));
  for (let p = M.run0; p <= M.run1 + 1e-9; p += 0.002) k(p, rail((p - M.run0) / (M.run1 - M.run0) * 0.985));
  // out of the city and straight on until the name stands ahead, high in the frame, with the reels beneath it
  const aspect = W / Hh, tanV = Math.tan(17 * Math.PI / 180), tanH = tanV * aspect;
  const dName = (NAME_HALF * 1.18) / tanH;
  X2 = Math.max(430, 262 + dName * 1.6 + 16);
  const ahead = (p, d, fov) => k(p, { eye: [X2 - d, YC, 0], at: [X2, YC - d * 0.085, 0], up: [0, 1, 0], fov });
  k(0.66, { eye: [252, YC, 0], at: [X2, YC, 0], up: [0, 1, 0], fov: 48 });
  ahead(M.erased, dName * 1.6, 40);
  ahead(M.name1, dName * 1.15, 34);
  ahead(M.menu, dName * 1.04, 34);
  ahead(1, dName, 34);
  KEYS = K;
}
function camera(p) {
  let i = 0;
  while (i < KEYS.length - 2 && KEYS[i + 1].p <= p) i++;
  const a = KEYS[Math.max(0, i - 1)], b = KEYS[i], c = KEYS[i + 1], d = KEYS[Math.min(KEYS.length - 1, i + 2)];
  const h = c.p - b.p, t = clamp((p - b.p) / (h || 1));
  const t2 = t * t, t3 = t2 * t;
  const h00 = 2 * t3 - 3 * t2 + 1, h10 = t3 - 2 * t2 + t, h01 = -2 * t3 + 3 * t2, h11 = t3 - t2;
  const v = b.v.map((bv, j) => {
    const m0 = (c.v[j] - a.v[j]) / Math.max(c.p - a.p, 1e-6) * h;
    const m1 = (d.v[j] - bv) / Math.max(d.p - b.p, 1e-6) * h;
    return h00 * bv + h10 * m0 + h01 * c.v[j] + h11 * m1;
  });
  // a tall phone frame sees less sideways: open the lens in the streets, keep the plan as it is
  const portrait = clamp((1 - W / Hh) / 0.55);
  return { eye: v.slice(0, 3), at: v.slice(3, 6), up: norm(v.slice(6, 9)), fov: v[9] * (1 + 0.38 * portrait * clamp((v[9] - 34) / 12)) };
}
function fronts(p, camX) {
  let front;
  if (p < M.hold) front = -NAME_HALF - 8;
  else if (p < M.rise) front = lerp(-NAME_HALF - 8, NAME_HALF + 6, ease((p - M.hold) / (M.rise - M.hold)));
  else front = Math.max(NAME_HALF + 6, camX + 34);
  if (p > M.run1) front = Math.max(front, lerp(camX + 34, 330, ease(clamp((p - M.run1) / 0.04))));
  if (p > M.erased + 0.004) front = 9999;                   // both fronts go dark once the city is gone
  // then the eraser: a second front that runs forward and lays everything flat as it passes
  const erase = p < M.run1 ? -500 : p > M.erased + 0.004 ? 9999 : lerp(-60, 330, ease(clamp((p - M.run1) / (M.erased - M.run1))));
  return [front, 500, erase];
}

/* =============================================================================================
   Frame loop: a tight, critically damped response to the scroll; it renders only when something moves
   ============================================================================================= */
let W = 1, Hh = 1, dpr = 1, top0 = 0, span = 1;
function measure() {
  const r = exp.getBoundingClientRect();
  top0 = r.top + scrollY;
  span = Math.max(1, exp.offsetHeight - innerHeight);
  dpr = Math.min(devicePixelRatio || 1, coarse ? 1.75 : 2);
  W = Math.max(2, Math.round(canvas.clientWidth * dpr)); Hh = Math.max(2, Math.round(canvas.clientHeight * dpr));
  canvas.width = W; canvas.height = Hh;
  // straight down, the whole name fits the width with room around it
  const tanV = Math.tan(15 * Math.PI / 180);
  D0 = Math.max((NAME_HALF + 6) / (tanV * (W / Hh)), 18 / tanV);
  buildKeys();
  wake();
}
const target = () => (reduce ? 0 : clamp((scrollY - top0) / span));
let P = target(), raf = 0, last = performance.now();
const intro = { t0: performance.now(), trace: reduce ? 1 : 0, reveal: reduce ? 1000 : 0, done: reduce };
const mouse = { x: 0, y: 0, on: 0, want: 0, seen: -1e9, ground: [0, 0, 0] };

function frame(now) {
  raf = 0;
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  // intro: the grid draws out from the centre, then the name is traced like a plotter
  if (!intro.done) {
    const e = (now - intro.t0) / 1000;
    intro.reveal = 170 * ease(clamp(e / 1.1));
    intro.trace = clamp((e - 0.55) / 1.9);
    if (e > 2.6) { intro.done = true; intro.trace = 1; intro.reveal = 1000; body.classList.add('ready'); }
  }
  const T = target();
  P = Math.abs(T - P) < 1e-5 ? T : lerp(P, T, 1 - Math.exp(-dt / 0.11));
  exp.classList.toggle('moved', P > 0.01);
  const cam = camera(P);
  const [front, fold, erase] = fronts(P, cam.eye[0]);
  const fade = 1;
  const trace2 = clamp((P - M.erased) / (M.name1 - M.erased));
  const grid = 1 - 0.6 * ease(clamp((P - M.run1) / 0.1));
  exp.classList.toggle('menu-on', P > M.menu || reduce);
  const want = mouse.want * (now - mouse.seen < 2400 ? 1 : 0);
  mouse.on = lerp(mouse.on, want, 0.08);
  const Vm = view(cam.eye, norm(sub(cam.at, cam.eye)), cam.up);
  const Pm = perspective(cam.fov * Math.PI / 180, W / Hh, 0.05, 1600);
  if (mouse.on > 0.001) {
    // where the pointer touches the ground
    const inv = invert(mul(Pm, Vm));
    const un = (x, y, z) => { const v = [0, 1, 2, 3].map(r => inv[r] * x + inv[4 + r] * y + inv[8 + r] * z + inv[12 + r]); return [v[0] / v[3], v[1] / v[3], v[2] / v[3]]; };
    const a = un(mouse.x, mouse.y, -1), b = un(mouse.x, mouse.y, 1), d = sub(b, a);
    if (Math.abs(d[1]) > 1e-6) {
      const t = -a[1] / d[1];
      if (t > 0) mouse.ground = mix3(mouse.ground, add(a, scl(d, t)), mouse.on < 0.05 ? 1 : 0.35);
    }
  }
  // the source of the light: where the front meets the name's axis or the road ahead; then the eraser's
  let lamp, lampAmt;
  if (P < M.run1) {
    const building = P >= M.rise && front > NAME_HALF + 7;
    lamp = [front, 0.06, building ? pathZ(front) : 0];
    lampAmt = clamp((262 - front) / 30);
  } else {
    lamp = [erase, 0.06, 0];
    lampAmt = 1 - clamp((P - (M.erased - 0.02)) / 0.03);
  }
  lampAmt *= intro.done ? 1 : 0;
  const ending = { erase, trace2, grid };
  if (live) draw(Vm, Pm, front, fold, fade, cam.eye, lamp, lampAmt, ending);

  if (Math.abs(T - P) > 1e-5 || !intro.done || Math.abs(mouse.on - want) > 0.002) raf = requestAnimationFrame(frame);
}
function draw(Vm, Pm, front, fold, fade, eye, lamp, lampAmt, end) {
  gl.viewport(0, 0, W, Hh);
  gl.clearColor(0, 0, 0, 1);
  gl.depthMask(true);   // the last frame left it off, and a masked clear keeps the old depth
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);
  const set = u => {
    gl.uniformMatrix4fv(u.uV, false, Vm); gl.uniformMatrix4fv(u.uP, false, Pm);
    gl.uniform1f(u.uFront, front); gl.uniform1f(u.uFold, fold);
    gl.uniform1f(u.uTrace, intro.trace); gl.uniform1f(u.uReveal, intro.reveal); gl.uniform1f(u.uFade, fade);
    gl.uniform1f(u.uMouseOn, mouse.on); gl.uniform3fv(u.uMouse, mouse.ground);
    gl.uniform1f(u.uErase, end.erase);
  };
  // faces: depth only, pushed back a hair so their own edges draw on top
  gl.useProgram(progF); set(UF);
  gl.colorMask(false, false, false, false);
  gl.depthMask(true); gl.depthFunc(gl.LESS);
  gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(1.5, 2);
  gl.bindVertexArray(vaoF); gl.drawArrays(gl.TRIANGLES, 0, faceCount);
  gl.disable(gl.POLYGON_OFFSET_FILL);
  gl.colorMask(true, true, true, true);
  // lines: light adds up
  gl.useProgram(progL); set(UL);
  gl.uniform2f(UL.uRes, W, Hh); gl.uniform1f(UL.uDpr, dpr); gl.uniform3fv(UL.uCam, eye);
  gl.uniform1f(UL.uTrace2, end.trace2); gl.uniform1f(UL.uX2, X2); gl.uniform1f(UL.uGrid, end.grid);
  const high = clamp((Math.abs(Vm[14]) - 20) / 200);
  gl.uniform1f(UL.uFog, lerp(160, 520, high));
  gl.uniform1f(UL.uLod, lerp(95, 150, high) * (W / dpr > 900 ? 1 : 0.8));
  gl.depthMask(false); gl.depthFunc(gl.LEQUAL);
  gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
  gl.bindVertexArray(vaoL); gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, lineCount);
  if (lampAmt > 0.01) {
    gl.useProgram(progS);
    gl.uniformMatrix4fv(US.uV, false, Vm); gl.uniformMatrix4fv(US.uP, false, Pm);
    gl.uniform2f(US.uRes, W, Hh); gl.uniform1f(US.uDpr, dpr);
    gl.uniform3fv(US.uLamp, lamp); gl.uniform1f(US.uAmt, lampAmt); gl.uniform1f(US.uLen, Math.min(W / dpr * 0.32, 340));
    gl.bindVertexArray(vaoS); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  gl.disable(gl.BLEND);
  gl.bindVertexArray(null);
}
function wake() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }

const aim = e => { mouse.x = e.clientX / innerWidth * 2 - 1; mouse.y = 1 - e.clientY / innerHeight * 2; mouse.want = 1; mouse.seen = performance.now(); wake(); };
let rest = 0;
addEventListener('scroll', () => {
  if (target() < 0.985) body.classList.add('rolling'); else body.classList.remove('rolling');
  clearTimeout(rest); rest = setTimeout(() => body.classList.remove('rolling'), 800);
  wake();
}, { passive: true });
addEventListener('resize', measure);
addEventListener('pointermove', aim, { passive: true });
addEventListener('pointerdown', aim, { passive: true });
document.addEventListener('pointerleave', () => { mouse.want = 0; wake(); });
// any wheel during the intro finishes the trace at once
addEventListener('wheel', () => { if (!intro.done) intro.t0 -= 3000; wake(); }, { passive: true, once: true });
if (reduce) { exp.classList.add('still', 'menu-on'); body.classList.add('ready'); }
if (!live) exp.classList.add('menu-on');
measure();
