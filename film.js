// Nolann Petri — Film. A screening room: the masking closes to the film's format, the projector beam
// takes the colour of the frame on screen, and that light spills onto the floor.
import { $, reduce, t, onLang } from './site.js';

const room = $('#room'), screen = $('#screen'), film = $('#film'), beam = $('#beam'), spill = $('#spill');
const playB = $('#play'), soundB = $('#sound'), fullB = $('#full'), scrub = $('#scrub'), tcEl = $('#f-tc'), nowT = $('#now-t');
// One film on the bill for now. The screen opens at the wide format, then the masking closes to the picture.
const FILM = { en: 'macOS Tahoe · First look', fr: 'macOS Tahoe · Première prise en main', format: 'v' };
setTimeout(() => { screen.dataset.format = FILM.format; }, reduce ? 0 : 700);
const mmss = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

function syncPlay() {
  const on = !film.paused;
  playB.dataset.state = on ? 'playing' : 'paused';
  playB.setAttribute('aria-label', on ? t('Pause', 'Pause') : t('Play', 'Lecture'));
}
playB.addEventListener('click', () => { film.paused ? film.play().catch(() => {}) : film.pause(); });
film.addEventListener('play', syncPlay);
film.addEventListener('pause', syncPlay);
film.addEventListener('click', () => { film.paused ? film.play().catch(() => {}) : film.pause(); });
film.addEventListener('timeupdate', () => {
  const d = film.duration || 0;
  tcEl.textContent = `${mmss(film.currentTime)} / ${mmss(d)}`;
  if (!scrub.matches(':active')) scrub.value = d ? Math.round(film.currentTime / d * 1000) : 0;
  scrub.style.setProperty('--p', `${scrub.value / 10}%`);
});
scrub.addEventListener('input', () => {
  if (film.duration) film.currentTime = scrub.value / 1000 * film.duration;
  scrub.style.setProperty('--p', `${scrub.value / 10}%`);
});
function setSound(on) {
  film.muted = !on;
  soundB.setAttribute('aria-pressed', String(on));
  soundB.setAttribute('aria-label', on ? t('Sound off', 'Couper le son') : t('Sound on', 'Activer le son'));
}
soundB.addEventListener('click', () => setSound(film.muted));
fullB.addEventListener('click', () => {
  if (document.fullscreenElement) document.exitFullscreen();
  else if (screen.requestFullscreen) screen.requestFullscreen().catch(() => {});
  else if (film.webkitEnterFullscreen) film.webkitEnterFullscreen();
});
addEventListener('keydown', e => {
  if (e.target.closest('input, textarea, button, a')) return;
  if (e.key === ' ') { e.preventDefault(); film.paused ? film.play().catch(() => {}) : film.pause(); }
  if (e.key === 'm') setSound(film.muted);
  if (e.key === 'f') fullB.click();
});
onLang(() => { nowT.textContent = t(FILM.en, FILM.fr); syncPlay(); setSound(!film.muted); });

/* ---------- light: the beam and the spill take the frame's colour ---------- */
const probe = document.createElement('canvas'); probe.width = 16; probe.height = 9;
const pctx = probe.getContext('2d', { willReadFrequently: true });
const sctx = spill.getContext('2d');
const bctx = beam.getContext('2d');
let rgb = [120, 140, 170], lum = 0.3, motes = [];
function sample() {
  if (film.readyState < 2) return;
  try {
    pctx.drawImage(film, 0, 0, 16, 9);
    const d = pctx.getImageData(0, 0, 16, 9).data;
    let r = 0, g = 0, b = 0;
    for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; }
    const n = d.length / 4;
    rgb = rgb.map((v, k) => v + ([r, g, b][k] / n - v) * 0.25);
    lum = (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255;
    sctx.drawImage(film, 0, 0, spill.width, spill.height);
  } catch {}
}
function sizeBeam() {
  const dpr = Math.min(devicePixelRatio || 1, 1.5);
  beam.width = Math.round(beam.clientWidth * dpr); beam.height = Math.round(beam.clientHeight * dpr);
  bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  motes = Array.from({ length: 110 }, () => ({ u: rnd(), v: rnd(), s: 0.4 + rnd() * 1.3, p: rnd() * 6.28 }));
}
let raf = 0, visible = false, lastSample = 0;
function draw(now) {
  raf = 0;
  if (now - lastSample > 120) { sample(); lastSample = now; }
  const W = beam.clientWidth, H = beam.clientHeight;
  const br = beam.getBoundingClientRect(), vr = film.getBoundingClientRect();
  const w = screen.dataset.format === 'v' ? vr.height * 9 / 16 : Math.min(vr.width, vr.height * 16 / 9);
  const x0 = vr.left + vr.width / 2 - w / 2 - br.left, x1 = x0 + w, y0 = vr.top - br.top, y1 = vr.bottom - br.top;
  // The projection port is a point of light above the stalls; the cone opens from it onto the screen.
  bctx.clearRect(0, 0, W, H);
  if (film.readyState >= 2) {
    const ax = (x0 + x1) / 2, ay = Math.max(6, y0 * 0.08);
    const [r, g, b] = rgb.map(v => Math.round(v * 0.55 + 255 * 0.45));
    const a = 0.05 + lum * 0.16;
    bctx.globalCompositeOperation = 'lighter';
    // nested cones: the core of the beam is brighter than its edges
    for (let k = 0; k < 6; k++) {
      const f = 1 - k / 6;
      const grad = bctx.createLinearGradient(0, ay, 0, y0);
      grad.addColorStop(0, `rgba(${r},${g},${b},${a * 0.9})`);
      grad.addColorStop(1, `rgba(${r},${g},${b},${a * 0.25})`);
      bctx.fillStyle = grad;
      bctx.beginPath(); bctx.moveTo(ax, ay);
      bctx.lineTo(ax + (x1 - ax) * f, y0); bctx.lineTo(ax - (ax - x0) * f, y0); bctx.closePath(); bctx.fill();
    }
    // dust turning in the light
    const time = now / 1000;
    for (const m of motes) {
      const v = (m.v + time * 0.01 * m.s) % 1, u = m.u + Math.sin(time * 0.3 + m.p) * 0.02;
      const y = ay + (y0 - ay) * v, half = ((x1 - x0) / 2) * v;
      const x = ax + (u - 0.5) * 2 * half;
      const tw = 0.5 + 0.5 * Math.sin(time * 2 + m.p * 3);
      bctx.fillStyle = `rgba(${r},${g},${b},${(0.1 + 0.4 * lum) * tw * (1 - Math.abs(u - 0.5) * 1.4)})`;
      bctx.fillRect(x, y, m.s * 1.4, m.s * 1.4);
    }
    // the port itself
    const port = bctx.createRadialGradient(ax, ay, 0, ax, ay, 26);
    port.addColorStop(0, `rgba(255,255,255,${0.5 + lum * 0.4})`); port.addColorStop(0.25, `rgba(${r},${g},${b},.35)`); port.addColorStop(1, 'rgba(0,0,0,0)');
    bctx.fillStyle = port; bctx.fillRect(ax - 26, ay - 26, 52, 52);
    bctx.globalCompositeOperation = 'source-over';
  }
  if (visible && !reduce) raf = requestAnimationFrame(draw);
}
new IntersectionObserver(([e]) => {
  visible = e.isIntersecting;
  if (visible) { if (!raf) raf = requestAnimationFrame(draw); if (film.paused && film.dataset.auto !== 'done' && !reduce) { film.dataset.auto = 'done'; film.play().catch(() => {}); } }
  else film.pause();
}).observe(room);
addEventListener('resize', sizeBeam);
sizeBeam();
if (reduce) { film.addEventListener('timeupdate', () => requestAnimationFrame(draw)); }
syncPlay();
setSound(false);
nowT.textContent = t(FILM.en, FILM.fr);
