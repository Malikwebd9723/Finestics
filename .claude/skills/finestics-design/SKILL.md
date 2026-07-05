---
name: finestics-design
description: Finestics' in-house design system. Use whenever building or reshaping any app UI (screens, cards, modals, charts) so the result looks custom-built — disciplined palette, one brand type treatment, canonical components, and an enforced anti-templated checklist. Pairs with the built-in frontend-design skill for aesthetic direction.
---

# Finestics Design System

The goal of every UI change: it should look **custom-built, not AI-generated** —
simpler, less crowded, disciplined. Same theme, fewer decisions on screen.

Full rationale and the Dashboard worked example: `docs/UI_REDESIGN_BRIEF.md`.

## Use the canonical components — don't hand-roll

Import from `components/ui`. Reach for these before writing a bespoke card:

| Component | Use for |
|---|---|
| `Section` | the **only** way to add a screen section (keeps spacing + the ≤4 rule) |
| `HeroMetric` | the single hero number per screen + its trend |
| `StatInline` | a row of 2–3 label/value pairs (replaces grids of tinted cards) |
| `AttentionRow` | one actionable item; tinted only when it's a real alert |
| `ActionBar` | slim quick-action row, one primary |
| `TrendCard` / `AreaChart` / `Sparkline` | line/area trend (no axes/gridlines) |
| `BarChart` | vertical bar chart (e.g. order status) |
| `DonutChart` | pie/donut for proportions (e.g. payment status) |

Tokens live in `constants/design.ts` (`typo`, `fonts`, `radius`). Colors come from
`useThemeContext().colors` — never redefine them.

## Hard rules (enforced)

1. **Section budget.** Detail screens: ≤ 4 `Section`s. A home/overview screen (Dashboard)
   may go to ~6 if each is a distinct job and spacing breathes. If you need more, something
   belongs on another screen.
2. **No hex literals in screens/components.** Use `colors.*`. The retired accents
   (`#8b5cf6` purple, `#f59e0b` amber, `#3b82f6` blue, `#059669`) are banned.
3. **One accent.** `colors.primary` for emphasis/CTAs/active states. That's it.
4. **`success`/`error` are for money and deltas only** — money in / positive = `success`,
   money out / overdue / negative = `error`. Never decorative.
5. **One hero per screen.** One `HeroMetric` (or none). Not a wall of big numbers.
6. **Brand type for headings + numbers** via `typo.*` (`display`/`title`/`stat`/`num`);
   numbers get tabular figures automatically. Body text stays system.
7. **Icons: `MaterialCommunityIcons` only.** Migrate Ionicons/MaterialIcons when you touch a file.
8. **One section-label style** (`typo.eyebrow`, uppercase), used sparingly — not on every block.
9. **Charts:** one series each, no gridlines, no Y-axis clutter; line/area in `primary`
   (or `success` for collected). Rich charts live on Statistics, not the Dashboard.

## Banned "AI tells" (the look we're removing)

- Rainbow of `+15`/`+20` opacity accent tints, one per card.
- Grids of differently-styled stat cards with 3–4 competing font sizes.
- A section label (`QUICK ACTIONS`, `ATTENTION REQUIRED`) over every block.
- Gradient hero card with big-number + small-label + supporting stats (the template hero).
- Unused chart libraries / decorative charts that show nothing.

## Pre-finish checklist

Before declaring a UI change done, confirm:
- [ ] ≤ 4 `Section`s on the screen.
- [ ] Zero hex literals; all color via `colors.*`; no retired accents.
- [ ] At most one `HeroMetric`.
- [ ] `success`/`error` appear only on money or deltas.
- [ ] Headings/numbers use `typo.*`; money uses tabular figures.
- [ ] Icons are `MaterialCommunityIcons`.
- [ ] Any chart is single-series, axis-light.
- [ ] Ran a typecheck (`npx tsc --noEmit`) — no new errors.
