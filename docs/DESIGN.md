# Unified Justice Suite — Design System & UI/UX Guide (v1)

> **Status:** Draft v1. Companion to [`SPEC.md`](SPEC.md).
> **Theme engine (the concrete artifact this document explains):**
> [`packages/ui/src/styles/globals.css`](../packages/ui/src/styles/globals.css)

This is the aesthetic and interaction north star for the suite. It defines *how the
product should look and feel* and *how to build UI that stays consistent* as hundreds of
dense, form-heavy screens accrete across Law Enforcement, Prosecution, and Courts.

---

## 1. Design principles

1. **Data density over whitespace.** These are professional tools used all day by people
   who want *more* on screen, not less. Default to compact controls (28px), 13px base type,
   4px spacing grid, hairline borders. Whitespace is earned, not sprinkled.
2. **Dark-first.** The default theme is dark ("graphite"). Long shifts, low-light rooms,
   and reduced eye strain make dark the baseline; light is a first-class alternate, not the
   origin. `:root` *is* dark.
3. **Scannability beats decoration.** Hierarchy comes from weight, alignment, and a
   restrained accent — not from color noise, gradients, or shadows. Color is reserved to
   carry *meaning* (status, validation, workflow phase).
4. **Semantic, themeable tokens — never hard-coded color.** Every surface reads from a CSS
   variable (`--background`, `--primary`, `--destructive`, …). This is what makes "many
   alternate themes" a config change, not a rewrite.
5. **Keyboard-first, accessible-always.** Every action reachable without a mouse; a visible
   focus ring everywhere (even in dense grids); WCAG 2.1 AA contrast maintained in *every*
   theme, including compact density.
6. **Consistency is a feature.** One button, one input, one table, one status pill — reused
   everywhere. shadcn/ui gives us the primitives; we wrap them once in `packages/ui`.
7. **The form is the product.** Since forms are metadata-driven (see `SPEC.md` §5), the
   design system must make the *generated* controls (`PersonSelector`, `ChargeGrid`,
   `StatuteLookup`) look native and dense, because that is 80% of the UI.

---

## 2. Foundations

### 2.1 Color & theming architecture

Colors are authored in **OKLCH** (perceptual lightness) so alternate themes stay balanced
and generating new ones is predictable. Tokens are **semantic**, not literal — you style
with `bg-card` / `text-muted-foreground`, never `bg-[#1a1a1a]`.

**Token groups** (full list in `globals.css`):

| Group | Tokens | Use |
|---|---|---|
| Surfaces | `--background`, `--card`, `--popover`, `--sidebar` | Page, panels, menus, nav |
| Text | `--foreground`, `--muted-foreground`, `*-foreground` pairs | Primary vs. secondary text; always paired to its surface for contrast |
| Brand | `--primary`, `--accent`, `--secondary` | Primary actions, hovers, selected rows |
| Status | `--destructive`, `--success`, `--warning`, `--info` | Validation, workflow states, badges |
| Structure | `--border`, `--input`, `--ring` | Hairlines, field borders, focus |
| Data-viz | `--chart-1` … `--chart-5` | Categorical series (TanStack/Recharts) |

**How themes work.** `:root` holds the default **dark** palette. Each alternate theme is a
`[data-theme="name"]` block that overrides *only color tokens* — structural tokens (spacing,
type, radius) are untouched, so a theme change never reflows the layout.

```html
<html data-theme="amber">          <!-- switch color theme -->
<html data-theme="light" data-density="comfortable">
<html data-theme="system">         <!-- follow OS; dark-first, flips to light on request -->
<html>                             <!-- no attribute → default dark graphite -->
```

**Built-in themes:** `graphite` (default dark), `light` (paper), `midnight` (deep blue),
`nord` (cool slate/teal), `amber` (night-shift warmth), `high-contrast` (a11y). Switching is
one attribute on `<html>` — persist the user's choice and set it before first paint to avoid
a flash (inline the read in the document `<head>`).

**Adding a theme:** copy any `[data-theme="…"]` block, keep every token name, change only the
OKLCH values. Keep each `--x` / `--x-foreground` pair at ≥ 4.5:1 contrast (see §5).

### 2.2 Typography

- **Sans:** system UI stack (`--font-sans`). **Mono:** `--font-mono` for IDs, case numbers,
  statutes, timestamps, and any aligned numeric data.
- **Scale (dense):** base **13px** (`--text-base`), down to 10–11px for table meta, up to
  20px for page titles. Full scale in `globals.css`.
- **Numerics:** tabular, lining figures everywhere data aligns (`tabular-nums` is applied to
  tables and `[data-numeric]` automatically). Case numbers and statute codes use mono.
- **Weight, not size, for hierarchy** in dense views: 600 for headers/labels, 400 for body,
  `--muted-foreground` for secondary — avoid inflating font size.

### 2.3 Spacing, sizing & density

- **4px grid** (`--space-1`…`--space-8`). Compact by default.
- **Control heights:** 28px default, 24px inline/table, 36px primary CTA (`--control-h*`).
- **Row height:** 30px default (`--row-h`).
- **Density modes** (structural, color-independent):
  - default — compact (28px controls, 13px).
  - `[data-density="comfortable"]` — 36px controls, 14px, roomier gaps (touch / accessibility / presentation).
  - `[data-density="compact"]` — 26px rows, 12px (evidence logs, docket grids, power users).

### 2.4 Radius, borders, elevation

- **Radius** small (`--radius` 6px) for a crisp, technical feel; `sm/md/lg` derived.
- **Borders** are the primary structural device — hairline `--border` separates dense
  regions where whitespace would waste space.
- **Elevation** is subtle and used sparingly (popovers, dialogs, command palette). Prefer a
  border + slight `--shadow-sm` over heavy drop shadows; dark themes lean on surface
  lightness steps (`background` → `card` → `popover`) more than shadow.

### 2.5 Motion

Minimal and fast (`--motion-fast` 90ms, `--motion-base` 140ms, one easing). Motion confirms
state changes; it never gates a workflow. `prefers-reduced-motion` is honored globally.

---

## 3. Components (shadcn/ui)

We build on **shadcn/ui + Radix**, wrapped once in `packages/ui` so tokens and density apply
uniformly. Guidance for the high-traffic pieces:

- **Buttons.** `primary` for the one main action per view; `secondary`/`ghost` for the rest;
  `destructive` only for irreversible/legal-consequence actions (with confirm). Default size
  is compact (28px); `lg` (36px) for a page's primary CTA.
- **Inputs / selects / comboboxes.** 28px, `--input` border, `--ring` focus. Labels are
  12px `--muted-foreground` above the control. Validation errors use `--destructive` text +
  border, never color alone (include an icon/message) — see a11y.
- **Data tables (TanStack Table).** The workhorse. Use the `.data-grid` pattern in
  `globals.css`: sticky compact headers, 30px rows, hairline row borders, `--accent` hover,
  primary-tinted selection, `tabular-nums`. Right-align numerics; mono for IDs/case numbers;
  virtualize long lists.
- **Status pills.** Use the `.status--*` classes to map workflow/validation state to a
  semantic token (draft/review/approved/filed/rejected). One vocabulary suite-wide.
- **Dialogs / sheets / popovers.** `--popover` surface, `--shadow-md`. Sheets for
  side-panel detail (master–detail); dialogs for focused confirm/edit; popovers for pickers
  (`StatuteLookup`, `PersonSelector`).
- **Command palette (⌘K).** First-class navigation and action surface — jump to case,
  person, statute; run actions. Keyboard-first users should rarely touch the mouse.
- **Forms.** Rendered by the metadata engine (`SPEC.md` §5). The design system's job is to
  make the domain controls dense and native: `PersonSelector`, `OfficerSelector`,
  `StatuteLookup`, `ChargeGrid`, `EvidencePicker`, `AddressEditor`, `AttachmentField`,
  `RichTextField`. Repeatable collections (witnesses, charges) render as compact,
  add/remove/reorder card-rows, not sprawling stacked forms.

---

## 4. Layout patterns

- **App shell:** fixed left `--sidebar` nav (domain switch: LE / Prosecution / Courts),
  slim top bar (tenant/parish, global search/⌘K, user + theme/density switch), scrollable
  content. Nav collapses to icons for max content width.
- **Master–detail:** list/grid on the left, detail sheet/panel on the right — the dominant
  pattern for case lists, dockets, evidence logs. Keep the list dense and virtualized.
- **Case workspace:** a case is the spine (`SPEC.md` §4.1). Its workspace tabs the domains
  it has threaded (Incident · Charges · Parties · Evidence · Discovery · Docket · Documents),
  each backed by metadata forms and data grids.
- **Forms:** section-navigable (sticky section rail for 100–500-field forms), autosave
  indicator, workflow-state header (Draft → Supervisor → Filed) with the transition action
  as the primary button. Field-level permission state (readonly/hidden) is visually obvious.

---

## 5. Accessibility (non-negotiable, all themes)

- **Contrast:** every `--x` / `--x-foreground` pair meets **WCAG AA** (≥ 4.5:1 text, ≥ 3:1
  large text / UI borders) in every theme *and* every density. `high-contrast` exceeds AA.
- **Never color alone.** Status and validation always pair color with text/icon/shape.
- **Focus:** a visible `--ring` (`--ring-width`, 3px in high-contrast) on every interactive
  element; logical tab order; no keyboard traps.
- **Targets:** compact is the default, but honor `comfortable` density for touch/motor needs;
  min interactive target stays usable.
- **Motion & semantics:** `prefers-reduced-motion` honored; Radix gives us correct ARIA and
  roles — don't reinvent primitives.

---

## 6. Do / Don't

**Do**
- Read every color from a semantic token.
- Right-align and `tabular-nums` all numeric columns; mono for IDs/case numbers/statutes.
- Reserve accent + status colors for meaning.
- Test new UI in `graphite`, `light`, and `high-contrast` before shipping.

**Don't**
- Hard-code a hex/oklch color in a component.
- Use size inflation or heavy shadows to create hierarchy — use weight, alignment, borders.
- Convey status with color only.
- Add a bespoke one-off input/table/pill — extend the shared `packages/ui` primitive.

---

## 7. Where this lives

- **Theme engine / tokens:** [`packages/ui/src/styles/globals.css`](../packages/ui/src/styles/globals.css)
  — imported once at the app root (`apps/web/app/layout.tsx`).
- **Component wrappers:** `packages/ui/src/components/*` (shadcn/ui, tokenized).
- **Domain form controls:** `packages/form-controls/*` (see `SPEC.md` §5.2).
- **Theme/density switch + persistence:** app shell reads/writes `data-theme` and
  `data-density` on `<html>`, set before first paint to avoid FOUC.
