# TDSE Copiloto de Triage RAG — Design System ("Pulso")

## Product context
- Academic prototype of a RAG copilot that suggests a Colombian emergency triage level (I–V, Resolución 5596/2015) from a patient's free-text narrative, always with a citation to the normative corpus, or abstains. Motto: **"Asiste, no decide"** — the clinician makes the final call.
- Language: Spanish (es-CO). All UI copy in Spanish.
- Users: (1) triage nurses/physicians reviewing a suggestion — short, repeated, high-stakes task, often on a tablet; (2) academic jury exploring experiments, real data and the corpus.
- Pages (single-page app, tab navigation):
  1. **Revisión** (primary, human-in-the-loop): narrative input → suggestion (level, citation, alarms, rule elevation, cited fragment) → explicit decision (confirm / correct with reason) → audit hash.
  2. **Consulta individual**: same input + example chips + advanced settings (corpus raw/reformatted, embeddings, backend Gemini/deterministic) → suggestion vs. rule baseline + retrieved fragments with score bars.
  3. **Experimento**: E1–E6 + C0 metrics: KPI tiles, charts, metrics table.
  4. **Dataset real**: 89k real records from datos.gov.co: KPIs, level distribution, median wait, table per IPS network.
  5. **Corpus y casos**: searchable list of 74 gold-standard cases and 31 corpus fragments.

## Visual direction
Dark "clinical night shift" UI: calm, deep navy surfaces, luminous teal accent, a living **pulse/ECG line** motif, and real **imagery** (photographic/illustrative emergency-room scenes, abstract anatomical renders) used in hero bands and empty states — never behind dense data. Innovative but trustworthy: medical calm > neon.

## Color tokens
| Token | Value | Use |
|---|---|---|
| --bg | #050B18 | page background |
| --surface | #0B1426 | cards |
| --surface-2 | #111D35 | inputs, nested boxes |
| --border | #1E2A44 | borders/dividers |
| --text | #F1F5F9 | primary text |
| --text-2 | #CBD5E1 | secondary text |
| --muted | #94A3B8 | meta text (minimum for meaningful text; WCAG AA) |
| --accent | #2DD4BF | primary actions, active nav, focus rings |
| --accent-strong | #14B8A6 | primary button bg (text #04131A) |
| --accent-2 | #38BDF8 | secondary accent, gradients (teal→sky only) |
| --warn | #FBBF24 on rgba(251,191,36,.10) | degraded mode, disclaimers |
| --danger | #F87171 on rgba(248,113,113,.10) | escalation, rule elevation |
### Light theme (same token names, toggled by a sun/moon switch; default = system preference, choice remembered)
| Token | Light value |
|---|---|
| --bg | #F4F7FB |
| --surface | #FFFFFF |
| --surface-2 | #EEF2F7 |
| --border | #D9E1EC |
| --text | #0B1426 |
| --text-2 | #334155 |
| --muted | #5B6B82 |
| --accent | #0F9F8F (text/links) |
| --accent-strong | #0D9488 (button bg, text #FFFFFF) |
| --accent-2 | #0284C7 |
Level colors in light theme use darker text shades for AA on white: I #DC2626, II #EA580C, III #B45309, IV #0284C7, V #059669 (tinted backgrounds at 10%). Hero images keep a dark overlay in both themes. Theme switch animates with a 300ms cross-fade of background/text colors.

Triage levels (always paired with roman numeral + name, never color alone):
I Resucitación #F87171 · II Emergencia #FB923C · III Urgencia #FBBF24 · IV Urgencia menor #38BDF8 · V No urgencia #34D399 · Sin nivel #64748B.
No purple, pink or neon gradients. Only gradient allowed: teal (#2DD4BF) → sky (#38BDF8), and soft radial glows of those at ≤15% opacity.

## Typography
- Headings/display: **"Space Grotesk"** (600/700), tight tracking.
- Body/UI: **"Inter"** (400/500/600).
- Mono for citations/hashes: **"JetBrains Mono"**.
- Scale: display 40/44 (hero), h1 28/34, h2 20/28, body 15/24, small 13/20, meta 12/16 (never below 12px).

## Layout
- Navigation: a **hamburger button** (top-left, beside the logo) toggles the side menu. Desktop ≥1024: menu is a left rail that collapses to 72px icons ↔ expands to 240px labeled when the hamburger is pressed (icon morphs ☰ → ✕). Tablet/mobile <1024: hamburger opens the menu as an off-canvas drawer from the left with a dimmed backdrop (close on backdrop click / Esc). Content max-width 1200px; 12-col grid, 24px gutters.
- Top bar (all sizes): hamburger, logo + product name, current page title, theme toggle (sun/moon), reviewer avatar chip.
- Mobile <640: 16px gutters, full-width cards, primary action sticky at bottom.
- Spacing scale 4/8/12/16/24/32/48. Radius: 10 inputs/buttons, 16 cards, 999 chips. Shadow: 0 10px 30px rgba(0,0,0,.35).
- Touch targets ≥44px.

## Components
- Glass card: --surface at 80% + 1px --border + backdrop-blur.
- Level badge: pill with dot, roman numeral + name; large variant (hero result): big numeral (56px Space Grotesk) inside a ring colored by level, with soft glow.
- Alert banners: left icon, bold first line, plain-language explanation (amber = degraded, red = escalation / elevated by alarm rule).
- Segmented controls instead of selects for 2-option settings.
- Example chips show a descriptive label (e.g. "Dolor torácico") not "Ejemplo 1".
- Stepper on Revisión: 1 Relato → 2 Sugerencia → 3 Decisión.

## Motion
- 150–250ms ease-out for hovers/state; 400–700ms for result reveal (fade+rise 8px, staggered 60ms).
- ECG pulse line animates (stroke-dashoffset loop) while loading; becomes a flat calm line when idle.
- Score/confidence bars grow from 0 on reveal. Numbers count up on KPI tiles.
- Respect prefers-reduced-motion (disable loops, keep fades).

## Imagery
- Hero band per page (≤280px tall desktop, 160px mobile) with an image + dark gradient overlay (left → transparent) so text stays AA.
- Revisión/Consulta: calm ER triage scene (nurse with tablet, soft teal light). Experimento: abstract data/neural render. Dataset: Colombian hospital/map. Corpus: documents/clinical guidelines.
- Empty states: small illustration + one line of guidance + action.

## Accountability (who approved)
- The reviewer identity is required to register a decision and is asked at the END of the decision step ("Personal que revisa"): a **Cargo** select with fixed options (Médico/a de urgencias, Médico/a general, Enfermero/a jefe, Enfermero/a, Auxiliar de enfermería, Otro) + a free-text **Nombre** field. Never prefill a person and never show a fixed person in the top bar (the top bar only has hamburger, logo, page title and theme toggle).
- Success state: a celebratory confirmation card "Aprobado por Enf. Laura Gómez · 14:32 · nivel II confirmado" with avatar, timestamp, action, and short event hash; plus a "Historial de decisiones" list of recent decisions (avatar, reviewer name, level badge, confirma/corrige, time).

## Content rules
- Plain language; translate internal codes (abstention reasons, backend names) to human sentences; technical details (hash, route) inside a collapsible "Detalles técnicos".
- Disclaimer "Asiste, no decide" visible at top of Revisión and Consulta.
