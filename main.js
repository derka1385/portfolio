// Nolann Petri — Plein phares. The visitor's pointer is a headlight; scrolling drives north.
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const coarse = matchMedia('(pointer: coarse)');
const store = {
  get: (k, s = localStorage) => { try { return s.getItem(k); } catch { return null; } },
  set: (k, v, s = localStorage) => { try { s.setItem(k, v); } catch {} },
};
// Inside another frame (a preview), embedding other sites is blocked, so live links open a new tab instead.
const embedded = (() => { try { return self !== window.top; } catch { return true; } })();
const canEmbed = () => !embedded && innerWidth > 900;
root.classList.add('js');
let raf = 0, lit = false; // the render loop handle, and whether the headlights are on

// The route: Sarreguemines → Stockholm, 1 652 km by road, driven overnight.
const FROM = [49.110, 7.069], TO = [59.329, 18.069], KM = 1652;
const CLOCK0 = 22 * 60 + 14, CLOCK1 = 29 * 60 + 42; // 22:14 → 05:42 next morning

/* ---------- the name, one letter at a time ---------- */
let li = 0;
for (const line of $$('.name .l1, .name .l2')) {
  line.innerHTML = [...line.textContent].map(c => `<span class="ch" style="--i:${li++}">${c}</span>`).join('');
}
const letters = $$('.name .ch');

/* ---------- manifesto words ---------- */
const manifesto = $('[data-words]');
let words = [];
function splitWords(el) {
  let out = '';
  for (const part of el.innerHTML.split(/(<em>.*?<\/em>)/)) {
    const em = part.startsWith('<em>');
    for (const t of (em ? part.slice(4, -5) : part).split(/(\s+)/)) out += t.trim() ? `<span class="w${em ? ' em' : ''}">${t}</span>` : t;
  }
  el.innerHTML = out;
  return $$('.w', el);
}

/* ---------- headlight beam: pointer or finger aims it; it eases like a steering rack ---------- */
const beam = { x: innerWidth * .5, y: innerHeight * .58, tx: innerWidth * .5, ty: innerHeight * .58, aimed: false, on: 0, onT: 0 };
addEventListener('pointermove', e => {
  if (e.pointerType === 'mouse' || e.pointerType === 'pen') { beam.tx = e.clientX; beam.ty = e.clientY; beam.aimed = true; wake(); }
}, { passive: true });
addEventListener('pointerdown', e => { if (e.pointerType === 'touch') { beam.tx = e.clientX; beam.ty = e.clientY; beam.aimed = true; beam.touchAt = performance.now(); wake(); } }, { passive: true });
addEventListener('pointerleave', () => { beam.aimed = false; wake(); });

// High beam: everything lit (also the accessible reading mode). Reduced motion starts on high beam.
const beamBtn = $('#beam');
let high = store.get('np-high') === '1' || reduce.matches;
function setHigh(v) {
  high = v;
  beamBtn.setAttribute('aria-pressed', String(v));
  root.style.setProperty('--high', v ? 1 : 0);
  store.set('np-high', v ? '1' : '0');
  wake();
}
beamBtn.addEventListener('click', () => setHigh(!high));
setHigh(high);

/* ---------- videos: loaded when near, played only while lit ---------- */
function want(v, on) {
  if (on) {
    if (!v.getAttribute('src') && v.dataset.src) v.src = v.dataset.src;
    if (v.paused) v.play().catch(() => {});
  } else if (!v.paused) v.pause();
}
const near = new IntersectionObserver(es => es.forEach(e => { e.target._near = e.isIntersecting; }), { rootMargin: '200px 0px' });

/* ---------- ORVECT: the car display follows the active step ---------- */
const steps = $$('.step'), shots = $$('.display-stack > *'), screenUrl = $('#screen-url'), screenStep = $('#screen-step');
shots.forEach(m => { if (m.tagName === 'VIDEO') near.observe(m); });
let activeStep = -1;
function setStep(a) {
  if (a === activeStep) return;
  activeStep = a;
  steps.forEach((s, i) => s.classList.toggle('on', i === a));
  shots.forEach((m, i) => m.classList.toggle('on', i === a));
  screenUrl.textContent = shots[a].dataset.url;
  screenStep.textContent = `${a + 1} / ${shots.length}`;
}

/* ---------- roadside signs ---------- */
const panels = $$('.panel:not([hidden])');
for (const p of panels) {
  const v = $('video', p);
  near.observe(v);
  p._video = v;
  $('.panel-hit', p).addEventListener('click', () => openProj(p));
  p.addEventListener('pointerenter', () => { p._hover = true; });
  p.addEventListener('pointerleave', () => { p._hover = false; });
}

/* ---------- project window ---------- */
const dlg = $('#proj'), pVideo = $('#proj-video'), pFrame = $('#proj-frame'), pLive = $('#proj-live'), pOpen = $('#proj-open');
let current = null;
function openProj(card) {
  current = card;
  const i = panels.indexOf(card);
  dlg.classList.toggle('solo', i < 0);
  dlg.classList.remove('live', 'ready');
  $('#proj-url').textContent = card.dataset.url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  pOpen.href = pLive.href = card.dataset.url;
  $('#proj-meta').innerHTML = $('.panel-meta', card).innerHTML;
  $('#proj-title').textContent = $('.panel-title', card).textContent;
  $('#proj-detail').innerHTML = $('.panel-detail', card).innerHTML;
  $('#proj-count').textContent = `${String(i + 1).padStart(2, '0')} / ${String(panels.length).padStart(2, '0')}`;
  pFrame.hidden = true; pFrame.removeAttribute('src');
  pVideo.hidden = false; pVideo.poster = card.dataset.poster; pVideo.src = card.dataset.video;
  pVideo.play().catch(() => {});
  if (!dlg.open) dlg.showModal();
}
function stepProj(dir) {
  if (!current || panels.indexOf(current) < 0) return;
  openProj(panels[(panels.indexOf(current) + dir + panels.length) % panels.length]);
}
pLive.addEventListener('click', e => {
  if (!canEmbed()) return;
  e.preventDefault();
  dlg.classList.add('live'); pVideo.pause();
  pFrame.hidden = false; pFrame.src = pLive.href;
});
pFrame.addEventListener('load', () => { if (dlg.classList.contains('live')) { dlg.classList.add('ready'); pVideo.hidden = true; } });
$('#proj-close').addEventListener('click', () => dlg.close());
$('#proj-prev').addEventListener('click', () => stepProj(-1));
$('#proj-next').addEventListener('click', () => stepProj(1));
dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
dlg.addEventListener('close', () => { pVideo.pause(); pVideo.removeAttribute('src'); pVideo.load(); pFrame.removeAttribute('src'); });
dlg.addEventListener('keydown', e => { if (e.key === 'ArrowRight') stepProj(1); if (e.key === 'ArrowLeft') stepProj(-1); });
$$('[data-open]').forEach(b => b.addEventListener('click', () => openProj($(`#${b.dataset.open}`))));

/* ---------- lightbox ---------- */
const lb = $('#lightbox'), lbImg = $('#lb-img'), lbCap = $('#lb-cap');
let lbSet = [], lbI = 0;
function lbShow(i) {
  lbI = (i + lbSet.length) % lbSet.length;
  const el = lbSet[lbI], img = $('img', el);
  lbImg.src = img.currentSrc || img.src; lbImg.alt = img.alt;
  lbCap.textContent = (lang === 'fr' && el.dataset.capFr) || el.dataset.cap;
}
function lbOpen(set, i) { lbSet = set; lbShow(i); lb.showModal(); }
$('#lb-prev').addEventListener('click', () => lbShow(lbI - 1));
$('#lb-next').addEventListener('click', () => lbShow(lbI + 1));
$('#lb-close').addEventListener('click', () => lb.close());
lb.addEventListener('click', e => { if (e.target === lb) lb.close(); });
lb.addEventListener('keydown', e => { if (e.key === 'ArrowRight') lbShow(lbI + 1); if (e.key === 'ArrowLeft') lbShow(lbI - 1); });

/* ---------- design: the tunnel wall slides by ---------- */
const bore = $('#bore'), wall = $('#wall'), prints = $$('.print'), brands = $$('.bore-brand'), wallCap = $('#wall-cap');
prints.forEach((p, i) => p.addEventListener('click', () => lbOpen(prints, i)));
let boreOn = false, firstC = 0, lastC = 0, wallFront = -1;
function layoutBore() {
  boreOn = !reduce.matches && innerHeight > 520;
  bore.classList.toggle('on', boreOn);
  wall.style.setProperty('--wx', 0);
  // The wall travels from the first visual centred to the last one centred.
  firstC = prints[0].offsetLeft + prints[0].offsetWidth / 2;
  lastC = prints.at(-1).offsetLeft + prints.at(-1).offsetWidth / 2;
  wallFront = -1;
}
function setFront(i) {
  if (i === wallFront) return;
  wallFront = i;
  const p = prints[i];
  brands.forEach(b => b.classList.toggle('on', b.dataset.brand === p.dataset.brand));
  wallCap.textContent = (lang === 'fr' && p.dataset.capFr) || p.dataset.cap;
}

/* ---------- route: the roadbook follows the car ---------- */
const journey = $('#journey'), map = $('#map'), stopEls = $$('.stop'), yearEl = $('#journey-year'), rail = $('#rail');
const NS = 'http://www.w3.org/2000/svg', COS = Math.cos(52 * Math.PI / 180);
const LON0 = -3, LON1 = 21, LAT1 = 61, K = 600 / ((LON1 - LON0) * COS), MAP_H = Math.round((LAT1 - 43.5) * K);
const proj = (lat, lon) => [(lon - LON0) * COS * K, (LAT1 - lat) * K];
const svg = (tag, attrs, parent = map) => {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  parent.append(e); return e;
};
map.setAttribute('viewBox', `0 0 600 ${MAP_H}`);
for (let lon = -5; lon <= 25; lon += 5) {
  const [x] = proj(LAT1, lon);
  svg('line', { x1: x, y1: -400, x2: x, y2: MAP_H + 400, class: 'g-line' });
  svg('text', { x: x + 5, y: MAP_H - 8, class: 'g-label' }).textContent = `${lon}°E`;
}
for (let lat = 40; lat <= 65; lat += 5) {
  const [, y] = proj(lat, LON0);
  svg('line', { x1: -400, y1: y, x2: 1000, y2: y, class: 'g-line' });
  svg('text', { x: 6, y: y - 6, class: 'g-label' }).textContent = `${lat}°N`;
}
const mapped = stopEls.filter(s => s.dataset.lat);
const pts = mapped.map(s => proj(+s.dataset.lat, +s.dataset.lon));
let routeD = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
const legsD = [routeD];
for (let i = 1; i < pts.length; i++) {
  const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
  if (Math.hypot(x1 - x0, y1 - y0) > 1) routeD += ` Q${((x0 + x1) / 2 + (y1 - y0) * .18).toFixed(1)} ${((y0 + y1) / 2 - (x1 - x0) * .18).toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  legsD.push(routeD);
}
svg('path', { d: routeD, class: 'route-base' });
const liveRoute = svg('path', { d: routeD, class: 'route-live' });
const probe = svg('path', { d: legsD[0], fill: 'none' });
const lens = legsD.map(l => { probe.setAttribute('d', l); return probe.getTotalLength(); });
probe.remove();
const total = lens.at(-1);
liveRoute.style.strokeDasharray = `${total}`;
const hav = (a, b) => {
  const R = 6371, r = Math.PI / 180, dLat = (b[0] - a[0]) * r, dLon = (b[1] - a[1]) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};
const kmAt = [0];
for (let i = 1; i < mapped.length; i++) kmAt.push(kmAt[i - 1] + hav([+mapped[i - 1].dataset.lat, +mapped[i - 1].dataset.lon], [+mapped[i].dataset.lat, +mapped[i].dataset.lon]));
const [sx, sy] = proj(59.33, 18.07), dv = [(55.27 - 18.07) * COS, 59.33 - 25.2], dn = Math.hypot(...dv);
const tEdge = Math.min((594 - sx) / (dv[0] / dn), (MAP_H - 30 - sy) / (dv[1] / dn));
const dub = svg('g', { class: 'dubai' });
svg('line', { x1: sx, y1: sy, x2: sx + dv[0] / dn * tEdge, y2: sy + dv[1] / dn * tEdge }, dub);
svg('text', { x: 594, y: sy + dv[1] / dn * tEdge + 18, 'text-anchor': 'end' }, dub).textContent = 'DUBAI · 4 850 KM';
const places = new Map();
mapped.forEach((s, i) => { if (!places.has(s.dataset.place)) places.set(s.dataset.place, { first: stopEls.indexOf(s), p: pts[i] }); });
for (const [name, pl] of places) {
  const [x, y] = pl.p, right = x < 420;
  const g = pl.el = svg('g', { class: 'node', tabindex: 0, role: 'button', 'aria-label': name });
  svg('circle', { cx: x, cy: y, r: 6 }, g);
  svg('text', { x: right ? x + 15 : x - 15, y: y + 4, 'text-anchor': right ? 'start' : 'end' }, g).textContent = name.split(' · ')[0];
  g.addEventListener('click', () => goStop(pl.first));
  g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goStop(pl.first); } });
}
const car = svg('g', { class: 'car' });
svg('circle', { r: 18, class: 'car-halo' }, car);
const arrow = svg('path', { d: 'M11 0 -7 -8 -3 0 -7 8Z', class: 'car-arrow' }, car);
const ticks = stopEls.map((s, i) => {
  const t = document.createElement('button');
  t.type = 'button'; t.className = 'tick'; t.textContent = s.dataset.year;
  t.style.left = `${((i + .5) / stopEls.length * 100).toFixed(2)}%`;
  t.addEventListener('click', () => goStop(i));
  rail.append(t); return t;
});
const railFill = $('#rail-fill');
$('#leg-total').textContent = String(stopEls.length).padStart(2, '0');
const cluster = pts.slice(0, 5), cMinX = Math.min(...cluster.map(p => p[0])), cMaxX = Math.max(...cluster.map(p => p[0]));
const cMinY = Math.min(...cluster.map(p => p[1])), cMaxY = Math.max(...cluster.map(p => p[1]));
const CW = Math.max(cMaxX - cMinX + 200, 340), CC = [(cMinX + cMaxX) / 2 + 40, (cMinY + cMaxY) / 2];
function goStop(i) {
  const behavior = reduce.matches ? 'auto' : 'smooth';
  if (!journey.classList.contains('pinned')) return stopEls[i].scrollIntoView({ behavior, block: 'center' });
  const topY = journey.getBoundingClientRect().top + scrollY;
  scrollTo({ top: topY + (i + .55) / stopEls.length * (journey.offsetHeight - innerHeight), behavior });
}
let curStop = -1;
function setStop(i) {
  if (i === curStop) return;
  curStop = i;
  const s = stopEls[i];
  stopEls.forEach((el, j) => el.classList.toggle('on', j === i));
  ticks.forEach((t, j) => { t.classList.toggle('on', j === i); t.classList.toggle('done', j < i); });
  for (const [name, pl] of places) { pl.el.classList.toggle('on', name === s.dataset.place); pl.el.classList.toggle('done', pl.first <= i); }
  yearEl.textContent = s.dataset.year;
  $('#leg-n').textContent = String(i + 1).padStart(2, '0');
  map.classList.toggle('remote', !!s.dataset.remote);
}
function drive(f) {
  const k = Math.min(Math.floor(f), lens.length - 1), k2 = Math.min(k + 1, lens.length - 1), t = f - k;
  const L = lens[k] + (lens[k2] - lens[k]) * t;
  liveRoute.style.strokeDashoffset = `${total - L}`;
  const p = liveRoute.getPointAtLength(L), q = liveRoute.getPointAtLength(Math.min(total, L + 2)), q0 = liveRoute.getPointAtLength(Math.max(0, L - 2));
  const ang = Math.atan2(q.y - q0.y, q.x - q0.x) * 180 / Math.PI;
  car.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`);
  if (q.x !== q0.x || q.y !== q0.y) arrow.setAttribute('transform', `rotate(${ang.toFixed(1)})`);
  $('#leg-km').textContent = Math.round(kmAt[k] + (kmAt[k2] - kmAt[k]) * t).toLocaleString('fr-FR');
  $('#leg-hdg').textContent = `${String(Math.round((ang + 90 + 360) % 360)).padStart(3, '0')}°`;
  const out = smooth(3.9, 4.9, f), w = lerp(CW, 600, out), h = w * MAP_H / 600;
  const cx = lerp(lerp(CC[0], p.x, .45), 300, out), cy = lerp(lerp(CC[1], p.y, .45), MAP_H / 2, out);
  map.setAttribute('viewBox', `${(cx - w / 2).toFixed(1)} ${(cy - h / 2).toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`);
}

/* ---------- language ---------- */
const tr = $$('[data-fr]');
tr.forEach(el => { el.dataset.en = el.innerHTML; });
const labelled = $$('[data-label-fr]');
labelled.forEach(el => { el.dataset.labelEn = el.getAttribute('aria-label'); });
let lang = 'en';
function setLang(l) {
  lang = l;
  tr.forEach(el => { el.innerHTML = el.dataset[l]; });
  labelled.forEach(el => el.setAttribute('aria-label', l === 'fr' ? el.dataset.labelFr : el.dataset.labelEn));
  root.lang = l;
  const b = $('#lang');
  b.textContent = l === 'en' ? 'FR' : 'EN';
  b.setAttribute('aria-label', l === 'en' ? 'Passer en français' : 'Switch to English');
  words = splitWords(manifesto);
  store.set('np-lang', l);
  lastLeg = -1; wallFront = -1;
  if (dlg.open && current) openProj(current);
  if (lb.open) lbShow(lbI);
  layout(); wake();
}
$('#lang').addEventListener('click', () => setLang(lang === 'en' ? 'fr' : 'en'));

/* ---------- copy e-mail ---------- */
$('#copy').addEventListener('click', async e => {
  const b = e.currentTarget, mail = $('#email');
  try {
    await navigator.clipboard.writeText(mail.textContent);
    b.textContent = lang === 'fr' ? 'Copié' : 'Copied';
  } catch {
    const r = document.createRange(); r.selectNodeContents(mail);
    const s = getSelection(); s.removeAllRanges(); s.addRange(r);
    b.textContent = lang === 'fr' ? 'Sélectionné' : 'Selected';
  }
  setTimeout(() => { b.innerHTML = b.dataset[lang]; }, 1800);
});

/* ---------- legs: where on the night drive the scroll is ---------- */
const legEls = [0, 1, 2, 3, 4].map(n => $(`[data-leg="${n}"]`));
let legTops = [], docMax = 1;
function measureLegs() {
  legTops = legEls.map(el => el.getBoundingClientRect().top + scrollY);
  docMax = Math.max(1, root.scrollHeight - innerHeight);
}
function legAt(y) {
  // Continuous leg position: 0 = Sarreguemines … 4 = Stockholm, measured at mid-screen.
  const m = y + innerHeight * .5;
  for (let n = legTops.length - 1; n >= 0; n--) {
    if (m >= legTops[n]) {
      const end = n < legTops.length - 1 ? legTops[n + 1] : docMax + innerHeight;
      return n + clamp((m - legTops[n]) / Math.max(1, end - legTops[n]));
    }
  }
  return 0;
}

/* ---------- beam → lit: every retroreflective thing flares when the light reaches it ---------- */
const reflectors = $$('.reflect');
function litFor(r, R) {
  if (high) return 1;
  const dx = Math.max(r.left - beam.x, 0, beam.x - r.right), dy = Math.max(r.top - beam.y, 0, beam.y - r.bottom);
  return beam.on * (1 - smooth(0, R, Math.hypot(dx, dy * 1.25)));
}

/* ---------- main loop ---------- */
const trip = { clock: $('#trip-clock'), leg: $('#trip-leg'), km: $('#trip-km'), gps: $('#trip-gps'), bar: $('#trip-bar') };
const heroEl = $('.hero'), navLinks = $$('.nav a'), sections = $$('main > section[id]');
let scene = null, lastLeg = -1, lastY = -1, vel = 0;

function layout() {
  layoutBore();
  const pinJ = innerWidth > 900 && innerHeight > 620;
  journey.classList.toggle('pinned', pinJ);
  map.setAttribute('preserveAspectRatio', pinJ ? 'xMidYMid slice' : 'xMidYMid meet');
  curStop = -1;
  if (!pinJ) {
    liveRoute.style.strokeDashoffset = '0';
    map.setAttribute('viewBox', `0 0 600 ${MAP_H}`);
    stopEls.forEach(s => s.classList.remove('on'));
    for (const pl of places.values()) { pl.el.classList.add('done'); pl.el.classList.remove('on'); }
  }
  measureLegs();
}
function wake() { if (!raf) raf = requestAnimationFrame(tick); }
const inView = (r, vh) => r.bottom > 0 && r.top < vh;

function tick(now) {
  raf = 0;
  const vw = innerWidth, vh = innerHeight, y = scrollY;
  const p = clamp(y / docMax);
  vel = lerp(vel, y - (lastY < 0 ? y : lastY), .2); lastY = y;
  let busy = false;

  // Beam: follows the pointer; with no pointer (phones, or before the mouse moves), it holds the road ahead.
  if (!beam.aimed || (coarse.matches && performance.now() - (beam.touchAt || 0) > 2600)) {
    const t = now / 1000;
    beam.tx = vw * (.5 + Math.sin(t * .35) * .06);
    beam.ty = vh * (.56 + Math.sin(t * .23) * .03);
    busy = true;
  }
  const k = reduce.matches ? 1 : .14;
  beam.x += (beam.tx - beam.x) * k; beam.y += (beam.ty - beam.y) * k;
  if (Math.abs(beam.tx - beam.x) + Math.abs(beam.ty - beam.y) > .5) busy = true;
  if (beam.on < beam.onT) { beam.on = Math.min(beam.onT, beam.on + .025); busy = true; }
  if (beam.on > beam.onT) { beam.on = Math.max(beam.onT, beam.on - .03); busy = true; }

  // Legs, weather and the clock
  const legF = legAt(y);
  const dawn = smooth(3.55, 4.05, legF);
  const onFactor = beam.on * (1 - dawn);
  root.style.setProperty('--bx', `${beam.x.toFixed(1)}px`);
  root.style.setProperty('--by', `${beam.y.toFixed(1)}px`);
  root.style.setProperty('--beam-on', onFactor.toFixed(3));
  root.style.setProperty('--dawn', dawn.toFixed(3));
  const R = Math.min(vw, vh) * .34;

  // Hero: letters light as the beam crosses them; the name pulls away as you drive off
  const hr = heroEl.getBoundingClientRect();
  if (inView(hr, vh)) {
    root.style.setProperty('--hp', reduce.matches ? 0 : clamp(-hr.top / hr.height).toFixed(3));
    if (lit) for (const c of letters) c.style.setProperty('--lit', litFor(c.getBoundingClientRect(), R * .7).toFixed(3));
  }

  // Retroreflective signs, kilometre markers, panels
  for (const el of reflectors) {
    const r = el.getBoundingClientRect();
    if (!inView(r, vh)) continue;
    const v = lit ? litFor(r, R) : 0;
    el.style.setProperty('--lit', v.toFixed(3));
    el._lit = v;
  }
  // Signs play their demo only while lit (on high beam: while near the middle of the screen)
  for (const pnl of panels) {
    const r = pnl.getBoundingClientRect(), v = pnl._video;
    const mid = 1 - smooth(0, vh * .45, Math.abs((r.top + r.bottom) / 2 - vh * .5));
    const on = v._near && inView(r, vh) && (pnl._hover || (high || coarse.matches ? mid > .5 : (pnl._lit || 0) > .42));
    want(v, on);
  }

  // Manifesto lights up word by word
  const mr = manifesto.parentElement.parentElement.getBoundingClientRect();
  if (inView(mr, vh)) {
    const mp = reduce.matches ? words.length : clamp(-mr.top / (mr.height - vh)) * words.length * 1.15;
    words.forEach((w, i) => w.classList.toggle('on', i < mp));
  }

  // ORVECT: the display follows the active step
  let a = 0;
  steps.forEach((s, i) => { if (s.getBoundingClientRect().top < vh * .5) a = i; });
  setStep(a);
  shots.forEach((m, i) => { if (m.tagName === 'VIDEO') want(m, m._near && i === activeStep && !document.hidden); });

  // Tunnel: the wall slides by; each lamp we pass washes the page in sodium light
  let sod = 0;
  if (boreOn) {
    const r = bore.getBoundingClientRect();
    if (inView(r, vh)) {
      const bp = clamp(-r.top / (r.height - vh));
      wall.style.setProperty('--wx', (vw / 2 - lerp(firstC, lastC, bp)).toFixed(1));
      let best = 0, bd = 1e9;
      prints.forEach((pr, i) => {
        const pr2 = pr.getBoundingClientRect(), c = (pr2.left + pr2.right) / 2;
        pr.style.setProperty('--lit', lit ? litFor(pr2, R * .8).toFixed(3) : 0);
        const d = Math.abs(c - vw / 2);
        if (d < bd) { bd = d; best = i; }
      });
      setFront(best);
      const inT = smooth(0, .06, bp) * (1 - smooth(.94, 1, bp));
      sod = inT * Math.max(0, Math.cos(bp * Math.PI * 2 * 22)) ** 6 * .9 + inT * .25;
    }
  }
  root.style.setProperty('--sod', sod.toFixed(3));

  // Route: the car moves with every scroll step and the roadbook follows it
  if (journey.classList.contains('pinned')) {
    const r = journey.getBoundingClientRect();
    if (inView(r, vh)) {
      const n = stopEls.length, jp = clamp(-r.top / (r.height - vh)), sp = jp * n;
      setStop(Math.min(n - 1, Math.floor(sp)));
      drive(clamp(sp - .5, 0, pts.length - 1));
      railFill.style.transform = `scaleX(${jp.toFixed(4)})`;
    }
  }

  document.querySelector('.top').classList.toggle('scrolled', y > 40);
  // Trip computer
  const mins = Math.round(lerp(CLOCK0, CLOCK1, p)) % (24 * 60);
  trip.clock.textContent = `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
  trip.km.textContent = String(Math.round(p * KM)).padStart(4, '0');
  trip.gps.textContent = `${(FROM[0] + p * (TO[0] - FROM[0])).toFixed(3)}°N ${(FROM[1] + p * (TO[1] - FROM[1])).toFixed(3).padStart(6, '0')}°E`;
  trip.bar.style.transform = `scaleX(${p.toFixed(4)})`;
  const legN = Math.min(4, Math.floor(legF));
  if (legN !== lastLeg) {
    lastLeg = legN;
    const el = legEls[legN];
    trip.leg.textContent = lang === 'fr' ? el.dataset.placeFr : el.dataset.place;
    document.body.dataset.leg = legN;
  }
  let cur = sections[0];
  for (const s of sections) if (s.getBoundingClientRect().top < vh * .5) cur = s;
  navLinks.forEach(l => l.hash === `#${cur.id}` ? l.setAttribute('aria-current', 'location') : l.removeAttribute('aria-current'));

  scene?.update({ p, legF, dawn, on: onFactor, aimX: beam.x / vw * 2 - 1, aimY: beam.y / vh * 2 - 1, sod });
  sound?.update({ speed: Math.min(1, Math.abs(vel) / 40), legF, sod });

  if (busy || scene?.animating()) wake();
}

addEventListener('scroll', wake, { passive: true });
addEventListener('resize', () => { layout(); scene?.resize(); wake(); });
reduce.addEventListener('change', () => { layout(); wake(); });
addEventListener('load', () => { layout(); wake(); });
document.fonts?.ready.then(() => { layout(); wake(); });
new ResizeObserver(() => measureLegs()).observe(document.body);

setLang(store.get('np-lang') || ((navigator.language || '').toLowerCase().startsWith('fr') ? 'fr' : 'en'));

/* ---------- sound of the drive: synthesised, off until asked for ---------- */
let sound = null;
const soundBtn = $('#sound');
soundBtn.addEventListener('click', () => {
  sound ??= createSound();
  if (!sound) return;
  const on = soundBtn.getAttribute('aria-pressed') !== 'true';
  soundBtn.setAttribute('aria-pressed', String(on));
  sound.set(on);
  wake();
});
function createSound() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  const ac = new AC(), master = ac.createGain();
  master.gain.value = 0; master.connect(ac.destination);
  const buf = ac.createBuffer(1, ac.sampleRate * 3, ac.sampleRate), d = buf.getChannelData(0);
  let b = 0;
  for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; b = (b + .02 * w) / 1.02; d[i] = i % 2 ? w : b * 3.5; }
  const noise = () => { const s = ac.createBufferSource(); s.buffer = buf; s.loop = true; s.start(); return s; };
  const chain = (src, ...nodes) => nodes.reduce((a, n) => (a.connect(n), n), src);
  const filt = (type, f, q = .7) => { const n = ac.createBiquadFilter(); n.type = type; n.frequency.value = f; n.Q.value = q; return n; };
  const gain = v => { const g = ac.createGain(); g.gain.value = v; return g; };
  // Tyres on asphalt, rain on the windscreen, wind in the snow, a low engine
  const road = gain(0); chain(noise(), filt('lowpass', 240), road).connect(master);
  const rain = gain(0); chain(noise(), filt('highpass', 1400), filt('lowpass', 7000), rain).connect(master);
  const wind = gain(0); const windF = filt('bandpass', 420, .8); chain(noise(), windF, wind).connect(master);
  const eng = gain(0); const lp = filt('lowpass', 150, 1.2);
  const o1 = ac.createOscillator(), o2 = ac.createOscillator();
  o1.type = 'sawtooth'; o2.type = 'sawtooth'; o1.frequency.value = 36; o2.frequency.value = 54;
  o1.connect(lp); o2.connect(lp); lp.connect(eng); eng.connect(master); o1.start(); o2.start();
  // Tunnel: a short echo on everything
  const echo = ac.createDelay(); echo.delayTime.value = .11; const fb = gain(0); const wet = gain(0);
  master.connect(echo); echo.connect(fb); fb.connect(echo); echo.connect(wet); wet.connect(ac.destination);
  const at = (param, v) => param.setTargetAtTime(v, ac.currentTime, .25);
  return {
    set(on) { ac.resume(); at(master.gain, on ? .7 : 0); },
    update({ speed, legF, sod }) {
      if (ac.state !== 'running') return;
      const w = n => clamp(1 - Math.abs(legF - n - .5) * 1.6);
      at(road.gain, .1 + speed * .35);
      at(eng.gain, .05 + speed * .09);
      at(o1.frequency, 34 + speed * 38); at(o2.frequency, 51 + speed * 57);
      at(rain.gain, w(1) * .16);
      at(wind.gain, w(3) * .12); at(windF.frequency, 380 + Math.sin(ac.currentTime * .4) * 120);
      const tun = w(2);
      at(fb.gain, tun * .35); at(wet.gain, tun * .5 + sod * .1);
    },
  };
}

/* ---------- ignition: the cluster self-test, then the lights come on ---------- */
let sceneDone;
const sceneReady = new Promise(r => { sceneDone = r; });
const ign = $('#ignition');
function light() {
  if (lit) return;
  lit = true;
  ign?.classList.add('go');
  root.classList.add('lit');
  store.set('np-lit', '1', sessionStorage);
  // Xenon strike: a flicker, then the beam settles.
  beam.onT = 1;
  if (!reduce.matches) { beam.on = .55; setTimeout(() => { beam.on = .15; }, 90); setTimeout(() => { beam.on = .7; }, 170); } else beam.on = 1;
  scene?.ignite();
  setTimeout(() => ign?.remove(), 1300);
  wake();
}
if (!ign || reduce.matches) { ign?.remove(); light(); }
else {
  const num = $('#ign-num'), bar = $('#ign-bar'), t0 = performance.now();
  const again = !!store.get('np-lit', sessionStorage), MIN = again ? 500 : 1900;
  setTimeout(() => ign.classList.add('test'), 120);
  setTimeout(() => ign.classList.add('settle'), again ? 420 : 1000);
  let ready = 0;
  const tasks = [document.fonts ? document.fonts.ready : Promise.resolve(), sceneReady];
  tasks.forEach(t => t.finally(() => { ready += 1 / tasks.length; }));
  (function count() {
    if (lit) return;
    const f = Math.min(ready, (performance.now() - t0) / MIN);
    num.textContent = String(Math.round(f * 100)).padStart(3, '0');
    bar.style.transform = `scaleX(${f.toFixed(3)})`;
    if (f >= 1) { ign.classList.add('ready'); return setTimeout(light, again ? 150 : 650); }
    requestAnimationFrame(count);
  })();
  setTimeout(light, 6000);
  ign.addEventListener('click', light);
  addEventListener('keydown', light, { once: true });
}

/* ---------- 3D: the road at night, lit by two real headlights ---------- */
import('three').then(THREE => {
  try { scene = createScene(THREE); if (lit) scene.ignite(); wake(); }
  catch (e) { console.warn(e); root.classList.add('no-webgl'); }
}).catch(() => root.classList.add('no-webgl')).finally(() => sceneDone());

function createScene(THREE) {
  const canvas = $('#night'), small = innerWidth < 760 || coarse.matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !small, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, small ? 1.25 : 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  const C = h => new THREE.Color(h);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050605, .04);
  const camera = new THREE.PerspectiveCamera(60, 1, .1, 1400);

  // The road: fixed stretches for each leg of the night.
  const ZONES = [[0, 520], [520, 1500], [1500, 2050], [2050, 2750], [2750, 3050]];
  const LEN = ZONES.at(-1)[1] + 120;
  const tunnelA = ZONES[2][0] + 40, tunnelB = ZONES[2][1] - 40;
  const inZone = (z, n) => -z >= ZONES[n][0] && -z < ZONES[n][1];
  const roadX = z => 16 * Math.sin(z * .0042) + 6 * Math.sin(z * .0113 + 1.3);
  const RW = 4.3; // half width

  // A ribbon along the road: offsets from the centre line, from z0 to z1 (both negative, z0 > z1).
  function ribbon(a, b, h0, h1, z0, z1, step = 2, keep = () => true) {
    const pos = [], idx = [];
    let n = 0;
    for (let z = z0; z > z1; z -= step) {
      if (!keep(z)) continue;
      const x0 = roadX(z), x1 = roadX(z - step);
      pos.push(x0 + a, h0, z, x0 + b, h1, z, x1 + a, h0, z - step, x1 + b, h1, z - step);
      idx.push(n, n + 2, n + 1, n + 1, n + 2, n + 3);
      n += 4;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx); g.computeVertexNormals();
    return g;
  }

  const asphalt = new THREE.MeshStandardMaterial({ color: 0x1c1d1c, roughness: .82, metalness: 0 });
  scene.add(new THREE.Mesh(ribbon(-RW, RW, 0, 0, 40, -LEN, 3), asphalt));
  const paint = new THREE.MeshStandardMaterial({ color: 0xe8e4d6, roughness: .45 });
  scene.add(new THREE.Mesh(ribbon(-RW + .2, -RW + .36, .01, .01, 40, -LEN, 3), paint));
  scene.add(new THREE.Mesh(ribbon(RW - .36, RW - .2, .01, .01, 40, -LEN, 3), paint));
  scene.add(new THREE.Mesh(ribbon(-.08, .08, .012, .012, 40, -LEN, 1.5, z => ((-z) % 12) < 4.5), paint));
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x0b0d0a, roughness: 1 });
  scene.add(new THREE.Mesh(ribbon(-120, -RW, -.02, -.02, 40, -LEN, 6), groundMat));
  scene.add(new THREE.Mesh(ribbon(RW, 120, -.02, -.02, 40, -LEN, 6), groundMat));

  // Guard rails on the autobahn: steel that shines in the beam
  const steel = new THREE.MeshStandardMaterial({ color: 0x8e959a, roughness: .32, metalness: .85 });
  const onAutobahn = z => inZone(z, 1);
  scene.add(new THREE.Mesh(ribbon(-RW - 1.1, -RW - 1.1, .45, .8, -ZONES[1][0], -ZONES[1][1], 3, onAutobahn), steel));
  scene.add(new THREE.Mesh(ribbon(RW + 1.1, RW + 1.1, .8, .45, -ZONES[1][0], -ZONES[1][1], 3, onAutobahn), steel));

  // Delineator posts with amber reflectors: they light up only when the beam finds them
  const postZ = [];
  for (let z = -20; z > -LEN; z -= 40) if (!(-z > tunnelA - 10 && -z < tunnelB + 10)) postZ.push(z);
  const postGeo = new THREE.BoxGeometry(.12, 1, .1), postMat = new THREE.MeshStandardMaterial({ color: 0xd9d5c9, roughness: .6 });
  const posts = new THREE.InstancedMesh(postGeo, postMat, postZ.length * 2);
  const refl = new THREE.InstancedMesh(new THREE.PlaneGeometry(.09, .2), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false, fog: false }), postZ.length * 2);
  const reflPos = [];
  const m4 = new THREE.Matrix4();
  postZ.forEach((z, i) => [-1, 1].forEach((s, j) => {
    const x = roadX(z) + s * (RW + 1.6);
    m4.makeTranslation(x, .5, z); posts.setMatrixAt(i * 2 + j, m4);
    m4.makeTranslation(x, .78, z + .06); refl.setMatrixAt(i * 2 + j, m4);
    reflPos.push(new THREE.Vector3(x, .78, z));
  }));
  refl.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(reflPos.length * 3), 3);
  scene.add(posts, refl);

  // Trees: dark firs in Lorraine and on the autobahn verges, white birches in Sweden
  const firGeo = new THREE.ConeGeometry(1.7, 7, 7).translate(0, 3.5, 0);
  const firMat = new THREE.MeshStandardMaterial({ color: 0x122016, roughness: 1 });
  const birchGeo = new THREE.CylinderGeometry(.13, .18, 9, 6).translate(0, 4.5, 0);
  const birchMat = new THREE.MeshStandardMaterial({ color: 0xe4e0d6, roughness: .85 });
  const rnd = (() => { let s = 7; return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; })();
  const firs = [], birches = [];
  for (let z = -10; z > -LEN; z -= small ? 7 : 4.2) {
    if (-z > tunnelA - 30 && -z < tunnelB + 30) continue;
    for (const s of [-1, 1]) {
      if (rnd() < .35) continue;
      const x = roadX(z) + s * (RW + 4 + rnd() ** 1.6 * 38), zz = z + rnd() * 3;
      (inZone(z, 3) || inZone(z, 4) ? birches : firs).push([x, zz, .7 + rnd() * .8]);
    }
  }
  const plant = (geo, mat, list) => {
    const im = new THREE.InstancedMesh(geo, mat, list.length), q = new THREE.Quaternion(), e = new THREE.Euler();
    list.forEach(([x, z, sc], i) => { e.set(0, rnd() * 6, (rnd() - .5) * .06); q.setFromEuler(e); m4.compose(new THREE.Vector3(x, 0, z), q, new THREE.Vector3(sc, sc * (.8 + rnd() * .5), sc)); im.setMatrixAt(i, m4); });
    scene.add(im);
  };
  plant(firGeo, firMat, firs); plant(birchGeo, birchMat, birches);

  // The tunnel: a concrete bore with sodium lamps; one light rides to the next lamp as we pass
  const tunnelPos = [], tunnelIdx = [];
  const SEGS = 14, RAD = 7.2;
  let tn = 0;
  for (let z = -tunnelA; z > -tunnelB; z -= 4) {
    const rows = [z, z - 4];
    for (const zz of rows) for (let s = 0; s <= SEGS; s++) {
      const a = Math.PI * (-.08 + 1.16 * s / SEGS);
      tunnelPos.push(roadX(zz) + Math.cos(a) * RAD, Math.sin(a) * RAD * .82, zz);
    }
    for (let s = 0; s < SEGS; s++) { const a = tn + s, b = tn + SEGS + 1 + s; tunnelIdx.push(a, a + 1, b, a + 1, b + 1, b); }
    tn += (SEGS + 1) * 2;
  }
  const tg = new THREE.BufferGeometry();
  tg.setAttribute('position', new THREE.Float32BufferAttribute(tunnelPos, 3)); tg.setIndex(tunnelIdx); tg.computeVertexNormals();
  scene.add(new THREE.Mesh(tg, new THREE.MeshStandardMaterial({ color: 0x5a5650, roughness: .9, side: THREE.DoubleSide })));
  const lampZ = [];
  for (let z = -tunnelA - 6; z > -tunnelB; z -= 14) lampZ.push(z);
  const lamps = new THREE.InstancedMesh(new THREE.BoxGeometry(.5, .12, 1.6), new THREE.MeshBasicMaterial({ color: 0xffa04a, toneMapped: false }), lampZ.length * 2);
  lampZ.forEach((z, i) => [-1, 1].forEach((s, j) => { m4.makeTranslation(roadX(z) + s * 2.6, RAD * .8, z); lamps.setMatrixAt(i * 2 + j, m4); }));
  scene.add(lamps);
  const sodium = new THREE.PointLight(0xff8a2b, 0, 26, 1.4);
  scene.add(sodium);

  // Sky: black, then Nordic stars, then the dawn over Stockholm
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { uTop: { value: C(0x050605) }, uLow: { value: C(0x080a09) }, uGlow: { value: C(0x000000) } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform vec3 uTop, uLow, uGlow; varying vec3 vP; void main(){ float h = clamp(vP.y * 1.6 + .05, 0., 1.); vec3 c = mix(uLow, uTop, pow(h, .7)); c += uGlow * pow(1. - abs(vP.y), 6.) * smoothstep(-.2, .6, -vP.z); gl_FragColor = vec4(c, 1.); }',
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(1000, 32, 16), skyMat);
  scene.add(sky);
  const starGeo = new THREE.BufferGeometry(), starP = [];
  for (let i = 0; i < 1600; i++) { const a = rnd() * Math.PI * 2, e = .08 + rnd() ** 1.4 * 1.3; starP.push(Math.cos(a) * Math.cos(e) * 900, Math.sin(e) * 900, Math.sin(a) * Math.cos(e) * 900); }
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starP, 3));
  const starMat = new THREE.PointsMaterial({ color: 0xcfd8e8, size: 1.4, sizeAttenuation: false, fog: false, transparent: true, opacity: 0, depthWrite: false });
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);
  // Stockholm on the horizon
  const cityP = [];
  for (let i = 0; i < 1400; i++) { const z = -LEN - 60 - rnd() * 260, x = roadX(-LEN) + (rnd() - .5) * 700; cityP.push(x, rnd() ** 3 * 22, z); }
  const cityGeo = new THREE.BufferGeometry(); cityGeo.setAttribute('position', new THREE.Float32BufferAttribute(cityP, 3));
  const cityMat = new THREE.PointsMaterial({ color: 0xffd48a, size: 2, sizeAttenuation: false, fog: false, transparent: true, opacity: 0 });
  scene.add(new THREE.Points(cityGeo, cityMat));

  // Headlights: two real spotlights aimed by the visitor
  const lights = [-1, 1].map(() => {
    const l = new THREE.SpotLight(0xfff2cf, 0, 160, .5, .55, 1.25);
    scene.add(l, l.target); return l;
  });
  const hemi = new THREE.HemisphereLight(0x223044, 0x050605, .35);
  scene.add(hemi);

  // Weather in the beam: fog motes, rain streaks, snowflakes. Bright only inside the headlight cone.
  const NP = small ? 1600 : 4200;
  const pg = new THREE.BufferGeometry(), pp = new Float32Array(NP * 3), ps = new Float32Array(NP);
  for (let i = 0; i < NP; i++) { pp[i * 3] = rnd(); pp[i * 3 + 1] = rnd(); pp[i * 3 + 2] = rnd(); ps[i] = rnd(); }
  pg.setAttribute('position', new THREE.BufferAttribute(pp, 3)); pg.setAttribute('seed', new THREE.BufferAttribute(ps, 1));
  const weather = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    uniforms: { uTime: { value: 0 }, uCam: { value: new THREE.Vector3() }, uL: { value: new THREE.Vector3() }, uDir: { value: new THREE.Vector3(0, 0, -1) }, uKind: { value: 0 }, uAmount: { value: 0 }, uPR: { value: renderer.getPixelRatio() }, uTint: { value: C(0xfff2cf) } },
    vertexShader: `
      uniform float uTime, uKind, uAmount, uPR; uniform vec3 uCam, uL, uDir;
      attribute float seed; varying float vA; varying float vK;
      void main(){
        vec3 box = vec3(30., 14., 60.);
        vec3 p = position;
        float fall = uKind < .5 ? .04 : (uKind < 1.5 ? 13. : 1.4);
        p.y = fract(p.y - uTime * fall / box.y - seed);
        if (uKind > 1.5) p.x = fract(p.x + sin(uTime * .8 + seed * 40.) * .004);
        if (uKind < .5) p.x = fract(p.x + uTime * .006);
        vec3 c = uCam + vec3(0., 5., -26.);
        vec3 w = p * box;
        vec3 rel = mod(w - c + box * .5, box) - box * .5;
        vec3 pos = c + rel;
        vec3 v = pos - uL; float d = max(length(v), .001);
        float cone = smoothstep(.86, .97, dot(v / d, uDir));
        vA = uAmount * cone * (1. / (1. + d * d * .0035));
        vK = uKind;
        vec4 mv = modelViewMatrix * vec4(pos, 1.);
        float sz = uKind < .5 ? 9. : (uKind < 1.5 ? 3.2 : 2.6);
        gl_PointSize = sz * uPR * 18. / max(-mv.z, .5);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform vec3 uTint; varying float vA; varying float vK;
      void main(){
        vec2 q = gl_PointCoord - .5; float m;
        if (vK > .5 && vK < 1.5) m = smoothstep(.09, .0, abs(q.x)) * smoothstep(.5, .1, abs(q.y));
        else if (vK < .5) m = smoothstep(.5, .0, length(q)) * .22;
        else m = smoothstep(.5, .12, length(q));
        gl_FragColor = vec4(uTint * vA * m, 1.);
      }`,
  });
  const motes = new THREE.Points(pg, weather);
  motes.frustumCulled = false;
  scene.add(motes);

  // The beam itself, seen in the fog: two soft additive cones
  const coneGeo = new THREE.ConeGeometry(6.5, 34, 32, 1, true).translate(0, -17, 0).rotateX(-Math.PI / 2);
  const coneMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
    uniforms: { uStrength: { value: 0 } },
    vertexShader: 'varying float vL; varying vec3 vN; varying vec3 vV; void main(){ vL = -position.z / 34.; vec4 mv = modelViewMatrix * vec4(position, 1.); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform float uStrength; varying float vL; varying vec3 vN; varying vec3 vV; void main(){ float edge = pow(abs(dot(vN, vV)), 1.6); float a = uStrength * (1. - vL) * (1. - vL) * edge * .09; gl_FragColor = vec4(vec3(1., .95, .82) * a, 1.); }',
  });
  const cones = [0, 1].map(() => { const m = new THREE.Mesh(coneGeo, coneMat); m.frustumCulled = false; scene.add(m); return m; });

  // Atmosphere per leg: fog, air colour, weather, wetness, ground, beam haze
  const LEG = [
    { fog: 0x0b0e0c, dens: .036, kind: 0, amt: 1.2, cone: 1, wet: .15, ground: 0x0c0f0b, hemi: .38, top: 0x040505, low: 0x0e1210 },
    { fog: 0x06080a, dens: .022, kind: 1, amt: 1.1, cone: .45, wet: 1, ground: 0x0a0c0b, hemi: .28, top: 0x030406, low: 0x0a0d12 },
    { fog: 0x120a05, dens: .03, kind: 0, amt: .35, cone: .35, wet: .35, ground: 0x0a0c0b, hemi: .2, top: 0x050302, low: 0x120a05 },
    { fog: 0x0b1018, dens: .028, kind: 2, amt: 1.1, cone: .6, wet: 0, ground: 0x7d8792, hemi: .42, top: 0x03050b, low: 0x0e1522 },
    { fog: 0x6f86a8, dens: .006, kind: 2, amt: 0, cone: 0, wet: .2, ground: 0x5d6570, hemi: 1.4, top: 0x16284a, low: 0xe9c9a6 },
  ];
  const col = new THREE.Color(), col2 = new THREE.Color();
  const mixLeg = (key, legF) => {
    const n = Math.min(3, Math.floor(legF)), t = smooth(.72, 1, legF - n);
    return [LEG[n][key], LEG[n + 1][key], t];
  };
  const mixColor = (key, legF, out) => { const [a, b, t] = mixLeg(key, legF); return out.set(a).lerp(col2.set(b), t); };
  const mixNum = (key, legF) => { const [a, b, t] = mixLeg(key, legF); return lerp(a, b, t); };

  // Drive: scroll → distance along the zones, eased like a car
  let state = { p: 0, legF: 0, dawn: 0, on: 0, aimX: 0, aimY: .1, sod: 0 };
  let dist = 0, aimX = 0, aimY = .1, ignited = 0, t0 = performance.now(), moving = 0;
  const distFor = legF => { const n = Math.min(4, Math.floor(legF)), f = legF - n; const [a, b] = ZONES[n]; return lerp(a, b, n === 4 ? clamp(f) : f); };
  const v3 = new THREE.Vector3(), fwd = new THREE.Vector3(), right = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), aimDir = new THREE.Vector3();

  function render(now) {
    const target = distFor(state.legF);
    const ease = reduce.matches ? 1 : .06;
    const dd = (target - dist) * ease;
    dist += dd; moving = Math.abs(target - dist) > .05;
    aimX += (state.aimX - aimX) * .1; aimY += (state.aimY - aimY) * .1;
    const z = -dist, x = roadX(z) + 1.9;
    const bob = reduce.matches ? 0 : Math.sin(now * .004) * .012 * clamp(Math.abs(dd) * 4);
    camera.position.set(x, 1.25 + bob, z);
    const look = z - 30;
    camera.lookAt(roadX(look) + 1.9 + aimX * 1.2, 1.1 - aimY * .6, look);
    camera.rotateZ((roadX(z - 8) - roadX(z + 8)) / 16 * .25);

    // Headlight positions and aim (the car points down the road, the visitor steers the beams)
    camera.getWorldDirection(fwd); right.crossVectors(fwd, up).normalize();
    aimDir.copy(fwd).applyAxisAngle(up, -aimX * .38);
    aimDir.y += -.09 - aimY * .12; aimDir.normalize();
    const on = state.on * ignited;
    lights.forEach((l, i) => {
      l.position.copy(camera.position).addScaledVector(right, i ? .75 : -.75).addScaledVector(up, -.55).addScaledVector(fwd, 1.2);
      l.target.position.copy(l.position).addScaledVector(aimDir, 30);
      l.intensity = 110 * on;
      cones[i].position.copy(l.position);
      cones[i].lookAt(v3.copy(l.position).add(aimDir));
    });

    // Atmosphere
    const legF = state.legF;
    mixColor('fog', legF, scene.fog.color);
    scene.fog.density = mixNum('dens', legF) * (ignited < 1 ? lerp(3, 1, ignited) : 1);
    renderer.setClearColor(scene.fog.color);
    mixColor('top', legF, skyMat.uniforms.uTop.value);
    mixColor('low', legF, skyMat.uniforms.uLow.value);
    skyMat.uniforms.uGlow.value.set(0xff9a5a).multiplyScalar(state.dawn * .55);
    sky.position.copy(camera.position); stars.position.copy(camera.position);
    starMat.opacity = smooth(2.6, 3.3, legF) * (1 - state.dawn * .9);
    cityMat.opacity = smooth(3.5, 4.2, legF) * (1 - state.dawn * .6);
    mixColor('ground', legF, groundMat.color);
    hemi.intensity = mixNum('hemi', legF);
    hemi.color.set(0x223044).lerp(col.set(0xffb070), state.dawn * .6);
    const wet = mixNum('wet', legF);
    asphalt.roughness = lerp(.85, .22, wet); asphalt.metalness = lerp(0, .35, wet);
    asphalt.color.set(0x1c1d1c).lerp(col.set(0x0f1011), wet);
    coneMat.uniforms.uStrength.value = mixNum('cone', legF) * on;

    // Weather: crossfade through a clear moment between legs
    const n = Math.round(clamp(legF - .15, 0, 4));
    const fade = smooth(.5, .28, Math.abs(legF - .15 - n));
    weather.uniforms.uKind.value = LEG[n].kind;
    weather.uniforms.uAmount.value = LEG[n].amt * fade * on;
    weather.uniforms.uTime.value = reduce.matches ? 0 : (now - t0) / 1000;
    weather.uniforms.uCam.value.copy(camera.position);
    weather.uniforms.uL.value.copy(camera.position).addScaledVector(up, -.5);
    weather.uniforms.uDir.value.copy(aimDir);

    // Tunnel: the sodium light jumps to the next lamp ahead
    if (-z > tunnelA - 20 && -z < tunnelB + 10) {
      let lz = lampZ.find(q => q < z - 2) ?? lampZ.at(-1);
      sodium.position.set(roadX(lz), RAD * .7, lz);
      sodium.intensity = 55;
      hemi.color.lerp(col.set(0xff8a2b), .7); hemi.intensity += .25;
    } else sodium.intensity = 0;

    // Retroreflectors: bright amber when the beam reaches them
    const cosIn = Math.cos(.42), cosOut = Math.cos(.62);
    for (let i = 0; i < reflPos.length; i++) {
      const rp = reflPos[i];
      v3.subVectors(rp, camera.position);
      const d = v3.length();
      let c = 0;
      if (d < 260 && v3.dot(fwd) > 0) {
        v3.divideScalar(d);
        const inBeam = smooth(cosOut, cosIn, v3.dot(aimDir));
        c = (.04 + inBeam * 5 / (1 + d * .05)) * (.2 + .8 * on);
      }
      refl.instanceColor.setXYZ(i, c * 1, c * .62, c * .08);
    }
    refl.instanceColor.needsUpdate = true;

    renderer.render(scene, camera);
  }

  function resize() {
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight;
    camera.fov = innerWidth < innerHeight ? 72 : 60;
    camera.updateProjectionMatrix();
    weather.uniforms.uPR.value = renderer.getPixelRatio();
  }
  resize();

  let igniteAt = -1;
  return {
    resize,
    ignite() { igniteAt = performance.now(); },
    update(s) {
      state = s;
      const now = performance.now();
      if (igniteAt >= 0) { ignited = reduce.matches ? 1 : clamp((now - igniteAt) / 2200); if (ignited >= 1) igniteAt = -1; }
      render(now);
    },
    animating: () => !reduce.matches && (moving || igniteAt >= 0 || state.on > .01),
  };
}
