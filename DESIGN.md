---
name: Nolann Petri — Le Générique
description: A portfolio played as a film in four reels, opened by a textless scroll experience in lines of light.
colors:
  black: "#000"
  ink: "#0b0b0c"
  ink-2: "#151517"
  ink-3: "#1f1f22"
  line: "rgb(255 255 255 / .13)"
  line-2: "rgb(255 255 255 / .24)"
  white: "#ededeb"
  dim: "#9c9c97"
  faint: "#7b7b74"
  sub: "#f3d34a"
  flare: "#6cc3ff"
  paper: "#e6e7e5"
  paper-ink: "#121213"
  paper-dim: "#56575a"
  orvect: "#ff5c28"
  track-client: "#45b8a4"
  track-hack: "#a38cff"
  track-tools: "#6e9fdc"
typography:
  display-name:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(22px, 3.1vw, 50px)"
    fontWeight: 300
    lineHeight: 1
    letterSpacing: "0.52em"
    fontVariation: "'wdth' 125"
  headline:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(26px, 3.4vw, 54px)"
    fontWeight: 300
    lineHeight: 1.1
    letterSpacing: "0.38em"
    fontVariation: "'wdth' 125"
  reel-title:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(30px, 5.2vw, 84px)"
    fontWeight: 250
    lineHeight: 1
    letterSpacing: "0.3em"
    fontVariation: "'wdth' 125"
  intertitle:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(20px, 2.35vw, 38px)"
    fontWeight: 300
    lineHeight: 1.34
    fontVariation: "'wdth' 108"
  title:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(20px, 1.7vw, 26px)"
    fontWeight: 400
    lineHeight: 1.15
    fontVariation: "'wdth' 112"
  subtitle:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(14px, 1.15vw, 18px)"
    fontWeight: 500
    lineHeight: 1.45
  body:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.6
  section-title:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    letterSpacing: "0.34em"
    fontVariation: "'wdth' 125"
  role:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "0.22em"
    fontVariation: "'wdth' 78"
  control:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 500
    letterSpacing: "0.16em"
    fontVariation: "'wdth' 112"
  timecode:
    fontFamily: "Azeret Mono, ui-monospace, SF Mono, Menlo, monospace"
    fontSize: "11px"
    fontWeight: 400
    letterSpacing: "0.04em"
    fontFeature: "'tnum' 1"
rounded:
  none: "0"
  hairline: "2px"
spacing:
  gutter: "clamp(16px, 4.2vw, 64px)"
  bar: "52px"
  bar-compact: "48px"
  credit-gutter: "28px"
  row: "22px"
components:
  button:
    backgroundColor: "transparent"
    textColor: "{colors.white}"
    typography: "{typography.control}"
    rounded: "{rounded.hairline}"
    padding: "0 16px"
    height: "42px"
  button-hover:
    backgroundColor: "{colors.white}"
    textColor: "{colors.black}"
  button-solid:
    backgroundColor: "{colors.sub}"
    textColor: "{colors.black}"
    typography: "{typography.control}"
    rounded: "{rounded.hairline}"
    padding: "0 16px"
    height: "42px"
  button-solid-hover:
    backgroundColor: "{colors.white}"
    textColor: "{colors.black}"
  transport-button:
    backgroundColor: "transparent"
    textColor: "{colors.white}"
    rounded: "{rounded.hairline}"
    size: "40px"
  subtitle-track:
    backgroundColor: "transparent"
    textColor: "{colors.faint}"
    typography: "{typography.timecode}"
    rounded: "{rounded.hairline}"
    padding: "0 9px"
    height: "28px"
  chrome-bar:
    backgroundColor: "{colors.black}"
    textColor: "{colors.dim}"
    typography: "{typography.control}"
    padding: "0 {spacing.gutter}"
    height: "{spacing.bar}"
  timeline-clip:
    backgroundColor: "{colors.ink-3}"
    textColor: "{colors.white}"
    rounded: "{rounded.hairline}"
  storyboard-sheet:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.paper-ink}"
    rounded: "{rounded.none}"
    padding: "clamp(20px, 3vw, 44px)"
---

# Design System: Nolann Petri — Le Générique

## Overview

**Creative North Star: "Le Générique"**

The portfolio is a film by Nolann Petri. Every inner page is a reel and every fact is a credit; the interface lives in the projection-black bar at the top. The page is black before it is anything else. The home is the one place without words: "Lignes", an exact grid of hairlines on which his name is traced like a plotter, then a front of light that raises the name into walls and grows a city of lines as you scroll, and folds it all flat on the way back. It exists to show what he can code in design, so it carries no text past the name, no links and no summary.

Density is low and deliberate: fewer things shown bigger, big black margins, hairline rules instead of boxes. The one exception is the Code reel, which is allowed the dense, gridded look of an editing suite (viewer, inspector, timeline with coloured clip tracks), and the Design reel, which swaps the black for pale storyboard paper. Light is treated as a physical thing: the anamorphic streak, the flare that follows the pointer, the projector beam in the screening room and the colour spill under the screen all come from a source in the scene, never from decorative glows.

Motion is film grammar: cuts, fades to black, iris-like letterbox openings, masking that travels to the picture's format, a credit roll. Nothing slides up into place like a card.

**Key Characteristics:**
- Projection black ground with 2.39:1 frames and a fixed black top bar (52px, 48px under 860px).
- Credit white text; one subtitle yellow reserved for subtitles, timecode and the single action per view.
- Archivo variable: expanded (wdth 125) light capitals for titles, condensed (wdth 78) small capitals for roles.
- Azeret Mono only for machine readouts: timecode, coordinates, frame numbers, URLs, tech stacks.
- Hairlines and 2px corners; no cards, no shadows on the dark ground.
- A live grain layer (5.5% overlay) over every page, removed under reduced motion.

## Colors

A projection-room palette: near-pure black and warm credit white, one subtitle yellow, and blue that exists only as light.

### Primary
- **Subtitle Yellow** (sub): the colour of burned-in subtitles. Used for the running timecode (viewer bar, film transport, photo reel readout), the timeline playhead, the solid button that is the view's one action, the chrome Contact link, the focus ring and text selection, the second word of the name (PETRI) where the name is set as a title (contact) or lies flat on the home grid, the front of light on the home, and the progress fill of the film scrubber.

### Secondary
- **Anamorphic Blue** (flare): light only. It is the horizontal streak of the front's source point on the home; it is never a text, border or fill colour for interface.

### Tertiary
- **Clip track colours** (orvect for Company, track-client teal, track-hack violet, track-tools steel blue): used only on the Code edit timeline as the 2px top edge of each clip, the track-label swatch and the inspector meta swatch. They label a category; they never tint text or backgrounds.
- **ORVECT Signal Orange** (orvect): belongs to ORVECT's own brand. It appears inside ORVECT's case study, logo and storyboard sheet, and as the Company track colour; nowhere else.

### Neutral
- **Projection Black** (black): page ground, the chrome bar, masking panels, screen surround.
- **Ink** (ink, ink-2, ink-3): the three greys of equipment: media placeholders and suite panels (ink), monitor bars (ink-2), idle clips (ink-3). Frames sit on #030303 inside the black.
- **Credit White** (white): all primary text; the hover fill of hairline buttons.
- **Dim** (dim): roles, leads, secondary copy, inactive nav.
- **Faint** (faint): slates, footer line, frame-edge numbers; the quietest readable text.
- **Hairlines** (line, line-2): 13% white for rules and panel borders, 24% for button borders and link underlines.
- **Storyboard Paper** (paper, paper-ink, paper-dim): the Design reel's sheets; paper-ink replaces white and black on paper, paper-dim replaces dim. Sheet rules use #c5c6c4.

### Named Rules
**The Subtitle Rule.** Yellow is for what a projectionist would burn into the picture: subtitles, timecode and the one thing to do next. If an element is none of those, it is white or dim.

**The Light-Only Rule.** Anamorphic blue is emitted, never painted. Every glow has a source in the scene or at the pointer.

**The Guest Brand Rule.** ORVECT keeps Space Grotesk and its orange inside its own case study, logo and board; the host world does not borrow them.

## Typography

**Display Font:** Archivo (variable width 62–125, weight 100–900), fallback ui-sans-serif, system-ui
**Body Font:** Archivo at normal width
**Label/Mono Font:** Azeret Mono (300–600), fallback ui-monospace, SF Mono, Menlo

**Character:** One family stretched between its extremes does all the talking: wide, light, far-tracked capitals read as a title card, narrow medium capitals read as the role line of a credit. The mono is a machine voice and speaks only in numbers and addresses.

### Hierarchy
- **Display name** (300, clamp(22px, 3.1vw, 50px), line-height 1, tracking .52em, expanded caps): NOLANN PETRI in the opening frame and the end roll (roll variant tracks .4em up to 58px). NOLANN white, PETRI yellow.
- **Headline** (300, clamp(26px, 3.4vw, 54px), 1.1, tracking .38em, expanded caps): the title card that opens every reel. Chapter titles inside a reel use the same voice at .14–.2em tracking (board heads, the Col de l'Est heading, photo slates).
- **Reel title** (250, clamp(30px, 5.2vw, 84px), 1, tracking .3em, expanded caps): "Next reel" links and programme rows (programme at up to 46px, .26em); tracking opens further on hover.
- **Title** (400, clamp(20px, 1.7vw, 26px), 1.15, width 112): project names in the inspector and film list (15–20px).
- **Subtitle** (500, clamp(14px, 1.15vw, 18px), 1.45, yellow, max 62ch, centred with a tight dark text-shadow).
- **Body** (400, 15px, 1.6): leads at 15.5px in dim, max 52–62ch.
- **Section title** (500, 12px, tracking .34em, expanded caps, white): the heading of a section (The edit, About the film). It is the heading itself, not a label above one.
- **Role** (500, 11px, 1.3, tracking .22em, width 78, caps, dim): credit roles, fact labels, "Next reel".
- **Control** (500, 11px, tracking .16–.2em, width 112, caps): nav reels, buttons, Contact.
- **Timecode** (Azeret Mono 400, 11px, tracking .04em, tabular figures, dim or yellow).

### Named Rules
**The Stretch Rule.** Titles are expanded caps, light, tracked .14–.52em with the trailing tracking compensated; roles are condensed caps at .16–.22em. Never set a title condensed or a role expanded.

**The Machine Voice Rule.** Azeret Mono is only for timecode, coordinates, frame numbers, URLs and tech stacks. Names, roles and prose are Archivo.

**The Credit Order Rule.** In a credit the name leads; its role follows on the same line or wraps below it, never above.

## Layout

The page is a projection room. A fixed black top bar (`bar`, 52px; 48px under 860px) holds the name, the four reels, the subtitle track and Contact in a three-column grid. Content sits in a centred container capped at 1560px with a fluid side gutter (`gutter`). Every page opens with a title card padded from the bar by clamp(72px, 16vh, 180px) and closes with the same end-credit block: a giant "Next reel" link, a two-column credit list, and a faint footer line over a hairline.

The 2.39:1 frame is the unit of composition on the inner reels (the Col de l'Est film is 2.39). The home is full-bleed: a sticky 100svh stage inside a 680svh scroll, with nothing laid over it but the chrome, which steps aside while the scroll moves and returns at rest, at the end and on keyboard focus, and a 1px scroll cue that sits above the mobile tab bar.

Credit lists are two columns with the role right-aligned against a 28px central gutter, as at the end of a film; below 600px they collapse to one left-aligned column with a 3px gap. Rows of lists, paths and the programme are separated by hairlines with 22px padding, never boxed.

Responsive steps: 1100px (suite stacks, programme drops a column, films go to 3 columns); 860px (reels move to a fixed bottom bar of 52px plus safe area, sticky ORVECT monitor, storyboards to 6-of-12 panels, films to 2); 600px (credits single column, programme and panels full width). The Photo reel is a sticky horizontal film strip in 3D; under reduced motion it becomes a wrapped static grid.

## Elevation & Depth

Flat on the black. Depth comes from light and projection: on the home, hidden-line rendering (black faces write depth so walls and towers hide what stands behind them) and grid lines that fade as they graze toward the horizon; elsewhere the projector beam cone and the blurred colour spill in the screening room, the 3D perspective of the film strip with a floor reflection, dimming of non-focused frames and clips (brightness .55–.7, reduced saturation), and the grain layer.

### Shadow Vocabulary
- **Frame hairline** (`box-shadow: 0 0 0 1px var(--line)`, white when selected): film posters and the screen edge; a ring, not a lift.
- **Sheet lift** (`box-shadow: 0 14px 24px -12px rgb(0 0 0 / .35)` with translateY(-4px)): only storyboard panels on paper, on hover, as a sheet picked off the table.

### Named Rules
**The Source Rule.** Nothing on the black glows or casts a shadow unless a light in the scene (the front of light, the projector, the pointer) explains it.

## Shapes

Rectilinear. Frames, screens, sheets and panels have square corners; interactive plates (buttons, subtitle track, transport and lightbox controls, clips) take a barely-there 2px corner. Structure is drawn with 1px hairlines at 13% or 24% white. The recurring silhouettes are film ones: the 2.39 letterbox, masking panels that close to 16:9 or 9:16, the pentagonal playhead flag, the four-corner autofocus brackets of the cursor, and the square shot badge (20px, 1px paper-ink border) on storyboard panels.

## Components

### Buttons
Slate plates with a hairline: quiet until touched.
- **Shape:** 2px corner, 1px border at line-2, min-height 42px (38px in the inspector), 16px side padding, 10px gap to a 14px stroked arrow icon.
- **Default:** transparent with white control caps.
- **Hover:** fills credit white with black text; .3s on the standard ease.
- **Solid:** subtitle yellow with black text, reserved for the view's one outward action (See the landing, The website, Try it live); hover turns it white.
- **On paper:** border #9fa09e; hover fills paper-ink with paper text.
- **Transport / lightbox:** 40px (48px in the lightbox) square hairline plates holding a 16–18px stroked icon; hover turns the border white.

### Subtitle track (language switch)
A 28px hairline plate with a caption glyph and EN / FR; the active language is white, the other faint. Switching language swaps text in place from `data-fr`.

### Navigation
The top letterbox bar: name left in expanded caps (NOLANN white, PETRI dim), the four reels centred in dim control caps with a 1px white underline that draws from the left on hover and stays under the current reel, subtitle track and a yellow Contact at right. Under 860px the reels move to a fixed bottom bar with a hairline top and safe-area padding.

### Credit block
Role and name in a single baseline row: the name leads, the role follows and wraps below it, never above. In lists, the role sits right-aligned in its column against the name.

### Lignes (home)
A WebGL2 scene of instanced line segments expanded to screen-space quads (analytic anti-aliasing, a halo only where light touches). The grid is white at 13% (every unit) and 30% (every fifth); the traced name is a monoline, chamfered capital set on a 4 × 6 grid, PETRI yellow while it lies flat. One front of light in subtitle yellow is the only cause of change: it raises the letters into 4.4-unit walls and grows towers with storey lines as it passes, then a returning front folds everything flat. Its source is a white-hot point with a blue anamorphic streak. Motion is spring-driven (a little overshoot, then still) and tied to a critically damped scroll; the camera runs a cubic-Hermite curve through the plan, the rise, a slalom through the gaps between letters, an avenue, an orbit round the city and the return. The pointer lifts the grid like a finger under paper and lights the lines near it. Reduced motion shows the flat plan only.

### Edit timeline (Code)
A non-linear editor: viewer with a mono URL and yellow timecode bar, inspector with fact list and one solid action, and a timeline of 62px tracks with sticky labels. Clips are ink-3 thumbnails desaturated to .25, with a 2px inset top edge in their track colour; hover lifts saturation, selection removes the filter and adds a white 1px inset ring. A yellow 1px playhead with a pentagonal flag can be dragged.

### Film strip (Photo)
Stills at min(56svh, 620px) in a 3D horizontal strip, reflected below; frames not near the centre dim to .55 and their captions to 35%. Captions pair the title with a mono frame-edge number in faint.

### Screening room (Film)
A screen with black masking panels that travel to the film's format over 1s, a projector beam drawn as a cone from a projection-port point in the frame's colour, a blurred spill beneath, and a transport of hairline buttons, yellow timecode and a 2px yellow-filled scrubber with a white 2×16px thumb.

### Storyboard sheet (Design)
Paper sheets on the black: a head with an expanded-caps title that wraps, a line in paper-dim, a three-column meta list, then a 12-column grid of panels, each a white-matted image in a 1px paper-ink frame with a shot letter badge and caption.

### Autofocus cursor
On fine pointers, the cursor is four 7px corner brackets with a centre dot; over a target the brackets lock yellow and the dot disappears, like a focus confirmation.

### End credits (Contact)
The name returns, the email is set large in light Archivo with a hairline underline, credit rows follow, and the block rolls up from 18vh with 70ms staggers.

## Do's and Don'ts

### Do:
- **Do** compose inside the 2.39:1 frame and its title-safe area; let black bars carry the interface.
- **Do** keep yellow to subtitles, timecode and the one action per view; everything else is white, dim or faint.
- **Do** set titles in Archivo expanded (wdth 125) light caps with wide tracking and roles in condensed (wdth 78) caps at 11px.
- **Do** lead every credit with the name; the role follows or wraps below.
- **Do** move between states with cuts, fades through black and masking on the `ease` (cubic-bezier(.16, 1, .3, 1)) and `ease-io` (cubic-bezier(.65, 0, .35, 1)) curves.
- **Do** give every glow a source: the front of light, the projector or the pointer.
- **Don't** put words on the home past the traced name.
- **Do** let every reel still play under reduced motion, without the camera work and grain.

### Don't:
- **Don't** use Azeret Mono for names, roles, labels or prose.
- **Don't** paint with anamorphic blue: no blue text, borders or fills.
- **Don't** use Space Grotesk or ORVECT orange outside ORVECT's own case study, logo, board and timeline track.
- **Don't** box content in rounded cards or float it on drop shadows; use hairlines and black.
- **Don't** animate entrances as slide-up cards.
- **Don't** add an NP logo to the header; the bar carries the name in type.
