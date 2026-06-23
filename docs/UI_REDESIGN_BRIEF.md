# Finestics — UI Redesign Brief

> Status: **APPROVED — pilot built.** The `finestics-design` skill
> (`.claude/skills/finestics-design/`) and the vendor Dashboard are implemented and
> type-clean. Awaiting visual review on device, then rollout to Statistics + the rest.

## 1. Goal

Make the app feel **custom-built, not AI-generated**: simpler, less crowded, with a
disciplined visual system and better analytics. Same theme (slate/zinc light + dark),
same data, same features — reorganized and re-styled, not rebuilt.

Decisions locked with the owner:
- **Tooling:** a custom project skill (not a marketplace plugin).
- **Start:** vendor Dashboard as the pilot, then roll the pattern out.
- **Color:** restrained — neutrals + green/red for money only.
- **Direction:** **A — Focused / Hero** (one hero metric + sparkline, compact stat row,
  short attention list, slim action bar).

## 2. What reads as "AI-built" today (the banned list)

These are the specific tells we are removing. The skill will enforce each as a rule.

1. **Rainbow of accent tints.** Cards use green, purple `#8b5cf6`, amber `#f59e0b`,
   blue `#3b82f6`, `#059669`, red — each at `+15`/`+20` opacity. → **Banned.**
2. **Inline magic hex values** (`'#8b5cf6'`, `'#059669'`…) instead of theme tokens. → **Banned.**
3. **Too many sections per screen.** Dashboard stacks ~7. → **Cap at 4.**
4. **No canonical component.** Stat cards mix filled vs bordered styles and 4 font sizes
   (`3xl/2xl/xl/lg`). → **One `StatCard`, one type scale.**
5. **Uppercase muted labels on every block** (`QUICK ACTIONS`, `ATTENTION REQUIRED`…). →
   Keep at most one labeling style, used sparingly.
6. **Library installed but unused** (`react-native-gifted-charts`) — no real chart on the
   dashboard. → Add one purposeful chart.

## 3. Design tokens

Reuse the existing `ThemeProvider` palette — **no new theme.** What changes is the
*rules for using it*.

### Color roles (restrained)
| Role | Light | Dark | Used for |
|---|---|---|---|
| `background` | `#F9FAFB` | `#09090B` | screen bg |
| `card` | `#FFFFFF` | `#18181B` | surfaces |
| `text` | `#111827` | `#FAFAFA` | primary text |
| `muted` | `#94a3b8` | `#71717A` | secondary text, labels |
| `border` | `#E5E7EB` | `#27272A` | hairlines, card outlines |
| `primary` | `#0F172A` | `#52525B` | the **one** accent: hero bg, CTAs, active states |
| `success` | `#10B981` | money **in** / positive deltas **only** |
| `error` | `#EF4444` | money **out** / negative deltas / overdue **only** |

**Rules**
- Purple/amber/blue accents are **retired** from the dashboard. Status that needs
  differentiation (order statuses) uses **neutral chips + one shape/weight cue**, not 6 colors.
- `success`/`error` are reserved for signed money and deltas. Never decorative.
- Never write a hex literal in a screen — always `colors.*`.

### Type scale (only these)
| Token | Class | Font | Use |
|---|---|---|---|
| Display | `text-4xl font-bold` | **brand** | the single hero number |
| Title | `text-xl font-semibold` | **brand** | screen title |
| Stat | `text-lg font-semibold` | **brand** (tabular) | stat-row values, all money |
| Body | `text-sm` | system | labels, list rows |
| Caption | `text-xs` | system | secondary captions, units |

**Brand font:** one geometric/neutral family loaded via `expo-font`, used for
headings + all numbers (with **tabular figures** so money columns align). Body text stays
system for native feel. Proposed default: **Plus Jakarta Sans** (professional, slightly
distinctive); alternates: *Sora*, *Manrope*. Swappable — say the word if you prefer one.

### Icons
Standardize on **MaterialCommunityIcons** everywhere (the nav already uses it). Retire the
Ionicons/MaterialIcons mix as screens are touched. One family = consistent stroke weight.

### Spacing & shape
- Screen padding: `px-4`. Section gap: `mt-6` (more air than today's `py-3`).
- Card radius: `rounded-2xl`. Card padding: `p-4`. Hairline borders only (`1px`, `colors.border`).
- No nested colored pills inside colored cards (a current crowding source).

## 4. Canonical components (the reusable set the skill ships)

Built once, used everywhere. All consume `colors` from `useThemeContext`.

1. **`Section`** — optional small muted title + `mt-6` spacing wrapper. The *only* way to
   add a section, which is how the "max 4" rule stays enforceable.
2. **`HeroMetric`** — big label, Display number, signed delta (green/red), embedded
   sparkline. `primary` background, white text. One per screen, top.
3. **`StatInline`** — a row of 2–3 label/value pairs separated by space, no borders
   (replaces the 6-card metric grid).
4. **`AttentionRow`** — icon + title + subtitle + chevron, tappable. Tinted only when it's
   a real alert (overdue = `error`, pending = `muted`).
5. **`ActionBar`** — slim row of icon+label quick actions (New Order / Collection / more).
6. **`Sparkline` / `TrendChart`** — thin wrapper over `gifted-charts` with the house style
   (see §6). Single series, no gridlines.

## 5. Dashboard (Direction A) — exact spec

**Data already available** (`fetchDashboardStats` + `fetchSalesTrend`). No new fields required.

Layout, top → bottom (4 sections max):

```
Header        Title "Dashboard" + date  ·  [Today ▾] preset (compact, right-aligned)
─ Section 1 ─ HeroMetric: NET PROFIT (range) + netMargin% + signed delta
              embedded Sparkline = real sales trend (fetchSalesTrend, last 7d)
              StatInline below: Sales · Collected · Orders
─ Section 2 ─ NEEDS ATTENTION: pending orders → Orders(pending);
              outstanding → Orders(unpaid). Rows hidden when zero.
─ Section 3 ─ ActionBar: + Order · Collection · ⋯(more)
```

**What gets removed / relocated** (de-crowding — nothing is lost, it moves):
- **6-metric grid** (Sales/Collected/Gross/Expenses/Net cards) → hero + `StatInline`;
  full breakdown lives on **Statistics**.
- **Period Summary (week/month)** → **Statistics** screen (it already shows detail).
- **Order Status chips (6 colors)** → **Statistics** (with the donut/bars).
- **Customers block** → **Statistics** / Customers screen.
- **Completed Orders card** → folded into Needs Attention only if actionable; else dropped.

Net effect: Dashboard goes from ~7 *cluttered* sections to a small set of *distinct-job*
sections — "what's my bottom line, what needs me, what do I do next."

**Update (Dribbble refactor):** the shipped Dashboard expands Direction A into a fuller
overview home (still disciplined): personalized `GreetingHeader` → hero (net profit) with a
Gross/Expenses ledger footer → horizontal `MetricChip` KPI strip → Needs attention →
Quick actions → `TrendCard` (custom SVG area chart) → Recent orders list. New canonical
components: `GreetingHeader`, `MetricChip`, `TrendCard`, `AreaChart`, `ListRow`. Home
screens may run to ~6 sections (see SKILL §1).

## 6. Chart / analytics rules

The "better graphs" goal = **fewer, cleaner, purposeful** charts — not more.
- One series per chart. No gridlines, no Y-axis clutter; label endpoints only.
- Line/area in `primary` (or `success` for collected). Thin stroke, soft fill.
- Sparkline in the hero is decorative-but-real (true 7-day sales), height ~40px, no axes.
- Rich charts (status donut, sales-by-day bars, top products) live on **Statistics**,
  styled by the same `TrendChart` house rules so the two screens feel related.

## 7. The skill

- **Location:** `.claude/skills/finestics-design/SKILL.md` (+ optional `components/` snippets).
- **Contents:** §2 banned list, §3 tokens, §4 component contracts, §6 chart rules, and a
  checklist the model runs before finishing any UI edit ("≤4 sections? no hex literals?
  one hero? success/error only on money?").
- **Invocation:** `/finestics-design` (or auto-surfaced) whenever building/reshaping a screen.
- Folds in the built-in `frontend-design` anti-templated principles by reference.

## 8. Decisions (resolved)

1. **Hero metric:** ✅ **Net Profit** + margin%, with a real **7-day sales** sparkline
   (captioned). No backend work now; a true profit-trend line is a later optional backend add.
2. **Relocation target:** ✅ Removed blocks move to the existing **Statistics** screen,
   redesigned next with the same system. Dashboard = action, Statistics = analysis.
3. **Icons:** ✅ Standardize on **MaterialCommunityIcons**.
4. **Typeface:** ✅ Add **one brand font** (proposed: Plus Jakarta Sans) for headings +
   numbers; system font for body.

## 9. Build order (on approval)

1. `finestics-design` skill (tokens, components, rules, checklist).
2. Brand font wiring (`expo-font`) + the 6 canonical components.
3. Vendor **Dashboard** rebuilt on the system (the pilot).
4. Review → lock → roll out to **Statistics**, then the rest.
```
