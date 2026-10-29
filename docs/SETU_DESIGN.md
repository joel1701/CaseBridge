# Setu design brief

The approved landing page design is [`docs/design/setu-landing.html`](design/setu-landing.html). It is the reference: don't edit it. Every value below is taken from that file unless it says otherwise. Where this brief and the file disagree, the file wins, except for the accessibility fixes in [Guardrails](#guardrails), which override it.

The look is an expedition poster: condensed lowercase display type, spec sheets, square corners, film grain and toned bands. The palette ("Monsoon") is a graphite base with an indigo band and a cool paper band. Red appears only for problems.

## Credit

The reference file starts with this comment. It must stay, word for word, as the first line of the landing page code when the design is built into the app:

```html
<!-- Layout and motion system adapted from: Wayfind AI Travel Companion Page · INSTALANDING.AI (MIT) · https://instalanding.ai/prompt/wayfind-ai-travel-companion-page -->
```

In a React file, keep it as the first comment at the top of the landing page module (`{/* … */}` or `/* … */`, same text).

## Colour

### Tokens

| Token        | Hex       | Name          | Use                                                                                       |
| ------------ | --------- | ------------- | ----------------------------------------------------------------------------------------- |
| `--g0`       | `#0B0E14` | Graphite base | Page background, the `base` tone. Default for every screen.                               |
| `--g1`       | `#151A24` | Graphite deep | The `deep` tone, cards (`.case`, `.ecard`, `.role`), first poster.                        |
| `--g2`       | `#1D2330` | Graphite 2    | Alternate cards (`.ecard:nth-child(even)`), fourth poster, the large footer सेतु.         |
| `--ind`      | `#6E7BFF` | Indigo        | Primary button fill, the `indigo` band, bars in small charts, active markers.             |
| `--ind-hi`   | `#9AA4FF` | Indigo high   | Headings (`.h2`) on graphite, focus ring, links between matched cases, active list items. |
| `--ind-deep` | `#3442C9` | Indigo deep   | Headings and chart bars on the paper band.                                                |
| `--paper`    | `#E6E9F2` | Paper         | The `paper` band (chart section, second poster).                                          |
| `--sheet`    | `#EDF0F6` | Sheet         | The hero background behind the सेतु knockout. Nowhere else.                               |
| `--ink`      | `#0B0E14` | Ink           | Text on indigo, paper and sheet. Same value as `--g0`, different role.                    |
| `--text`     | `#EEF1F8` | Text          | Body text on graphite. Also the hover fill of buttons.                                    |
| `--muted`    | `#8C95AB` | Muted         | Secondary text, metadata, inactive nav items in app screens.                              |
| `--alert`    | `#FF5C6C` | Alert red     | Overlaps and overdue cases only. See below.                                               |

`color-scheme: dark` is set on `:root`.

Surface and line values used inside the product mock (the `.dash`, `.vc` and `.kp` blocks). Use these for app screens:

| Value                                     | Use                                                                         |
| ----------------------------------------- | --------------------------------------------------------------------------- |
| `#11151E`                                 | Dashboard and vignette card background                                      |
| `#181E2A`                                 | Panels inside the dashboard (KPI tiles, overlap panel, active sidebar item) |
| `#262D3C`                                 | 1px panel border, sidebar divider, search field border                      |
| `#2E364A`                                 | 1px border on neutral tags and paired boxes                                 |
| `rgba(238,241,248,.18)`                   | Rules: FAQ dividers, manifesto footer rule                                  |
| `rgba(238,241,248,.12)`                   | Card border on `--g1`/`--g2` cards                                          |
| `rgba(238,241,248,.1)`                    | Role card border                                                            |
| `rgba(110,123,255,.16)` + `--ind-hi` text | Highlighted tag (`.tags .r`)                                                |
| `rgba(255,92,108,.45)` / `.5`             | Alert-tinted borders on KPI and overlap panels                              |

Hero-only values (the monsoon sky scene): `#F4F6FF` (nav and headline text over the sky), `#DDE1FF` (hero side text), `#C7CDFF` (in-transit legend dot), `#C9CEFF` (reveal note). The sky's CSS fallback is `linear-gradient(#141A3D, #2B36A8 55%, #9AA4FF 72%, #1A2050 73%, #0E1230)`. Don't use these outside the hero.

### Tones

Sections set a tone with `data-tone`, which sets background and text together:

| Tone     | Background | Text     | `.h2` colour |
| -------- | ---------- | -------- | ------------ |
| `base`   | `--g0`     | `--text` | `--ind-hi`   |
| `deep`   | `--g1`     | `--text` | `--ind-hi`   |
| `indigo` | `--ind`    | `--ink`  | `--ink`      |
| `paper`  | `--paper`  | `--ink`  | `--ind-deep` |

### Where each colour is allowed

- **Graphite is the default.** Almost every section in the reference is `base`. App screens are graphite.
- **Light and indigo bands are rare.** The reference uses the indigo band only for "twelve days in the life of a case", the third poster and the featured "bureau head" role card. It uses paper only for the chart section and the second poster, and sheet only behind the hero knockout. In the app, a band is an emphasis for one thing per screen at most (for example, a page header or a single highlighted card), never a screen background and never two bands next to each other.
- **Red is only for overlaps and overdue cases.** In the reference, red marks: the overlap call-out on the bridge, the overlap legend dot, the overlap KPI tile, the overlap panel border, the "potential overlapping cases" alert card, the "Coordination required" flag, and the day the overlap was found on the case route. In the app, red may also mark an **overdue** case. It is never used for errors in general, destructive buttons, decoration, charts, or "approaching deadline" (that is a warning, not red). If something is red, it must be an overlap or overdue.

## Type

### Families

Loaded in the reference from Google Fonts with these axes:

```
Hubot Sans: wdth 75..125, wght 200..900
Special Gothic: wdth 75..100, wght 400..700
Teko: wght 500; 600
```

| Token         | Stack                                          | Role                                                                                                                               |
| ------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `--f-display` | `"Special Gothic", "Arial Narrow", sans-serif` | Headings and display words. Always `font-stretch: 75%`, `text-transform: lowercase`, weight 700 (600 for the manifesto paragraph). |
| `--f-text`    | `"Hubot Sans", system-ui, sans-serif`          | All other text. Body at default width.                                                                                             |
| `--f-deva`    | `"Teko", "Noto Sans Devanagari", sans-serif`   | Only the Devanagari word सेतु (hero knockout, footer, product mark). Weight 600.                                                   |

**Wide labels:** Hubot Sans at `font-stretch: 125%`, weight 300, `letter-spacing: .01em` (the `.wide` class). Used for spec values, subtitles under display words, chart month labels and the hero legend.

Monospace appears once, for case IDs in vignette cards: `ui-monospace, Menlo, monospace`, 13px, `--ind-hi`.

Numbers in KPIs, chart values and counts use `font-variant-numeric: tabular-nums`.

### Scale

Body: `font-size: clamp(16px, .35vw + 13px, 18px)`, `line-height: 1.5`, `-webkit-font-smoothing: antialiased`.

Display (Special Gothic, 75% width, lowercase, 700 unless noted):

| Use                      | Class                       | Size                        | Line height | Other                                                           |
| ------------------------ | --------------------------- | --------------------------- | ----------- | --------------------------------------------------------------- |
| Closing word             | `.cword`                    | `clamp(110px, 24vw, 420px)` | .78         | `--ind`                                                         |
| Poster title             | `.ptitle`                   | `clamp(64px, 10vw, 180px)`  | .82         |                                                                 |
| Hero headline            | `.ha-word`                  | `clamp(56px, 8.6vw, 150px)` | .84         | max 11ch                                                        |
| Section heading          | `.h2`                       | `clamp(46px, 7.4vw, 132px)` | .86         | `letter-spacing: -.012em`, `text-wrap: balance`, colour by tone |
| Section heading, compact | `.desks .h2`                | `clamp(40px, 5vw, 88px)`    | .86         |                                                                 |
| Engine name              | `.ecard .ename`             | `clamp(56px, 6vw, 100px)`   | .85         | `--ind-hi`; 50px under 860px                                    |
| Role name                | `.rname`                    | `clamp(48px, 5vw, 84px)`    | .85         |                                                                 |
| Route figure word        | `.sfig`                     | `clamp(44px, 5vw, 72px)`    | 1           |                                                                 |
| Engine list              | `.enames li`                | `clamp(30px, 3vw, 46px)`    | 1           |                                                                 |
| Route stop title         | `.stitle`                   | `clamp(30px, 3vw, 44px)`    | .9          |                                                                 |
| Brand "setu"             | `.brand`                    | `clamp(30px, 2.8vw, 40px)`  | 1           | `letter-spacing: -.01em`                                        |
| Manifesto                | `.mf`                       | `clamp(26px, 2.9vw, 48px)`  | 1.02        | weight 600, max 28ch, `text-wrap: balance`                      |
| Dashboard title          | `.dtop b`                   | 34px                        | 1           |                                                                 |
| Vignette title           | `.vc h4`                    | 28px                        | 1           |                                                                 |
| Card title               | `.case h3`                  | 26px                        | .92         | 19px under 760px                                                |
| Panel and alert title    | `.ovp h4`, `.alertc strong` | 26px                        | 1           |                                                                 |
| Inline overlap label     | `.redcall b`                | 18px                        |             |                                                                 |

Devanagari (Teko 600): footer word `.fword` `clamp(140px, 30vw, 520px)` / .8 in `--g2`; product mark `.dash .mk` 36px / 1.

Text (Hubot Sans):

| Use                                   | Size                             | Line height | Weight          |
| ------------------------------------- | -------------------------------- | ----------- | --------------- |
| Lead paragraph `.lead`                | `clamp(17px, .6vw + 13px, 21px)` | 1.5         | 400, max 40ch   |
| FAQ question                          | `clamp(18px, 1.4vw, 22px)`       | 1.5         | 600             |
| Button                                | 16px (14px in the nav)           |             | 600             |
| Spec label `dt`                       | 15px                             | 1.3         | 700             |
| Nav links, route stop text, role list | 15px                             | 1.5         | 400             |
| Spec value `dd`                       | 14px                             | 1.35        | 300, 125% width |
| Dashboard and small UI text           | 12–14px                          | 1.5         | 400             |
| KPI number                            | 34px                             | 1.1         | 600, tabular    |

## Patterns

### Spec label/value list

A `<dl class="spec">` of `<div><dt/><dd/></div>` pairs. The label ends with " -" added by CSS.

```css
.spec {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 9.5rem), 1fr));
  gap: 14px var(--gap);
}
.spec > div {
  min-width: 0;
}
.spec dt {
  font-weight: 700;
  font-size: 15px;
  line-height: 1.3;
}
.spec dt::after {
  content: ' -';
}
.spec dd {
  margin-top: 6px;
  font-stretch: 125%;
  font-weight: 300;
  font-size: 14px;
  line-height: 1.35;
  letter-spacing: 0.01em;
}
```

In the manifesto footer it shrinks to 13px / 12.5px. Use it for facts about a thing (shows, keyed by, used by), not for prose.

### Square corners

Nothing has a border radius: buttons, cards, panels, tags, inputs and chart bars are all square. The only round shapes are the two legend dots in the hero key, which are a colour legend, not decoration. In the app, keep everything square (`border-radius: 0`). Separate surfaces with a 1px border or a change of background, not with rounding.

### Shadows

Almost none. Depth comes from borders and background steps (`--g0` → `#11151E` → `#181E2A`, or `--g0` → `--g1` → `--g2`). The reference uses a shadow in only these places: the active route figure (`0 18px 40px rgba(11,14,20,.35)`), the ghost button outline (`inset 0 0 0 1.5px currentColor`), the alert card action outline (`inset 0 0 0 1px rgba(238,241,248,.3)`), the active sidebar item marker (`inset 3px 0 0 var(--ind)`) and the hero legend glow. Don't add a shadow to every card.

### Grain overlay

A fixed noise layer over the whole page, above content, never catching clicks:

```css
body::after {
  content: '';
  position: fixed;
  inset: 0;
  z-index: 90;
  pointer-events: none;
  opacity: 0.09;
  background: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 .7 -.12'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
}
```

A second fixed layer, `body::before`, fills the top safe-area inset with `--g0` (`z-index: 60`) so content doesn't show under a phone's status bar.

### Buttons

Square, 50px tall, 24px side padding, 16px weight 600, no border. On hover a second colour wipes up from the bottom (`clip-path` from `inset(100% 0 0 0)` to `inset(0)`) while the text colour changes.

```css
.btn {
  --bg: var(--ind);
  --fg: var(--ink);
  --fill: var(--text);
  --fill-fg: var(--ink);
  position: relative;
  isolation: isolate;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 50px;
  padding: 0 24px;
  border: 0;
  background: var(--bg);
  color: var(--fg);
  font-weight: 600;
  font-size: 16px;
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  transition: color 0.45s var(--ease);
}
.btn::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  background: var(--fill);
  clip-path: inset(100% 0 0 0);
  transition: clip-path 0.55s var(--ease);
}
.btn--ink {
  --bg: var(--ink);
  --fg: var(--text);
  --fill: var(--text);
  --fill-fg: var(--ink);
}
.btn--ghost {
  --bg: transparent;
  --fg: currentColor;
  --fill: currentColor;
  box-shadow: inset 0 0 0 1.5px currentColor;
}
[data-tone='base'] .btn--ghost {
  --fill-fg: var(--g0);
}
@media (hover: hover) {
  .btn:hover {
    color: var(--fill-fg);
  }
  .btn:hover::before {
    clip-path: inset(0);
  }
}
```

| Variant               | Rest                                               | Hover fill     | Hover text         |
| --------------------- | -------------------------------------------------- | -------------- | ------------------ |
| Primary (`.btn`)      | `--ind` on `--ink` text                            | `--text`       | `--ink`            |
| Ink (`.btn--ink`)     | `--ink` with `--text` text                         | `--text`       | `--ink`            |
| Ghost (`.btn--ghost`) | transparent, 1.5px inset outline in `currentColor` | `currentColor` | `--g0` on graphite |

In the nav the button is 40px tall, 18px padding, 14px text. The hover only runs on devices that can hover.

### Links

No text decoration. A 1px underline sits under the text, and a 2px line grows over it from the left on hover:

```css
.link {
  text-decoration: none;
  font-weight: 600;
  background:
    linear-gradient(currentColor, currentColor) 0 100%/100% 1px no-repeat,
    linear-gradient(currentColor, currentColor) 0 100%/0 2px no-repeat;
  padding-bottom: 4px;
  transition: background-size 0.55s var(--ease);
}
@media (hover: hover) {
  .link:hover {
    background-size:
      100% 0,
      100% 2px;
  }
}
```

### Focus

```css
:focus-visible {
  outline: 2px solid var(--ind-hi);
  outline-offset: 3px;
}
```

See [Guardrails](#guardrails): on paper and indigo bands the ring needs a darker colour.

### Layout

```css
--m: clamp(16px, 4.35vw, 72px); /* page side margin */
--gap: clamp(14px, 2vw, 32px); /* column gap */
--hdr: clamp(64px, 7vw, 96px); /* header height */
.wrap {
  padding-left: max(var(--m), env(safe-area-inset-left, 0px));
  padding-right: max(var(--m), env(safe-area-inset-right, 0px));
}
```

Breakpoints used: 860px (nav links hide, two-column grids stack), 760px, 700px. Sections clip horizontal overflow (`overflow-x: clip`). Section padding is generous: `clamp(70px, 9vw, 140px)` to `clamp(90px, 12vw, 170px)` top and bottom on the landing page.

## Nav

- The brand is the English word **"setu"** in Special Gothic (75%, 700, lowercase), linking home with `aria-label="Setu, home"`. Devanagari सेतु is for display moments, not the nav.
- **Always visible:** `position: fixed` at `top: env(safe-area-inset-top, 0px)`, full width, height `--hdr`, `z-index: 50`. It never hides on scroll. On screens up to 860px the section links hide but the brand and "Sign in" button stay.
- **Blends with what's behind it:** the background is transparent and the text colour follows the section underneath, changing over `.35s var(--ease)`:
  - over the light sheet hero: `--ink`
  - while the hero opens onto the sky (`.sky`): `#F4F6FF`
  - once the page reaches graphite (`.solid`): `--text` on `rgba(11,14,20,.94)`, a near-solid graphite. No blur.
- Nav links are 15px, gap `clamp(14px, 2vw, 30px)`, opacity .85, 1 on hover.

App pages sit on graphite, so their nav uses the `.solid` state.

## Motion

Easing token: `--ease: cubic-bezier(.2,.7,.1,1)`. Typical durations in the reference: .3s for small reveals, .35s for nav colour, .45s for button text, .55s for button fill and link underline, .7s for large card moves.

### Landing page

Built with GSAP 3.12.5 + ScrollTrigger and Lenis 1.1.13 (`lerp: .1`, driven from `gsap.ticker`, anchor links scroll through Lenis). What moves:

- **Hero:** pinned for `+=140%`, `scrub: 1`. The सेतु knockout mask scales to 14 (`power2.in`) and fades, revealing a live WebGL monsoon sky over a cable-stayed bridge. Lights cross the bridge, and one red light is the overlap. The headline then rises in (`y: 40 → 0`, `power3.out`). If WebGL is missing, the CSS gradient shows instead.
- **Two desks:** a sticky scene where two case cards slide together, match reasons tick in one by one, a line draws between the cards, and the overlap alert appears in red.
- **Posters:** sticky stacked cards. Each one shrinks to .93, tilts ±1.6° and dims to .55 as the next slides over it.
- **Life of a case:** pinned horizontal route that snaps day to day while a path draws behind the stops.
- **Engines:** a deck where the top card flies off to the left as you scroll.
- **Chart:** bars grow from zero (`scaleY`, 1.1s, `power3.out`, `stagger: .06`) when they reach 80% of the viewport.
- **Roles:** three cards dealt out from a stack.
- **Close:** the "sign in" word rises (`yPercent: 40 → 0`, scrubbed).

### App pages

App pages are calm. This part comes from product direction rather than the reference, so the values reuse the reference's easing and timings:

- **Route change:** fade in with a small rise. Use the reference's small reveal (`.reason`: `translateY(8px)` → none, opacity 0 → 1, `.3s var(--ease)`).
- **Numbers:** KPI counts count up once, on first view only. Never again on re-render, and never in a loop.
- **Hover:** interactive cards lift 2px (`translateY(-2px)`) with `var(--ease)`. Buttons keep the fill wipe.
- **Overlap alerts:** a soft pulse is allowed on overlap alerts only. The reference has no pulse, so pick a gentle value when building it (a slow opacity or border pulse, not a scale bounce). Nothing else pulses, including overdue cases.
- No scroll-jacking, smooth-scroll libraries, pinned sections or parallax on app pages.

### Reduced motion

Everything respects `prefers-reduced-motion: reduce`. In the reference that means: GSAP, ScrollTrigger and Lenis are not started; the hero shows a static layout (`.hero.static`); the sky draws one frame; posters stop being sticky; the route scrolls normally; the two-desk scene shows its final linked state; the engine deck shows its first card; role cards are not dealt. In the app, reduced motion removes the route-change rise, the count-up (show the final number), the hover lift and the overlap pulse. Colour and opacity changes of .2s or less may stay.

## Avoid

- Headlines with mixed italic or colour. Headings are one colour, one style. (The manifesto's single indigo `<strong>` is a paragraph, not a heading, and is the only case of in-line colour.)
- Eyebrow text: small labels above headings. Use a spec list or nothing.
- Badges or dots with no meaning. Every tag, dot or pill states something real (a bureau, a status, a legend key).
- Serif fonts. Only Special Gothic, Hubot Sans, Teko, and the monospace for IDs.
- Glass or blur effects (`backdrop-filter`, frosted panels). The solid nav uses a near-opaque colour instead.
- Crowded screens. One idea per section, generous padding, a few elements per row.
- Emoji as icons. Use lucide-react icons or the reference's simple stroked SVG check.
- The same radius and shadow on everything. Corners are square; shadows are rare and specific.
- A missing favicon.
- Made-up live counters or testimonials. No "1,204 cases resolved today" tickers, no quotes from officials.

## Guardrails

- **No State Emblem, no AICTE logo, no tricolour decoration.** AICTE, PGRC and RB appear as text only.
- **All demo data is labelled synthetic.** The reference does this in the chart caption ("Synthetic data."), the FAQ ("Every institution, case and number shown is synthetic."), the closing spec list ("Synthetic in this prototype") and the footer ("All data shown is synthetic"). Every app screen that shows seeded data needs a visible synthetic label, and every chart caption says so.
- **WCAG AA contrast.** Measured from the tokens:

  | Pair                                              | Ratio                     | Result                                 |
  | ------------------------------------------------- | ------------------------- | -------------------------------------- |
  | `--text` on `--g0` / `--g1` / `--g2`              | 17.08 / 15.41 / 13.91     | Pass                                   |
  | `--muted` on `--g0` / `--g1` / `--g2` / `#181E2A` | 6.44 / 5.81 / 5.24 / 5.57 | Pass                                   |
  | `--ind-hi` on `--g0` / `--g1`                     | 8.40 / 7.57               | Pass                                   |
  | `--ind` on `--g0`                                 | 5.46                      | Pass                                   |
  | `--ink` on `--ind` / `--ind-hi` / `--paper`       | 5.46 / 8.40 / 15.92       | Pass                                   |
  | `--ind-deep` on `--paper` / `--sheet`             | 6.25 / 6.64               | Pass                                   |
  | `--alert` on `--g0` / `--g1` / `#181E2A`          | 6.44 / 5.81 / 5.56        | Pass                                   |
  | `--text` on `--ind`                               | 3.13                      | Large text only (18.66px bold / 24px+) |
  | `--g2` on `--g0` (inactive `.enames` items)       | 1.23                      | **Fail**                               |
  | `--ind-hi` focus ring on `--paper` / on `--ind`   | 1.90 / 1.54               | **Fail** (needs 3:1)                   |

  Fixes the app must apply (they override the reference): never put `--text` on `--ind` below large-text size; give inactive list items `--muted` instead of `--g2`, or hide them from assistive tech and keep them decorative; and set the focus ring to `--ink` inside `[data-tone="paper"]` and `[data-tone="indigo"]`. The footer सेतु in `--g2` is decorative and `aria-hidden`, so it is exempt.

- **Visible focus rings** on every interactive element, using the `:focus-visible` rule above. Never remove an outline without replacing it.
- The Devanagari word carries `lang="hi"` and is `aria-hidden` where it's decorative. The real page heading is plain English (the hero `h1` is visually hidden and reads "Setu: one view of every complaint case across AICTE bureaus").
