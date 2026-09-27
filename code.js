// Nolann Petri — Code. ORVECT on its own monitor, then every project as a clip on an edit timeline:
// drag the playhead and the viewer scrubs the real recording; the inspector holds the credits.
import { $, $$, clamp, reduce, canEmbed, load, t, onLang } from './site.js';

/* ---------- ORVECT: the monitor follows the step being read ---------- */
const steps = $$('.ov-step'), shots = $$('.monitor-stack > *'), ovUrl = $('#ov-url'), ovN = $('#ov-n');
let step = -1;
function setStep(i) {
  if (i === step) return;
  step = i;
  steps.forEach((s, k) => s.classList.toggle('on', k === i));
  shots.forEach((m, k) => {
    m.classList.toggle('on', k === i);
    if (m.tagName !== 'VIDEO') return;
    if (k === i && !reduce) { load(m); m.play().catch(() => {}); } else m.pause();
  });
  ovUrl.textContent = shots[i].dataset.url;
  ovN.textContent = `${i + 1} / ${shots.length}`;
}
function initSteps() {
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) setStep(+e.target.dataset.step); }), { rootMargin: '-45% 0px -50% 0px' });
  steps.forEach(s => io.observe(s));
  setStep(0);
}

/* ---------- the edit ---------- */
const TRACKS = [
  { id: 'company', en: 'ORVECT', fr: 'ORVECT' },
  { id: 'client', en: 'Clients', fr: 'Clients' },
  { id: 'hack', en: 'Hackathons', fr: 'Hackathons' },
  { id: 'tools', en: 'Tools', fr: 'Outils' },
];
const YEARS = [2025, 2026];
const nle = $('#nle'), tracksEl = $('#tracks'), timeline = $('#timeline'), head = $('#playhead');
const video = $('#v-video'), frameEl = $('#v-frame'), vUrl = $('#v-url'), vTc = $('#v-tc'), inspector = $('#inspector'), viewer = $('.viewer');
const articles = $$('.proj');

// Lay the clips out: each track splits into one half per year; clips of a year sit side by side in its half.
const clips = [];
TRACKS.forEach((tr, ti) => {
  const row = document.createElement('div');
  row.className = 'track';
  row.style.setProperty('--c', `var(--track-${tr.id})`);
  row.innerHTML = `<div class="track-label"><b>V${TRACKS.length - ti}</b><i></i><span data-t="${tr.id}">${tr.en}</span></div><div class="lane"></div>`;
  const lane = $('.lane', row);
  tracksEl.append(row);
  YEARS.forEach((y, yi) => {
    const mine = articles.filter(a => a.dataset.track === tr.id && +a.dataset.year === y);
    const half = 100 / YEARS.length, gap = 0.5;
    const w = Math.min(half * 0.62, (half - gap * (mine.length + 1)) / Math.max(mine.length, 1));
    mine.forEach((a, k) => {
      const left = yi * half + gap + k * (w + gap);
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'clip';
      b.style.left = `${left}%`; b.style.width = `${w}%`;
      b.style.setProperty('--thumb', `url(${a.dataset.poster})`);
      b.setAttribute('aria-pressed', 'false');
      lane.append(b);
      clips.push({ a, b, ti, left, w, track: tr });
    });
  });
});
clips.sort((p, q) => p.left - q.left || p.ti - q.ti);
function labelClips() {
  clips.forEach(c => {
    const title = $('h3', c.a).textContent;
    c.b.innerHTML = `<span>${title}</span>`;
    c.b.setAttribute('aria-label', `${title}, ${$('.meta', c.a).textContent}`);
  });
  $$('[data-t]', tracksEl).forEach(s => { const tr = TRACKS.find(x => x.id === s.dataset.t); s.textContent = t(tr.en, tr.fr); });
}

let cur = null, x = 0, dragging = false, targetTrack = 0;
const pad = n => String(n).padStart(2, '0');
const tcOf = s => { const f = Math.floor(s * 25); return `00:${pad(Math.floor(f / 1500) % 60)}:${pad(Math.floor(f / 25) % 60)}:${pad(f % 25)}`; };

function inspect(c) {
  const a = c.a;
  const url = a.dataset.url;
  inspector.innerHTML = '';
  const h = $('h3', a).cloneNode(true);
  const meta = document.createElement('p'); meta.className = 'meta';
  meta.innerHTML = `<i style="--c: var(--track-${c.track.id})"></i>${t(c.track.en, c.track.fr)} · ${$('.meta', a).innerHTML}`;
  const actions = document.createElement('p'); actions.className = 'actions';
  actions.innerHTML = `<a class="btn solid" id="try" href="${url}" target="_blank" rel="noopener">${t('Try it live', 'Tester en direct')}<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5h10v10M19 5 6 18"/></svg></a>`;
  inspector.append(h, meta, $('.facts', a).cloneNode(true), $('.stack', a).cloneNode(true), actions);
  $('#try', inspector).addEventListener('click', e => {
    if (!canEmbed()) return;
    e.preventDefault();
    live(url);
  });
}
function live(url) {
  viewer.classList.add('loading');
  video.pause(); frameEl.hidden = false; frameEl.src = url;
  const back = document.createElement('button');
  back.type = 'button'; back.className = 'btn'; back.textContent = t('Back to the recording', 'Revenir à l’enregistrement');
  back.addEventListener('click', () => { unlive(); back.remove(); });
  $('.actions', inspector).append(back);
}
function unlive() {
  frameEl.hidden = true; frameEl.removeAttribute('src'); viewer.classList.remove('loading');
  if (!reduce) video.play().catch(() => {});
}
frameEl.addEventListener('load', () => viewer.classList.remove('loading'));

function select(c, { seek = null, keepX = false } = {}) {
  if (c !== cur) {
    cur?.b.setAttribute('aria-pressed', 'false');
    cur = c;
    c.b.setAttribute('aria-pressed', 'true');
    targetTrack = c.ti;
    unlive();
    video.poster = c.a.dataset.poster;
    video.src = c.a.dataset.video;
    vUrl.textContent = c.a.dataset.url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    inspect(c);
  }
  if (!keepX) { placeHead(c.left + 0.02); reveal(); }
  if (seek !== null) {
    const go = () => { video.currentTime = seek * (video.duration || 0); };
    if (video.readyState >= 1) go(); else video.addEventListener('loadedmetadata', go, { once: true });
  }
  if (!dragging && !reduce) video.play().catch(() => {});
}

function placeHead(pct) {
  x = clamp(pct, 0, 100);
  const lane = $('.lane', tracksEl);
  head.style.left = `calc(var(--lab) + ${x / 100} * ${lane.offsetWidth}px)`;
  head.setAttribute('aria-valuenow', Math.round(x));
  head.setAttribute('aria-valuetext', cur ? $('h3', cur.a).textContent : '');
}
// On narrow screens the timeline scrolls: bring the playhead into view
function reveal() {
  if (timeline.scrollWidth <= timeline.clientWidth + 2) return;
  const hx = head.offsetLeft;
  if (hx < timeline.scrollLeft + 140 || hx > timeline.scrollLeft + timeline.clientWidth - 40)
    timeline.scrollTo({ left: Math.max(0, hx - timeline.clientWidth * 0.35), behavior: reduce ? 'auto' : 'smooth' });
}
// Which clip is under the playhead: the targeted track first, then the top-most one, as an editor composites.
function under(pct) {
  const hit = c => pct >= c.left && pct <= c.left + c.w;
  return clips.find(c => c.ti === targetTrack && hit(c)) || [...clips].sort((p, q) => p.ti - q.ti).find(hit) || null;
}
function scrubTo(pct) {
  placeHead(pct);
  const c = under(x);
  if (!c) return;
  select(c, { seek: clamp((x - c.left) / c.w), keepX: true });
}

// While the recording plays, the playhead rides along inside its clip
video.addEventListener('timeupdate', () => {
  vTc.textContent = tcOf(video.currentTime);
  if (!cur || dragging || !video.duration) return;
  placeHead(cur.left + (video.currentTime / video.duration) * cur.w);
});

function laneX(e) {
  const r = $('.lane', tracksEl).getBoundingClientRect();
  return ((e.clientX - r.left) / r.width) * 100;
}
timeline.addEventListener('pointerdown', e => {
  if (e.target.closest('.track-label')) return;
  const clip = e.target.closest('.clip');
  if (clip) { const c = clips.find(k => k.b === clip); targetTrack = c.ti; }
  e.preventDefault();
  dragging = true; video.pause();
  timeline.setPointerCapture(e.pointerId);
  scrubTo(laneX(e));
});
timeline.addEventListener('pointermove', e => { if (dragging) scrubTo(laneX(e)); });
const release = () => { if (!dragging) return; dragging = false; if (!reduce && frameEl.hidden) video.play().catch(() => {}); };
timeline.addEventListener('pointerup', release);
timeline.addEventListener('pointercancel', release);
clips.forEach(c => c.b.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(c); } }));
head.addEventListener('keydown', e => {
  const d = { ArrowRight: 1, ArrowLeft: -1, PageUp: 10, PageDown: -10 }[e.key];
  if (d) { e.preventDefault(); scrubTo(x + d); release(); }
});
// ← → jump from clip to clip, as edit points
addEventListener('keydown', e => {
  if (!['ArrowRight', 'ArrowLeft'].includes(e.key) || e.target === head || e.target.matches('input, textarea')) return;
  const r = nle.getBoundingClientRect();
  if (r.bottom < 0 || r.top > innerHeight) return;
  e.preventDefault();
  const i = clips.indexOf(cur), n = clips[(i + (e.key === 'ArrowRight' ? 1 : -1) + clips.length) % clips.length];
  select(n);
});

// Play only while the suite is on screen
new IntersectionObserver(([e]) => {
  if (!cur) return;
  if (e.isIntersecting && !reduce && frameEl.hidden) video.play().catch(() => {}); else video.pause();
}).observe(nle);

/* ---------- start ---------- */
initSteps();
nle.hidden = false;
$('#suite').classList.add('js-suite');
labelClips();
select(clips.find(c => c.a.id === 'p-orvect-app') || clips[0]);
video.pause();
addEventListener('resize', () => placeHead(x));
onLang(() => { labelClips(); if (cur) inspect(cur); });
