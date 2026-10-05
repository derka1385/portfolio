// Nolann Petri — Photo. Scrolling runs the strip sideways; frames turn on a curved screen as they pass,
// and the ones near the gate are lit. Click to project one.
import { $, $$, clamp, lerp, reduce, projector, onLang } from './site.js';

const reel = $('#reel'), track = $('#track');
const items = [...track.children];
const frames = $$('.fr', track);
const readN = $('#reel-n'), readS = $('#reel-series');
projector($$('.fr-hit', track));

// Which series each frame belongs to (the slate before it)
let series = null;
items.forEach(el => { if (el.matches('.slate')) series = el; else el._series = series; });

// Widths come from the images' width/height attributes, so the strip can be measured once, before anything loads.
let travel = 0, top0 = 0, centres = [];
function measure() {
  if (reduce) return;
  track.style.transform = 'none';
  travel = Math.max(0, track.scrollWidth - innerWidth);
  reel.style.height = `${travel + innerHeight}px`;
  top0 = reel.getBoundingClientRect().top + scrollY;
  centres = items.map(el => el.offsetLeft + el.offsetWidth / 2);
  x = target();
  wake();
}
const target = () => -clamp((scrollY - top0) / Math.max(1, travel)) * travel;

let raf = 0, near = -1, x = 0, last = performance.now();
function frame(now) {
  raf = 0;
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  // a short, critically damped follow: the strip glides instead of stepping with each wheel notch
  const t = target();
  x = Math.abs(t - x) < 0.1 ? t : lerp(x, t, 1 - Math.exp(-dt / 0.085));
  track.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`;
  const mid = innerWidth / 2;
  let best = 1e9, bestEl = null;
  items.forEach((el, i) => {
    const d = (centres[i] + x - mid) / mid;               // -1 … 1 across the screen
    if (Math.abs(d) > 2.4) return;
    const a = clamp(d, -1.6, 1.6);
    el.style.transform = `translateZ(${(-Math.abs(a) * 140).toFixed(1)}px) rotateY(${(-a * 16).toFixed(2)}deg)`;
    if (!el.classList.contains('fr')) return;
    // light falls off smoothly with the distance to the centre of the screen
    const lit = 1 - clamp((Math.abs(d) - 0.12) / 0.7);
    el.style.setProperty('--lit', lit.toFixed(3));
    if (Math.abs(d) < best) { best = Math.abs(d); bestEl = el; }
  });
  if (bestEl) {
    const n = frames.indexOf(bestEl);
    if (n !== near) {
      near = n;
      readN.textContent = `${String(n + 1).padStart(2, '0')} / ${frames.length}`;
      readS.textContent = $('h2', bestEl._series)?.textContent || '';
    }
  }
  if (Math.abs(t - x) > 0.1) raf = requestAnimationFrame(frame);
}
const wake = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };

// The series index jumps to its slate in the strip
$$('.series a').forEach(a => a.addEventListener('click', e => {
  const slate = $(a.getAttribute('href'));
  if (!slate || reduce) return;
  e.preventDefault();
  const p = clamp((slate.offsetLeft - innerWidth * 0.12) / Math.max(1, travel));
  scrollTo({ top: top0 + p * travel, behavior: 'smooth' });
}));

if (!reduce) {
  addEventListener('scroll', wake, { passive: true });
  addEventListener('resize', measure);
  document.fonts?.ready.then(measure);
  measure();
} else frames.forEach(f => f.style.setProperty('--lit', 1));
onLang(() => { near = -1; wake(); });
