# VINDEX LEGAL — Internal App Redesign

Date: 2026-08-16
Status: Approved, ready for implementation planning

## Purpose

Replace `vindexapp-frontend`'s current "paper archive / ledger" visual identity
(cream paper, ink, muted burgundy, Fraunces/Inter/JetBrains Mono) with the real
VINDEX LEGAL brand system: structural black, silver metallic accent, Lato
typography, sharp geometry. Presentation-layer only — no changes to routes,
data fetching, or `src/api/*.ts` contracts.

## Brand tokens (source of truth)

| Token | Hex | Use |
|---|---|---|
| `structural-black` | `#07090C` | Dominant background (~70%) |
| `graphite` | `#15181E` | Card/panel surfaces |
| `white` | `#FFFFFF` | Primary text on black |
| `silver` | `#C7CCD3` | Primary accent — CTAs, active states, focus rings, key lines |
| `silver-deep` | `#8B929C` | Hover/pressed states |
| `text-gray` | `#3A3F47` | Body text on white surfaces (rare) |
| `text-gray-light` | `#6B7280` | Secondary/caption text |
| `line` | `#2A2E36` | Borders, dividers |

Semantic status (disclosed departure from brand manual, used only for status badges):
success/Activo/Firmado `#6B8F71`, warning/Potencial/Enviado `#B08D57`,
neutral-negative/Inactivo/Vencido/Rechazado `#8B929C` (silver-deep).

Typography: Lato via `@fontsource/lato` (100/300/400/700/900), self-hosted.
Black/Bold uppercase wide-tracking for wordmark/headers, Regular for body
(min 14px, 140–150% line-height), Light/Thin for captions/metadata.
JetBrains Mono retained for data values only (case/folio numbers, currency,
dates, file sizes).

Shape: sharp, 2–6px radius everywhere (shadcn default overridden).

Signature move: metallic chrome gradient (silver → silver-deep → silver,
~135deg) reused consistently on: sidebar active-nav indicator, primary CTA
focus rings, document upload progress fill, folio/index badges. Nowhere else.

## Logo

Real brand assets found at repo root, previously unreferenced in code:
- `vindex-isologo.png` — full lockup (chrome V mark + "VINDEX LEGAL" wordmark
  + rule line). **Decision: use this as the sidebar header**, moved to
  `src/assets/`, resized/compressed from source (~700–900KB uncompressed).
- `vindex-isotipo.png` — V mark alone. Reserved for favicon / loading-state
  mark use.

## Stack additions

- Tailwind v4 via `@tailwindcss/vite` (no PostCSS config needed), brand
  palette as `@theme` tokens, Lato as default sans, radius scale capped at 6px.
- shadcn/ui, dark-mode-only (no light/dark toggle — one visual identity).
  Init with neutral base then override every token to VINDEX palette.
  Components used: Button, Input, Select, Textarea, Card, Badge, Dialog,
  Skeleton, Progress.
- `@fontsource/lato`, self-hosted (no Google Fonts CDN call).
- Framer Motion: page-level route transition (fade + small rise), staggered
  list-row entrance, hover/press micro-interactions, respecting
  `prefers-reduced-motion` throughout.

## PanelDocumentos: new metaphor

Chosen direction: **secure vault / chain-of-custody**, not literal ledger.
Documents are sealed evidence under custody — each row reads like a
custody-chain entry (folio number retained as case-file reference, not a
paper-register entry). Dropzone framed as an intake/ingestion slot with a
scan-line sheen on hover. Upload progress reads as a verification/processing
bar using the signature chrome gradient. Existing "new document just
archived" entrance animation is kept but modernized via Framer Motion.

## Shared primitives (new, extracted from duplicated inline styles)

Currently every list page (Clientes, Expedientes, Presupuestos, Agenda)
duplicates: page header (title + count + "+ Nuevo X" CTA), numbered row
(accent divider + index badge + label/metadata + actions + status badge),
dashed empty-state box, error banner (inconsistently hardcodes `#fdf1ef` in
some files), and "Cargando…" loading text. Build once in `componentes/`:
- `PageHeader`, `Row` (index/folio badge + divider + content slot + actions),
  `EmptyState`, `ErrorBanner`, and content-shaped `Skeleton` loaders replacing
  every "Cargando…" text.
- `EstadoBadge` is already duplicated per-page with slightly different color
  maps (Clientes/Presupuestos/Agenda each define their own) — consolidate
  into one component taking a status-color map prop, preserving each page's
  existing status vocabulary.

## Native dialogs → shadcn Dialog

- `Expedientes.tsx` `window.prompt` (motivo de baja) → Dialog with Textarea,
  same optional-motivo semantics.
- `Presupuestos.tsx` `window.confirm` (delete) → Dialog with confirm/cancel,
  same "cannot be undone" copy.

## Execution order (checkpointed, screenshot + self-critique after each)

1. Stack setup: Tailwind, shadcn init, Framer Motion, Lato font loading.
2. `Layout.tsx` + `Clientes.tsx` — first sign-off checkpoint.
3. `ExpedienteDetalle.tsx` + `PanelDocumentos.tsx` (most complex — file upload flow).
4. `Expedientes.tsx`
5. `ClienteDetalle.tsx`
6. `Presupuestos.tsx`
7. `Agenda.tsx`
8. `Liquidaciones.tsx`

## Non-negotiables

- No Spanish copy/label changes, except flagging (not changing) any leftover
  "archivo/ficha" paper-metaphor wording that no longer fits — surface these,
  don't silently reword.
- Don't touch `src/api/*.ts` request/response contracts (type tweaks OK if a
  shadcn component needs a slightly different prop shape).
- Don't rename routes or change what/when data is fetched.
- Every interactive element gets a visible focus state using the signature
  chrome treatment.
- Respect `prefers-reduced-motion` for all Framer Motion usage.
- No commits/pushes — user reviews locally before anything is committed.
