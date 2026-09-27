// Nolann Petri — shared by every reel: subtitles (language), the autofocus cursor, lazy video, the projector.
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const fine = matchMedia('(pointer: fine)').matches;
const root = document.documentElement;
root.classList.add('js');

const store = {
  get: k => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
};

// Inside another frame (a preview), embedding other sites is blocked: live links open a new tab instead.
export const embedded = (() => { try { return self !== window.top; } catch { return true; } })();
export const canEmbed = () => !embedded && innerWidth > 900;

/* ---------- subtitles: the language track ---------- */
let lang = 'en';
const listeners = [];
export const getLang = () => lang;
export const t = (en, fr) => (lang === 'fr' ? fr : en);
export const onLang = fn => { listeners.push(fn); };
const texts = $$('[data-fr]');
texts.forEach(el => { el.dataset.en = el.innerHTML; });
const labels = $$('[data-label-fr]');
labels.forEach(el => { el.dataset.labelEn = el.getAttribute(el.tagName === 'IMG' ? 'alt' : 'aria-label') || ''; });

export function setLang(l) {
  lang = l;
  texts.forEach(el => { el.innerHTML = el.dataset[l]; });
  labels.forEach(el => el.setAttribute(el.tagName === 'IMG' ? 'alt' : 'aria-label', l === 'fr' ? el.dataset.labelFr : el.dataset.labelEn));
  root.lang = l;
  const st = $('#st');
  if (st) st.setAttribute('aria-label', l === 'en' ? 'Sous-titres : passer en français' : 'Subtitles: switch to English');
  store.set('np-lang', l);
  listeners.forEach(fn => fn(l));
}
$('#st')?.addEventListener('click', () => setLang(lang === 'en' ? 'fr' : 'en'));
const saved = store.get('np-lang');
if (saved === 'fr' || (!saved && /^fr\b/i.test(navigator.language || ''))) queueMicrotask(() => setLang('fr'));
else queueMicrotask(() => setLang('en'));

/* ---------- video: load late, play only in view ---------- */
export function load(v) {
  if (v.dataset.src && !v.getAttribute('src')) { v.src = v.dataset.src; v.load(); }
  return v;
}
export function play(v) { load(v); const p = v.play(); if (p) p.catch(() => {}); }
const inview = new IntersectionObserver(es => es.forEach(e => {
  const v = e.target;
  if (e.isIntersecting && !(reduce && !v.dataset.always)) play(v); else v.pause();
}), { rootMargin: '120px 0px' });
$$('.cde video, .cde-vert video').forEach(v => inview.observe(v));

// The programme rows play their preview under the pointer (or in view on touch screens)
$$('.prog-row').forEach(row => {
  const v = $('video', row);
  if (!v) return;
  if (fine) {
    row.addEventListener('pointerenter', () => play(v));
    row.addEventListener('pointerleave', () => v.pause());
    row.addEventListener('focus', () => play(v));
    row.addEventListener('blur', () => v.pause());
  } else if (!reduce) inview.observe(v);
});

/* ---------- copy an address ---------- */
$$('[data-copy]').forEach(b => b.addEventListener('click', async () => {
  const text = b.dataset.copy;
  try { await navigator.clipboard.writeText(text); b.textContent = t('Copied', 'Copiée'); }
  catch { b.textContent = text; }
  setTimeout(() => { b.innerHTML = b.dataset[lang] || b.dataset.en; }, 1800);
}));

// End credits: each line rolls up a beat after the one before
$$('.roll-in > *').forEach((el, i) => el.style.setProperty('--i', i));

/* ---------- the autofocus cursor: brackets that lock onto what you can use ---------- */
if (fine) {
  root.classList.add('af');
  const box = document.createElement('div');
  box.className = 'af-box';
  box.setAttribute('aria-hidden', 'true');
  box.innerHTML = '<i></i><i></i><i></i><i></i><b></b><em></em>';
  document.body.append(box);
  const label = $('em', box);
  const S = 22;
  let px = -100, py = -100, x = -100, y = -100, w = S, h = S, target = null, raf = 0;
  const pick = el => el?.closest('a[href], button, [role="slider"], input, .fr-hit, [data-af]');
  const word = el => {
    if (el.matches('.fr-hit, .panel button')) return t('VIEW', 'VOIR');
    if (el.matches('a[href^="mailto:"]')) return t('WRITE', 'ÉCRIRE');
    if (el.matches('a[target="_blank"]')) return t('OPEN', 'OUVRIR');
    if (el.matches('a[href$=".html"], a[href^="#"]')) return t('CUT', 'COUPE');
    if (el.matches('.clip, .film')) return t('LOAD', 'CHARGER');
    return '';
  };
  const frame = () => {
    let tx = px - S / 2, ty = py - S / 2, tw = S, th = S;
    if (target && target.isConnected) {
      const r = target.getBoundingClientRect();
      const pad = r.width > 300 || r.height > 200 ? 2 : 6;
      tx = r.left - pad; ty = r.top - pad; tw = r.width + pad * 2; th = r.height + pad * 2;
    }
    const k = reduce ? 1 : 0.28;
    x = lerp(x, tx, k); y = lerp(y, ty, k); w = lerp(w, tw, k); h = lerp(h, th, k);
    box.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    box.style.width = `${w}px`; box.style.height = `${h}px`;
    const moving = Math.abs(x - tx) + Math.abs(y - ty) + Math.abs(w - tw) + Math.abs(h - th) > 0.3;
    raf = moving || target ? requestAnimationFrame(frame) : 0;
  };
  const wake = () => { if (!raf) raf = requestAnimationFrame(frame); };
  addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    px = e.clientX; py = e.clientY;
    if (!box.classList.contains('on')) { x = px - S / 2; y = py - S / 2; box.classList.add('on'); }
    const el = pick(e.target);
    if (el !== target) {
      target = el;
      box.classList.toggle('lock', !!el);
      label.textContent = el ? word(el) : '';
    }
    wake();
  }, { passive: true });
  document.addEventListener('pointerleave', () => box.classList.remove('on'));
  addEventListener('scroll', wake, { passive: true });
  addEventListener('pointerdown', () => box.animate([{ scale: 1 }, { scale: 0.86 }, { scale: 1 }], { duration: 260, easing: 'ease-out' }));
}

/* ---------- the projector: a lightbox for stills and boards ---------- */
export function projector(items, { count = true } = {}) {
  const dlg = $('#lightbox');
  if (!dlg || !items.length) return;
  const img = $('#lb-img'), cap = $('#lb-cap'), n = $('#lb-n');
  let i = 0;
  const show = (k, dir = 0) => {
    i = (k + items.length) % items.length;
    const el = items[i], im = $('img', el), src = el.closest('[data-cap]') || el;
    img.src = im.dataset.full || im.currentSrc || im.src;
    img.alt = im.alt;
    cap.textContent = (lang === 'fr' && src.dataset.capFr) || src.dataset.cap || im.alt;
    if (n) n.textContent = count ? `${String(i + 1).padStart(2, '0')} / ${String(items.length).padStart(2, '0')}` : '';
    if (dir) { dlg.style.setProperty('--dir', `${dir * 28}px`); dlg.classList.remove('flip'); void dlg.offsetWidth; dlg.classList.add('flip'); }
  };
  items.forEach((el, k) => el.addEventListener('click', () => { show(k); dlg.showModal(); }));
  $('#lb-prev').addEventListener('click', () => show(i - 1, -1));
  $('#lb-next').addEventListener('click', () => show(i + 1, 1));
  $('#lb-close').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') show(i + 1, 1);
    if (e.key === 'ArrowLeft') show(i - 1, -1);
  });
  onLang(() => { if (dlg.open) show(i); });
}
