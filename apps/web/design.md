# Life RPG — Design System & Game Feel Specification (`design.md`)

> **Aesthetic Philosophy**: Militarized Night-City Netrunner HUD. Deep red/black tactical readouts, diegetic scanline and telemetry noise, hexagonal attribute constellations, circuit-board skill trees, and an exposed-cybernetics body diagram for progression and gear. Every panel reads like an in-world OS: dense, angular, faintly glitching, and confident about showing you raw numbers.

---

## 1. Visual Identity & Surface Depth Hierarchy

Depth here is built from **near-black voids punched through with red structural light**, not soft shadows. Panels feel like HUD overlays projected on glass, not flat cards.

### 1.1 Core Surface & Line Tokens
| Surface Token | Hex / Value | Description & Role |
|---|---|---|
| `bg-void` | `#07050a` | Root canvas — near-black with a whisper of red undertone |
| `bg-panel-900` | `#120608` | Resting panel background (lists, sheets) |
| `bg-panel-800` | `#1a0a0d` | Elevated card / hovered row |
| `bg-panel-glass` | `rgba(15, 5, 8, 0.9)` | Backdrop-blur modal / tooltip surface |
| `hud-hairline` | `#ff003c` | The single bright red rule under every top bar |
| `border-subtle` | `#2a1418` | Structural divider between list rows |
| `border-bracket` | `#ff3b5c` | Corner-bracket accents on focused/selected elements |

### 1.2 Accent Palette
| Token | Hex | Usage |
|---|---|---|
| `accent-cyber-red` | `#ff003c` | Primary status, header rule, danger, "very high" tags |
| `accent-cyber-cyan` | `#00f6ff` | Interactive/available state — mod slots, tabs, active hex nodes |
| `accent-eddie-gold` | `#ffd84a` | Currency (`€$`), perk points, XP counters |
| `accent-street-green` | `#3cff9e` | "Street Cred" style secondary stat, low-danger tags, positive stat delta |
| `accent-danger-orange` | `#ff8a3d` | Moderate danger, mid-tier warnings |
| `gradient-xp-fill` | `linear-gradient(90deg, #00f6ff 0%, #ffd84a 100%)` | XP / progress bar fill — two stops only, never more; glow lives at the leading edge, not smeared across the bar |

### 1.3 Rarity Color System (loot, goals, milestone tiers)
| Tier | Hex | Reserved For |
|---|---|---|
| Common | `#c9d1d9` (grey-white) | Base rewards, default gear |
| Uncommon | `#3cff9e` | Minor streak rewards |
| Rare | `#3ba7ff` | Weekly quest rewards |
| Epic | `#bf5af2` | Monthly / boss quest rewards |
| Legendary | `#ffb020` | Rare cosmetic unlocks |
| Iconic | gradient `#ff003c → #ffd84a` | One-off milestone artifacts (e.g. 100-day streak) |

A colored **left-edge stripe** (4px) on list rows is the primary rarity signal, reinforced by a matching glow on the icon itself — never color alone.

### 1.4 Corner Treatment
- Panels and item cards use small **viewfinder corner brackets** (4 independent L-shaped strokes, `border-bracket`, 12–16px arm length) rather than a full chamfered edge. Brackets sit just outside the panel bounds with a 2–4px gap.
- Primary CTA buttons keep a single angular cut on one corner only (asymmetric, not a full octagon).
- Hex-shaped elements are reserved for the character/attribute constellation and milestone flourishes (Section 3), matching the original spec's intent — hexagons stay rare and meaningful, not decorative wallpaper.

### 1.5 Typography & HUD Telemetry Noise
- **Stat displays & large numbers**: condensed technical sans (Rajdhani / Chakra Petch), `font-black`, wide tracking on labels, tight tracking on numerals.
  - Level / DPS hero numbers: `2.25rem`–`2.75rem`.
  - Secondary stat values ("VALUE" under hex nodes): `1.25rem`.
- **Labels & captions**: all-caps, `letter-spacing: 0.08em`, `0.6875rem`–`0.75rem`, `text-slate-400`.
- **Decorative telemetry**: thin columns of faux binary / hash-code strings rendered at 4–6% opacity in the left/right margins of full-screen menus (character, journal). Purely atmospheric — never real data, never interactive, and regenerated per-session so it doesn't read as fixed content.
- **Scanline overlay**: a very subtle 1px repeating horizontal-line texture at ~3% opacity over full-screen menu backgrounds, plus an occasional 80ms single-frame chromatic-aberration flicker on screen transition (skippable under reduced motion).

---

## 2. HUD Chrome & Navigation Bar

- Fixed top bar, `bg-void` with the single `hud-hairline` rule running its full width beneath it.
- Left cluster: primary stat readouts as bold inline pairs — number in accent color, label in caps beside it (`12 LEVEL`, `19 STREET CRED`), each with a thin progress sliver underneath.
- Center cluster: tab navigation as plain text-and-icon buttons, no pill backgrounds. The **active tab** is marked by a small icon-color shift plus a thin underline in `accent-cyber-cyan`; controller-style bumper hints (`L1` / `R1`) sit beside the outermost tabs as a stylistic nod, purely decorative on touch/desktop.
- Right cluster: capacity meter with a lock/weight icon (`112/240`) in red, currency with `€$` glyph in gold — always right-aligned, always the last thing the eye lands on.

---

## 3. Hexagonal Attribute Constellation (Character Screen)

- **Central hex**: the player's overall Level, largest node, sits at the visual core.
- **6 radiating attribute hexes** (STR, INT, DEX, END, VIT, CHA) arranged in a radial ring, each a flat-topped hexagon with a corner-bracket frame and a small glyph icon + numeric `VALUE`.
- **Connector lines**: animated SVG traces running from each outer hex into the central hub, styled as thin circuit runs (not smooth curves) with a faint pulse traveling along them every few seconds toward the core.
- **Idle state**: the attribute with the current highest value gets a slow ambient glow-breathe (4s cycle) — a quiet signal of "this is your build" without a badge or label.
- Tapping a hex opens a bottom sheet (mobile) or side panel (desktop) with point totals, progress to next rank, and the goals feeding that attribute — same interaction model as the reference cyberware/skill screens: select on the field, detail in a docked panel, never a full-screen takeover.

---

## 4. Circuit-Board Skill / Perk Tree

- Nodes are laid out on an implied grid connected by **orthogonal PCB-style traces** (right-angle turns, small solder-pad dots at junctions) rather than freeform lines — this is the single most identifying motif to carry over from the reference.
- **Node states**:
  - Locked / unallocated: low-opacity outline icon, no fill, trace dim.
  - Available to allocate: icon rendered in full color, trace to it lit.
  - Ranked (e.g. `1/3`, `3/3`): a small fraction badge top-right of the node; a fully-maxed node gets a soft outer glow in its category color.
- **Category tabs** sit above the tree (e.g. per Life-Area or per Goal-Domain), with the active tab shown as a thin colored underline — mirrors the header tab treatment for consistency.
- **Progression footer**: a horizontal bar shows cumulative progress toward the next unlock, with numbered reward pips below it (current pip outlined) — used for streak milestones or category mastery in Life RPG's equivalent system.

---

## 5. Cyberware-Style Body / Systems Diagram

Repurposed here as the **Life Systems** panel — a visual metaphor for the player's "build" across life domains (health, focus, discipline, etc.), rendered as an anatomical figure.

- Center stage: a translucent humanoid silhouette. Default state shows a faint blue nervous-system/vein overlay; the more "invested" a life-system is, the more that region of the figure lights up with warm red-gold circuitry — an intentional inversion of decay-vs-growth cues (blue = dormant, red/gold = active).
- Slot cards ring the figure left and right, one per life-system region, each with:
  - Corner-bracket frame, small `+` glyph when empty.
  - `MODS UNAVAILABLE` in muted gray when nothing can be attached yet (locked by level/goal).
  - `AVAILABLE MODS n` in cyan when the player has unspent unlocks for that system.
- **Detail/trade view**: selecting a slot opens a two-pane layout — installed item(s) on the left, a scrollable grid of replacements on the right, each replacement tile carrying its rarity stripe plus an `OWNED` or `REQ` (requirement-locked) badge.
- **Item tooltip card**: name (large) + rarity tag top-right, category label, 1–2 stat lines with icons, a short mechanical description, italicized flavor text, and a footer row with a lock/capacity icon on the left and `€$` cost on the right — this exact footer pattern (capacity, then price) should be reused anywhere the game shows a purchasable or equippable item.

---

## 6. Comparison & Inventory Cards

- Any head-to-head comparison (gear, goal templates, streak rewards) uses **two cards side-by-side**, the currently-equipped/active one tagged `EQUIPPED` in a filled header bar.
- Primary stat (DPS-equivalent) is rendered oversized with a small colored arrow beside it: **green up-arrow** for an improvement over the alternative, **red down-arrow** for a regression. This up/down-arrow-plus-color convention is the standard for *every* stat delta in the app, not just gear.
- Supporting stat lines repeat the same arrow convention at smaller scale, right-aligned.
- A row of type/category icon tabs above the list (weapon type in the reference; life-domain in Life RPG) filters the left-hand list without leaving the screen.
- List rows carry the same rarity-stripe + colored dot convention as Section 5's replacement grid — one visual language for "what tier is this" across the entire app.

---

## 7. Journal / Quest Log

- Left column: a flat, grouped list of active items, grouped by a location/context header (district-style grouping — for Life RPG, group by Life Area). Each row shows a small area icon, the item name, and a **danger/urgency tag** color-coded exactly like Section 1.3's accent palette (`green` low, `orange` moderate, `red` very high).
- Selecting a row opens a right-hand detail pane: title, a `TRACK JOB`-style pinned-objective toggle, a checklist of sub-objectives, a short in-voice description in italic, and a small thumbnail image/map representing the context.
- The selected row in the list gets the `border-bracket` treatment and a filled-red background wash so the list-to-detail relationship is unambiguous at a glance.

---

## 8. Signature Motion Language

### 8.1 Easing & Timing Tokens
| Token | Curve | Duration | Usage |
|---|---|---|---|
| `--ease-slow-build` | `cubic-bezier(0.4, 0, 0.2, 1)` | 650ms | Press-and-hold charge fill |
| `--ease-snap-bounce` | `cubic-bezier(0.175, 0.885, 0.32, 1.275)` | 280ms | Release overshoot & settle |
| `--ease-reward-burst` | `cubic-bezier(0.22, 1, 0.36, 1)` | 500ms | XP count-up, trace-pulse burst |
| `--ease-glitch-pulse` | `cubic-bezier(0.16, 1, 0.3, 1)` | 750ms | Level-up scan-glitch flash |

### 8.2 Primary Action: "Charge, Snap, Glitch-Confirm"
1. **Press**: instant `scale(0.96)` compression; a thin cyan ring fills clockwise around the button over `650ms` (`--ease-slow-build`) instead of a flat progress bar — reads as "hacking" the action.
2. **Release on full charge**: single-frame red/cyan chromatic split (2–3px offset, 60ms) then snap to `scale(1.03) → scale(1.0)` over `280ms` (`--ease-snap-bounce`).
3. **Premature release**: ring drains counter-clockwise in 120ms, no glitch flash — a clean, cheap-feeling failure so it never fights the successful case for attention.

### 8.3 Reward Moments
- **Sub-objective complete**: quick cyan checkmark strike + `+XP` float (rises 20px, fades, 400ms).
- **Quest / streak reward claim**: numeric roll-up (500ms) → bar fill via `transform: scaleX()` using `gradient-xp-fill` (Section 1.2) with a glow only at the fill's leading edge → a rarity-colored glow burst matching Section 1.3's tier colors.

### 8.4 Milestone Celebrations
- **Level Up**: full-viewport scanline flicker (2 frames) + gentle scale pulse (`1.00 → 1.015 → 1.00`, 600ms) + gold particle burst.
- **Boss/Monthly Unlock**: a red-to-cyan chromatic flare sweeps across the hero card once, echoing the charge-release glitch at larger scale.

### 8.5 Accessibility
`prefers-reduced-motion: reduce` disables all glitch/chromatic effects, scale transforms, and particles; state changes become instant with a static colored border to mark success/failure instead.

---

## 9. Mobile-First Layout & Touch Ergonomics

- Target viewport `375–430px`, scaling to desktop `1024px+`.
- Touch targets minimum `44×44px`.
- Safe-area padding: bottom nav `env(safe-area-inset-bottom, 16px)`, header `env(safe-area-inset-top, 12px)`.
- Bottom-sheet pattern for sub-detail (attribute detail, cyberware slot detail, quest detail on narrow screens) with backdrop blur, matching the two-pane desktop layouts collapsing into sheets rather than new full screens.

---

## 10. Game Feel & Audio

Short procedural Web Audio tones, netrunner-flavored:
1. `tap` — crisp filtered click, 15ms.
2. `charge` — rising data-burst tone, 180Hz→650Hz over 650ms, synced to the charge ring.
3. `complete` — short digital arpeggio, C5→E5→G5→C6, 250ms.
4. `subquest` — data-pop blip, 440Hz→880Hz, 40ms.
5. `levelup` — layered fanfare with a brief bitcrush tail.
6. `bossunlock` — sub-bass drop + electric snap.

Sound state persists in `localStorage` (`liferpg_sound_enabled`, default `true`), initialized lazily on first gesture, never blocking state updates or API calls.

**Haptics**: tap `vibrate(10)`, completion `vibrate([20,30,40])`, milestone `vibrate([40,40,80])`, all wrapped in try/catch with feature detection.

---

## 11. Character Attribute Point Progression

Unchanged mechanically from the original spec — the constellation in Section 3 is the visualization layer on top of this math:

- **Daily Quest**: Primary `+1`, Secondary `+1` (half of primary, rounded down, min 1).
- **Weekly Quest**: Primary `+3`, Secondary `+1`.
- **Monthly / Boss Quest**: Primary `+10`, Secondary `+5`.
- Unlinked attributes: `+0`.

$$\text{Attribute Level} = \lfloor \frac{\text{points}}{50} \rfloor + 1 \qquad \text{Progress} = \text{points} \bmod 50$$

---

## 12. Performance & GPU Guardrails

1. **Composite-only animation**: `transform` (`scale`, `translate3d`) and `opacity` only — no width/height/top/left reflow, including for the circuit-trace pulse (animate via `stroke-dashoffset` or a moving gradient stop, not path redraw).
2. **Progress fills**: `transform: scaleX(progress/100)` with `transformOrigin: left`.
3. **Scanline/telemetry overlays** are a single tiled background-image or CSS gradient, never per-frame canvas redraws.
4. Particle bursts and audio synthesis run lazily in client memory, never blocking data fetches or state writes.

---

## 13. Login / Auth Screen

The entry point should feel like booting into the OS the rest of the app lives in — quieter than the gameplay screens, but unmistakably the same system.

### 13.1 Layout
- Full-viewport `bg-void`, with the scanline overlay and telemetry-noise columns from Section 1.5 running at their normal opacity — this is the first thing establishing the aesthetic, don't simplify it away.
- A single centered panel (`bg-panel-glass`, `border-bracket` corner treatment, max-width ~380px on desktop, full-bleed with safe-area padding on mobile) holds the form. No card shadow — the glass background + hairline is what separates it from the void.
- Faint circuit-trace lines (Section 4's motif, at ~8% opacity, static or very slow pulse) radiate outward from the panel's corners into the background — a quiet brand touch that doesn't compete with the form, and keeps the hex motif reserved for milestones per Section 1.4.
- Wordmark/logo sits above the panel, with a short boot-flavor line beneath it in the telemetry caption style (e.g. a monospace status line), optional and skippable — not a required animation.

### 13.2 Form
- Inputs are underline-style, not boxed: a thin `border-subtle` line that becomes `accent-cyber-cyan` on focus, with the field label as a small all-caps caption above it (matches Section 1.5 label treatment) rather than placeholder-only text.
- The **active field** gets the corner-bracket treatment (Section 1.4) at reduced scale (6–8px arms) — the same "this is selected" language used everywhere else in the app, just quieter.
- Error state: border and label flash `accent-cyber-red` once (a single 150ms pulse, not a loop), inline error text appears below in small caps mono. No shake animation — a color pulse reads as "system rejected input," which fits the tone better than a wobble.

### 13.3 Primary Action
- The submit button is **not** the full charge/hold interaction from Section 8.2 — that pattern is for deliberate gameplay actions, and adding hold-friction to login actively hurts conversion. Instead: instant `scale(0.97)` on press, then on success a brief single-frame chromatic split (same 60ms glitch used in 8.2's release) before the redirect — enough to feel like the same system without the delay.
- While the request is in flight, the button label characters scramble/decrypt (random glyphs resolving letter-by-letter into "ACCESS GRANTED" or back to the original label on failure) — reuses the telemetry-noise visual idea as a loading state instead of a generic spinner.

### 13.4 Secondary Actions & Alt Login
- "Forgot password" / "Create account" are plain `accent-cyber-cyan` text links, underline-on-hover only — no button chrome, so they stay visually subordinate to the primary action.
- Social/OAuth buttons (if present): flat outlined buttons with a thin left-edge color stripe (reusing the Section 1.3 rarity-stripe convention at "Common" grey, since these aren't a tiered signal — just a consistent left-accent habit) and a monochrome provider icon, never the provider's default brand-colored button.

### 13.5 Motion & Accessibility
- Panel entrance: single fade + 8px upward slide, 300ms, `--ease-reward-burst` — no bounce, this isn't a reward moment.
- All of the above respects `prefers-reduced-motion` per Section 8.5: the decrypt-text loading state becomes a plain static "LOADING…" label, the chromatic split is dropped in favor of an instant color change.

---

## 14. Screen Choreography & Ambient HUD Life

The difference between "dark-themed website" and "in-world OS" is mostly what's happening when nothing is happening, and how the whole screen changes rather than one element. This section governs that layer, sitting on top of the per-component motion in Section 8.

### 14.1 Ambient Idle Life
- Telemetry-noise columns (Section 1.5) drift slowly (60s loop, `translateY`, constant opacity) instead of sitting static — this is the single highest-leverage change for "the system is alive."
- Full-screen menus get a rare (every 12–20s, randomized) full-width scan sweep: a thin `accent-cyber-cyan` line crossing top-to-bottom at 8% opacity over 1.2s. Infrequent enough to read as ambient, not distracting.
- Any live numeric HUD readout (level, currency, capacity) has a low-probability "flicker re-render": an 80ms dip to 60% opacity and back, on a random 15–30s interval — reads as a continuously-updating feed even when the value hasn't changed. Route all such flickers through one shared idle-ticker so at most one flickers at a time app-wide; never let several fire together.
- The idle glow-breathe already defined for the top attribute (Section 3) extends to: the currently-tracked quest row (Section 7) and any cyberware slot with `AVAILABLE MODS > 0` (Section 5) — anything currently actionable gets the same quiet pull, so it stays one consistent signal rather than a new animation per feature.
- All ambient effects pause under `prefers-reduced-motion` AND pause when the tab/view loses focus — this is decorative, not worth the battery/CPU when nobody's looking.

### 14.2 Route / Screen Transitions
- Standard navigation: a single directional wipe — a bright `hud-hairline`-colored bar sweeps across the viewport over 220ms; the outgoing screen fades out just behind the wipe's leading edge, the incoming screen fades in just behind that, so at any instant you see old-screen / wipe / new-screen. Back-navigation reverses the direction as a positional cue.
- Full-screen menus (character, journal, cyberware) boot in staggered: shared chrome (header, hairline) first, then each major panel fades+slides in with a 40–60ms stagger — the same idea as the login panel entrance (13.5), applied to every panel on screen. Cap the total stagger at ~350ms so repeat visits never feel slow.
- The wipe is a purely visual overlay and never blocks data fetching — the incoming page starts loading immediately; if data isn't ready when the wipe completes, show the HUD-style loading state rather than delaying the transition itself.

### 14.3 Stat Roll / Digit Animation
- Every numeric HUD stat (level, currency, capacity, attribute values — not just XP-claim moments) animates through one shared "digit roller" primitive: each digit position rolls independently from old to new value over 400–600ms (`--ease-reward-burst`) with a 20ms stagger between digits.
- Increases roll digits upward (old scrolls up-and-out, new scrolls up-and-in); decreases (spending currency, etc.) roll downward — direction carries meaning, not just flourish.
- Jumps larger than roughly 2× a normal per-action increment skip the full incremental scroll and resolve as a fast blur-roll on the same easing, so a big reward doesn't take an oddly long time to settle.
- This replaces the one-off XP counter in Section 8.3 — that reward moment should now call this same shared primitive rather than its own implementation, so every number in the app rolls identically.

### 14.4 Unified Feedback Event Bus
- Every meaningful action — button charge/release (8.2), sub-objective complete, reward claim, level up, boss unlock, error state — fires a single internal event (name + payload). One subscriber triggers the sound token (Section 10), haptic pattern (Section 10), and visual burst (8.3/8.4) together, from that one event.
- No component calls the sound hook, the haptic call, and the visual trigger independently — that seam is exactly where they drift out of sync (sound fires without haptics on an unsupported browser, or a visual re-triggers on re-render without sound following).
- This doesn't require a new state-management library — a thin pub/sub, or whatever event mechanism the app already has, is enough. The point is one choke point, not three call sites per action.
- Reduced-motion and sound-disabled checks live once, inside the bus's handlers — not duplicated at every call site.