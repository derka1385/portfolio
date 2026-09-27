# Nolann Petri — Le Générique

Personal portfolio, told as a film in four reels. Static site, no build step.

| Page | File | What it is |
|---|---|---|
| Home | `index.html` + `home.js` | **Lignes**, a textless scroll experience in raw WebGL2. The name is traced on an exact grid; a front of light raises it into walls, grows a city, and the camera slaloms through the letters, climbs and orbits, then follows the returning front home as everything folds flat. The pointer lifts the grid. |
| Code | `code.html` + `code.js` | ORVECT on its own monitor, then every project as a clip on an edit timeline: drag the playhead to scrub the real recording; the inspector shows Context / What I built / Goal / Try it live. |
| Photo | `photo.html` + `photo.js` | Col de l'Est, then a pinned film strip of 52 photos in 7 chapters (from `~/Pictures/portfolio`) that turns in 3D as it passes; click a frame to project it. |
| Film | `film.html` + `film.js` | Screening room with one film for now (macOS Tahoe): the masking closes to its format; the projector beam and floor spill take the frame's colour. |
| Design | `design.html` + `design.js` | Identity work laid out as storyboard sheets. |
| Contact | `contact.html` | End credits. |

Shared: `style.css`, `site.js` (EN/FR subtitle track, autofocus cursor, lazy video, lightbox). Pages cut through black with cross-document View Transitions.

The previous night-drive build ("Plein phares") lives on as its own site in `~/Coding/plein-phares`.

## Run locally

```sh
python3 -m http.server 8080   # then open http://localhost:8080
```

## Publish

The repository is `github.com/derka1385/portfolio`. To put it online, turn on GitHub Pages (Settings → Pages → Deploy from a branch → `main`, `/ (root)`); it then serves at `https://derka1385.github.io/portfolio/`. Once the address is final, make the `og:image` tags absolute URLs so link previews show the picture.

## Updating content

- **Languages:** English by default, French when the browser is in French or after the toggle. Each translated element carries its French in `data-fr`; attributes use `data-label-fr`.
- **Home** (`home.js`): the letters are defined in `LETTERS` (strokes on a 4 × 6 grid), the camera's ground path in `PATH` (it must pass through the gaps between letters; keep at least half a unit from any wall), the moments of the scroll in `M`, and the towers are seeded. The page shows no text past the traced name.
- **Projects** (`code.html`): one `<article class="proj">` per clip with `data-track` (`company`, `client`, `hack`, `tools`), `data-year`, `data-url`, `data-video`, `data-poster`. The timeline builds itself from these.
- **Photos** (`photo.html`): each series is a `.slate` followed by `<figure class="fr">` frames. Export ~1800 px WebP to `img/p/` and ~760 px to `img/p/sm/`.
- **Films** (`film.html` + `film.js`): the film on screen is set in the `<video>` and `FILM` in `film.js` (`format` is `h` for 16:9 or `v` for 9:16). Keep files under 15 MB (H.264, `+faststart`).
- **Provenance:** every shipped raster carries its origin in its metadata (`impeccable embed-prompt --scan img`).
