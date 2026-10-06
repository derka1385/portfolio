// Nolann Petri — Code. The rushes: the project in the middle of the screen plays its real recording and runs
// its timecode; the others wait on their frame. On a wide screen "Try it live" puts the site in the same monitor.
import { $, $$, reduce, canEmbed, load, play, t, onLang } from './site.js';

const rushes = $$('.rush');
const pad = n => String(n).padStart(2, '0');
const tcOf = s => { const f = Math.floor(s * 25); return `00:${pad(Math.floor(f / 1500) % 60)}:${pad(Math.floor(f / 25) % 60)}:${pad(f % 25)}`; };

let onAir = null;
function air(r) {
  if (r === onAir) return;
  if (onAir) { onAir.classList.remove('on'); if (!onAir._live) onAir._v.pause(); }
  onAir = r;
  r.classList.add('on');
  if (r._live) return;
  if (reduce) load(r._v); else play(r._v);
}

/* ---------- the live site, inside the monitor ---------- */
function live(r) {
  const screen = $('.mon-screen', r);
  const f = document.createElement('iframe');
  f.title = $('h3', r).textContent;
  f.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals');
  f.allow = 'fullscreen';
  f.addEventListener('load', () => r.classList.remove('loading'));
  const note = document.createElement('p');
  note.className = 'mon-loading';
  note.textContent = t('Loading the live site…', 'Chargement du site…');
  screen.append(f, note);
  f.src = r.dataset.url;
  r._live = true;
  r._v.pause();
  r.classList.add('is-live', 'loading');
  $('.rush-mon', r).removeAttribute('aria-hidden');      // the site is something to use now, not a picture
  r._tc.textContent = t('LIVE', 'EN DIRECT');
  $('.btn.live span', r).textContent = t('Open in a new tab', 'Ouvrir dans un onglet');
  const back = document.createElement('button');
  back.type = 'button'; back.className = 'btn back';
  back.textContent = t('Back to the recording', 'Revenir à l’enregistrement');
  back.addEventListener('click', () => unlive(r));
  $('.actions', r).append(back);
  back.focus();
}
function unlive(r) {
  $$('iframe, .mon-loading', r).forEach(el => el.remove());
  $('.back', r)?.remove();
  r._live = false;
  r.classList.remove('is-live', 'loading');
  if (!reduce) $('.rush-mon', r).setAttribute('aria-hidden', 'true');
  r._tc.textContent = tcOf(r._v.currentTime);
  $('.btn.live span', r).textContent = t('Try it live', 'Tester en direct');
  $('.btn.live', r).focus();
  if (r === onAir && !reduce) play(r._v);
}

rushes.forEach(r => {
  r._v = $('video', r);
  r._tc = $('.tc', r);
  r._v.addEventListener('timeupdate', () => { if (!r._live) r._tc.textContent = tcOf(r._v.currentTime); });
  if (reduce) {                           // nothing starts on its own; the recording is one press away
    r._v.controls = true;
    r._v.setAttribute('aria-label', $('h3', r).textContent);
    $('.rush-mon', r).removeAttribute('aria-hidden');
  }
  $('.btn.live', r).addEventListener('click', e => {
    if (!canEmbed() || r._live || r.dataset.url.includes('github.com')) return;   // phones, previews, GitHub (no framing) and a second press open a new tab
    e.preventDefault();
    live(r);
  });
});

// On air: whichever rush crosses the middle band of the screen
const band = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) air(e.target); }), { rootMargin: '-42% 0px -48% 0px' });
// Nothing plays off screen
const seen = new IntersectionObserver(es => es.forEach(e => {
  const r = e.target;
  if (r !== onAir || r._live || reduce) return;
  if (e.isIntersecting) play(r._v); else r._v.pause();
}));
rushes.forEach(r => { band.observe(r); seen.observe(r); });

// Small monitors: each title's arrow stays on the line of its last word, in either language
const arrow = $('.more-item .ico').cloneNode(true);
const glue = () => $$('.more-item h3').forEach(h => {
  const s = $('span', h);
  [...h.childNodes].forEach(n => { if (n !== s) n.remove(); });
  const text = s.textContent.trim(), cut = text.lastIndexOf(' ') + 1;
  const nw = document.createElement('span');
  nw.className = 'nw';
  nw.append(text.slice(cut), arrow.cloneNode(true));
  s.textContent = text.slice(0, cut);
  s.append(nw);
});
glue();
onLang(glue);

$('#rushes').classList.add('js-rushes');
air(rushes[0]);
onLang(() => rushes.forEach(r => {
  if (!r._live) return;
  r._tc.textContent = t('LIVE', 'EN DIRECT');
  $('.btn.live span', r).textContent = t('Open in a new tab', 'Ouvrir dans un onglet');
  $('.back', r).textContent = t('Back to the recording', 'Revenir à l’enregistrement');
  const n = $('.mon-loading', r); if (n) n.textContent = t('Loading the live site…', 'Chargement du site…');
}));
