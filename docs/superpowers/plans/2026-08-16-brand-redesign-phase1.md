# VINDEX LEGAL Redesign — Phase 1: Stack Setup + Layout + Clientes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Install and configure Tailwind v4, shadcn/ui, Framer Motion, and Lato; wire the real VINDEX LEGAL logo assets in; rebuild `Layout.tsx` and `Clientes.tsx` (plus its child `FormularioCliente.tsx`) on the new structural-black/silver brand system as the first sign-off checkpoint.

**Architecture:** Additive stack setup (no existing behavior changes) followed by a from-scratch visual rebuild of two files that keeps every existing prop/data contract intact. New shared primitives (`PageHeader`, `Row`, `EmptyState`, `ErrorBanner`, `EstadoBadge`, skeletons) are extracted here since Clientes is the first consumer, and get reused by every later screen.

**Tech Stack:** Vite 8, React 19, TypeScript 5.7, Tailwind v4 (`@tailwindcss/vite`), shadcn/ui (dark-only), Framer Motion, `@fontsource/lato`.

**Spec:** `docs/superpowers/specs/2026-08-16-brand-redesign-design.md`

## Global Constraints

- No Spanish copy/label changes (flag, don't silently reword, any leftover "archivo/ficha" paper-metaphor wording).
- Don't touch `src/api/*.ts` request/response contracts (type tweaks OK for shadcn prop shapes).
- Don't rename routes or change what/when data is fetched.
- Colors are exact hex from the spec table — no invented shades.
- Radius scale capped at 6px everywhere (override shadcn defaults).
- Every interactive element needs a visible focus state using the signature chrome gradient (silver → silver-deep → silver, ~135deg).
- Respect `prefers-reduced-motion` for all Framer Motion usage.
- No commits beyond what each task step specifies; no pushes at all.
- "Test" in this plan means: `npm run build` (tsc + vite build) passes with zero errors, and a screenshot via the `run` skill confirms the rendered result — there is no existing test runner in this repo and none is being added for a presentation-layer change.

---

### Task 1: Install and configure Tailwind v4 + Lato font

**Files:**
- Modify: `package.json` (add deps)
- Modify: `vite.config.ts`
- Create: `src/estilos.css` (replace entire contents — Tailwind import + `@theme` tokens)
- Modify: `src/main.tsx` (font import if needed)
- Modify: `index.html` (remove old Google Fonts `<link>` tags for Fraunces/Inter/JetBrains Mono... keep JetBrains Mono, drop Fraunces/Inter)

**Interfaces:**
- Produces: Tailwind utility classes available in all `.tsx` files; CSS custom properties `--color-structural-black`, `--color-graphite`, `--color-white`, `--color-silver`, `--color-silver-deep`, `--color-text-gray`, `--color-text-gray-light`, `--color-line`, `--color-success`, `--color-warning`, `--color-neutral-negative` available via Tailwind's `@theme` (usable as `bg-structural-black`, `text-silver`, etc.); `font-sans` = Lato, `font-mono` = JetBrains Mono retained.

- [ ] **Step 1: Install dependencies**

```bash
npm install tailwindcss @tailwindcss/vite @fontsource/lato framer-motion
```

- [ ] **Step 2: Register the Tailwind Vite plugin**

Edit `vite.config.ts` to add the plugin:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173 },
})
```

- [ ] **Step 3: Replace `src/estilos.css` entirely**

```css
@import "tailwindcss";

@theme {
  --color-structural-black: #07090C;
  --color-graphite: #15181E;
  --color-white: #FFFFFF;
  --color-silver: #C7CCD3;
  --color-silver-deep: #8B929C;
  --color-text-gray: #3A3F47;
  --color-text-gray-light: #6B7280;
  --color-line: #2A2E36;

  --color-success: #6B8F71;
  --color-warning: #B08D57;
  --color-neutral-negative: #8B929C;

  --font-sans: "Lato", -apple-system, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;

  --radius-sharp: 0.125rem;
  --radius-md: 0.25rem;
  --radius-lg: 0.375rem;
}

html, body, #root {
  height: 100%;
  margin: 0;
}

body {
  background: var(--color-structural-black);
  color: var(--color-white);
  font-family: var(--font-sans);
  font-size: 14px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

button { font-family: inherit; cursor: pointer; }
input, select, textarea { font-family: inherit; font-size: 14px; }

:focus-visible {
  outline: 2px solid var(--color-silver);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}
```

- [ ] **Step 4: Import Lato weights in `src/main.tsx`**

Add at the top of `src/main.tsx` (above existing imports):

```ts
import '@fontsource/lato/100.css'
import '@fontsource/lato/300.css'
import '@fontsource/lato/400.css'
import '@fontsource/lato/700.css'
import '@fontsource/lato/900.css'
```

- [ ] **Step 5: Remove the old Fraunces/Inter Google Fonts `<link>` tags from `index.html`**

Keep any existing JetBrains Mono `<link>` if present (mono is retained for data values); delete the Fraunces and Inter `<link>`/`<link rel="preconnect">` tags.

- [ ] **Step 6: Verify the build**

Run: `npm run build`
Expected: exits 0, no TypeScript or Vite errors. (Tailwind utility classes aren't used anywhere yet, so this only proves the toolchain wires up cleanly.)

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json vite.config.ts src/estilos.css src/main.tsx index.html
git commit -m "chore: add Tailwind v4, Lato, Framer Motion; replace paper-archive tokens with VINDEX brand tokens"
```

---

### Task 2: shadcn/ui init with VINDEX theme overrides

**Files:**
- Create: `components.json`
- Create: `src/lib/utils.ts` (shadcn's `cn()` helper)
- Create: `src/componentes/ui/button.tsx`, `input.tsx`, `select.tsx`, `textarea.tsx`, `card.tsx`, `badge.tsx`, `dialog.tsx`, `skeleton.tsx`, `progress.tsx` (via shadcn CLI, then hand-edited for theme)

**Interfaces:**
- Produces: `Button`, `Input`, `Select`/`SelectTrigger`/`SelectContent`/`SelectItem`, `Textarea`, `Card`/`CardHeader`/`CardContent`, `Badge`, `Dialog`/`DialogTrigger`/`DialogContent`/`DialogHeader`/`DialogFooter`, `Skeleton`, `Progress` — all importable from `@/componentes/ui/<name>`, all defaulting to dark/VINDEX styling with no light-mode variant.

- [ ] **Step 1: Add path alias for `@/*`**

In `tsconfig.json` compilerOptions, add:

```json
"baseUrl": ".",
"paths": { "@/*": ["./src/*"] }
```

In `vite.config.ts`, add resolve alias:

```ts
import path from 'path'
// inside defineConfig:
resolve: { alias: { '@': path.resolve(__dirname, './src') } },
```

- [ ] **Step 2: Run shadcn init**

```bash
npx shadcn@latest init -d --base-color neutral --css-variables
```

If prompted interactively despite `-d`, answer: TypeScript yes, style "New York", CSS variables yes, `src/estilos.css` as the CSS file, `@/componentes/ui` as the components alias, `@/lib/utils` as utils alias.

- [ ] **Step 3: Add the required components**

```bash
npx shadcn@latest add button input select textarea card badge dialog skeleton progress
```

- [ ] **Step 4: Override generated theme tokens in `src/estilos.css`**

In the `:root` block shadcn generated (or by adding a dark-only override block since this app is dark-only — no `.dark` class toggle, the tokens themselves ARE the dark values), set:

```css
:root {
  --background: var(--color-structural-black);
  --foreground: var(--color-white);
  --card: var(--color-graphite);
  --card-foreground: var(--color-white);
  --popover: var(--color-graphite);
  --popover-foreground: var(--color-white);
  --primary: var(--color-silver);
  --primary-foreground: var(--color-structural-black);
  --secondary: var(--color-graphite);
  --secondary-foreground: var(--color-white);
  --muted: var(--color-graphite);
  --muted-foreground: var(--color-text-gray-light);
  --accent: var(--color-silver-deep);
  --accent-foreground: var(--color-structural-black);
  --destructive: var(--color-warning);
  --border: var(--color-line);
  --input: var(--color-line);
  --ring: var(--color-silver);
  --radius: 0.25rem;
}
```

Delete any `.dark { ... }` block the generator created — this app has one theme, defined directly on `:root`.

- [ ] **Step 5: Verify the build**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 6: Commit**

```bash
git add components.json tsconfig.json vite.config.ts src/lib src/componentes/ui src/estilos.css
git commit -m "chore: init shadcn/ui with VINDEX dark theme tokens and sharp radius"
```

---

### Task 3: Logo assets into `src/assets/`

**Files:**
- Create: `src/assets/vindex-isologo.png` (optimized copy of repo-root asset)
- Create: `src/assets/vindex-isotipo.png` (optimized copy of repo-root asset)

**Interfaces:**
- Produces: two importable image assets at `src/assets/vindex-isologo.png` and `src/assets/vindex-isotipo.png`, sized appropriately for a 220px-wide sidebar header (isologo) and favicon-scale use (isotipo).

- [ ] **Step 1: Copy and resize the isologo**

The source `vindex-isologo.png` at repo root is ~875KB, sized wide (full lockup with generous padding). Resize to a max-width of 640px (2x for retina at ~320px display width) and re-export as PNG with compression, or convert to WebP if broadly supported target (this is an internal Chromium-based tool, WebP is safe). Use any available image tool (`npx sharp-cli` if installed, or ImageMagick if available in the environment); if no tool is available, copy the file as-is to `src/assets/` and note the size concern for a later optimization pass rather than blocking this task.

```bash
node -e "
const sharp = require('sharp');
sharp('vindex-isologo.png').resize({ width: 640 }).png({ quality: 90, compressionLevel: 9 }).toFile('src/assets/vindex-isologo.png');
sharp('vindex-isotipo.png').resize({ width: 256 }).png({ quality: 90, compressionLevel: 9 }).toFile('src/assets/vindex-isotipo.png');
" 2>/dev/null || (mkdir -p src/assets && cp vindex-isologo.png vindex-isotipo.png src/assets/)
```

- [ ] **Step 2: Verify files exist and are reasonably sized**

Run: `ls -la src/assets/`
Expected: both files present; if the sharp resize ran, each should be well under 200KB.

- [ ] **Step 3: Commit**

```bash
git add src/assets/vindex-isologo.png src/assets/vindex-isotipo.png
git commit -m "feat: add VINDEX LEGAL logo assets to src/assets"
```

---

### Task 4: Shared primitives — `PageHeader`, `Row`, `EmptyState`, `ErrorBanner`, `EstadoBadge`, list-row skeleton

**Files:**
- Create: `src/componentes/PageHeader.tsx`
- Create: `src/componentes/Row.tsx`
- Create: `src/componentes/EmptyState.tsx`
- Create: `src/componentes/ErrorBanner.tsx`
- Create: `src/componentes/EstadoBadge.tsx`
- Create: `src/componentes/ListSkeleton.tsx`

**Interfaces:**
- Consumes: `Badge` from `@/componentes/ui/badge`, `Skeleton` from `@/componentes/ui/skeleton`, Framer Motion `motion`.
- Produces:
  - `PageHeader({ title, count, ctaLabel, onCta, ctaDisabled }: { title: string; count: number; ctaLabel: string; onCta: () => void; ctaDisabled?: boolean })` — title + "(count)" + a primary Button styled with the chrome-gradient signature on hover/focus.
  - `Row({ index, to, children, actions }: { index: number; to: string; children: React.ReactNode; actions?: React.ReactNode })` — wraps a `Link`, renders a zero-padded index badge (mono font, chrome-gradient border), a silver-deep divider bar, a content slot (`children`), and a right-aligned `actions` slot. Wrapped in `motion.div` for stagger entrance (see Task 6).
  - `EmptyState({ message }: { message: string })` — dashed `--color-line` border box, centered text-gray-light message.
  - `ErrorBanner({ message }: { message: string })` — graphite surface, warning-colored left border and text, replaces every hardcoded `#fdf1ef` banner.
  - `EstadoBadge({ estado, colorMap }: { estado: string; colorMap: Record<string, 'success' | 'warning' | 'neutral'> })` — thin wrapper over shadcn `Badge` mapping the 3 semantic tones to the spec's success/warning/neutral-negative colors; each page passes its own `colorMap` (Clientes: Activo→success, Potencial→warning, Inactivo→neutral) so existing status vocab per page is preserved exactly.
  - `ListSkeleton({ rows }: { rows: number })` — renders `rows` shadcn `Skeleton` blocks shaped like a `Row` (index-badge-sized skeleton + two text-line skeletons), replaces "Cargando…" text.

- [ ] **Step 1: Write `EstadoBadge.tsx`**

```tsx
import { Badge } from '@/componentes/ui/badge'

type Tono = 'success' | 'warning' | 'neutral'

const TONO_CLASES: Record<Tono, string> = {
  success: 'bg-transparent border-success text-success',
  warning: 'bg-transparent border-warning text-warning',
  neutral: 'bg-transparent border-silver-deep text-silver-deep',
}

export function EstadoBadge({
  estado,
  colorMap,
}: {
  estado: string
  colorMap: Record<string, Tono>
}) {
  const tono = colorMap[estado] ?? 'neutral'
  return (
    <Badge variant="outline" className={`rounded-sharp uppercase tracking-wide text-xs font-bold ${TONO_CLASES[tono]}`}>
      {estado}
    </Badge>
  )
}
```

- [ ] **Step 2: Write `ErrorBanner.tsx`**

```tsx
export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="bg-graphite border-l-2 border-warning text-warning px-4 py-3 rounded-sharp text-sm">
      {message}
    </div>
  )
}
```

- [ ] **Step 3: Write `EmptyState.tsx`**

```tsx
export function EmptyState({ message }: { message: string }) {
  return (
    <div className="border border-dashed border-line rounded-sharp py-12 px-6 text-center text-text-gray-light">
      {message}
    </div>
  )
}
```

- [ ] **Step 4: Write `ListSkeleton.tsx`**

```tsx
import { Skeleton } from '@/componentes/ui/skeleton'

export function ListSkeleton({ rows }: { rows: number }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-4 border-b border-line">
          <Skeleton className="h-8 w-8 rounded-sharp shrink-0" />
          <div className="flex-1 flex flex-col gap-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 5: Write `PageHeader.tsx`**

```tsx
import { Button } from '@/componentes/ui/button'

export function PageHeader({
  title,
  count,
  ctaLabel,
  onCta,
  ctaDisabled,
}: {
  title: string
  count: number
  ctaLabel: string
  onCta: () => void
  ctaDisabled?: boolean
}) {
  return (
    <div className="flex items-center justify-between mb-8">
      <h1 className="text-2xl font-black uppercase tracking-wide text-white">
        {title} <span className="text-text-gray-light font-normal normal-case tracking-normal">({count})</span>
      </h1>
      <Button
        onClick={onCta}
        disabled={ctaDisabled}
        className="rounded-sharp bg-gradient-to-br from-silver via-silver-deep to-silver text-structural-black font-bold hover:brightness-110 focus-visible:ring-2 focus-visible:ring-silver"
      >
        {ctaLabel}
      </Button>
    </div>
  )
}
```

- [ ] **Step 6: Write `Row.tsx`**

```tsx
import { Link } from 'react-router'
import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

export function Row({
  index,
  to,
  children,
  actions,
}: {
  index: number
  to: string
  children: ReactNode
  actions?: ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-center gap-4 py-4 border-b border-line group"
    >
      <span className="font-mono text-xs text-silver-deep border border-line rounded-sharp w-8 h-8 flex items-center justify-center shrink-0 group-hover:border-silver transition-colors">
        {String(index).padStart(2, '0')}
      </span>
      <Link to={to} className="flex-1 min-w-0 flex flex-col gap-0.5 focus-visible:outline-none">
        {children}
      </Link>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </motion.div>
  )
}
```

- [ ] **Step 7: Verify the build**

Run: `npm run build`
Expected: exits 0. (These files aren't consumed yet — this only proves they typecheck standalone.)

- [ ] **Step 8: Commit**

```bash
git add src/componentes/PageHeader.tsx src/componentes/Row.tsx src/componentes/EmptyState.tsx src/componentes/ErrorBanner.tsx src/componentes/EstadoBadge.tsx src/componentes/ListSkeleton.tsx
git commit -m "feat: add shared list-page primitives (PageHeader, Row, EmptyState, ErrorBanner, EstadoBadge, ListSkeleton)"
```

---

### Task 5: Rebuild `Layout.tsx` on the brand system

**Files:**
- Modify: `src/componentes/Layout.tsx` (full rewrite of styling, same structure/props/routes)

**Interfaces:**
- Consumes: `vindex-isologo.png` from `src/assets/` (Task 3), Framer Motion `motion`/`AnimatePresence`, `useLocation` from `react-router`.
- Produces: unchanged public behavior (same `SECCIONES` nav list, same `<Outlet/>` render point) — only the visual layer and a page-transition wrapper around `Outlet` change. Later tasks (screens 3–8) render inside this unchanged outlet, so its contract to children is identical to today.

- [ ] **Step 1: Rewrite the sidebar header to use the logo asset**

Replace the current text-only wordmark block with:

```tsx
import logo from '@/assets/vindex-isologo.png'
// ...
<div className="px-6 py-8">
  <img src={logo} alt="VINDEX LEGAL" className="w-full max-w-[176px]" />
  <p className="mt-3 font-mono text-[10px] tracking-[0.2em] text-text-gray-light uppercase">
    Gestión interna
  </p>
</div>
```

- [ ] **Step 2: Rebuild nav with the chrome-gradient active indicator**

Each `NavLink` gets a `className` function so the active state can render a left-rail gradient bar instead of a flat fill:

```tsx
<NavLink
  to={seccion.ruta}
  className={({ isActive }) =>
    `relative flex items-center px-6 py-3 text-sm transition-colors ${
      isActive ? 'text-white font-bold' : 'text-text-gray-light hover:text-white'
    }`
  }
>
  {({ isActive }) => (
    <>
      {isActive && (
        <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-silver via-silver-deep to-silver" />
      )}
      {seccion.etiqueta}
    </>
  )}
</NavLink>
```

- [ ] **Step 3: Set sidebar/content container colors and wrap `Outlet` in a page transition**

```tsx
import { AnimatePresence, motion } from 'framer-motion'
import { useLocation, Outlet } from 'react-router'

// inside component:
const location = useLocation()

return (
  <div className="flex min-h-screen bg-structural-black">
    <aside className="w-[220px] shrink-0 border-r border-line bg-graphite">
      {/* header + nav from steps 1-2 */}
    </aside>
    <main className="flex-1 max-w-[1100px] px-10 py-8">
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
    </main>
  </div>
)
```

Note: `prefers-reduced-motion` is handled globally by the CSS rule added in Task 1 Step 3 (`* { animation: none !important; transition: none !important; }`), which also suppresses Framer Motion's transform/opacity transitions since Framer applies them via inline styles animated through the Web Animations API — confirm this actually suppresses it during Step 5 verification below; if it doesn't, wrap the transition values in a `useReducedMotion()` check from `framer-motion` instead.

- [ ] **Step 4: Remove all inline `style={{}}` objects and the old `SECCIONES`-adjacent styling constants**

Delete any leftover inline style objects/constants from the pre-redesign file that are no longer referenced.

- [ ] **Step 5: Verify — build, run, screenshot, check reduced-motion**

Run: `npm run build` — expected exit 0.
Then use the `run` skill to start the dev server and screenshot `/clientes` (Clientes.tsx isn't rebuilt yet, so it'll look broken/unstyled — that's expected here; this step is only to confirm the Layout shell — sidebar, logo, nav, active-state gradient — renders correctly and the route transition plays).
Toggle `prefers-reduced-motion: reduce` in Chrome DevTools rendering tab and confirm the route transition no longer animates.

- [ ] **Step 6: Commit**

```bash
git add src/componentes/Layout.tsx
git commit -m "feat: rebuild Layout on VINDEX brand system with logo, chrome nav indicator, route transitions"
```

---

### Task 6: Rebuild `Clientes.tsx` and `FormularioCliente.tsx` — checkpoint screen

**Files:**
- Modify: `src/paginas/Clientes.tsx` (full visual rewrite, same data-fetching/state logic)
- Modify: `src/componentes/FormularioCliente.tsx` (swap inline styles for shadcn `Input`/`Textarea`/`Button`, same fields/validation/submit logic)

**Interfaces:**
- Consumes: `PageHeader`, `Row`, `EmptyState`, `ErrorBanner`, `EstadoBadge`, `ListSkeleton` (Task 4); `Input`, `Textarea`, `Button` from `@/componentes/ui/*` (Task 2); `motion` from `framer-motion` for list stagger.
- Produces: no change to exported shape (`Clientes` remains the default export used by `rutas.tsx`; `FormularioCliente` keeps its existing `{ cliente?, onGuardado, onCancelar? }` prop contract used by `ClienteDetalle.tsx` later).

- [ ] **Step 1: Replace the loading state**

Wherever `Clientes.tsx` currently renders literal `"Cargando…"` text, render `<ListSkeleton rows={6} />` instead.

- [ ] **Step 2: Replace the error banner**

Replace the current inline-styled error `<div>` with `<ErrorBanner message={error} />`.

- [ ] **Step 3: Replace the header block**

Replace the current title/count/"+ Nuevo cliente" inline-styled header with:

```tsx
<PageHeader
  title="Clientes"
  count={clientes.length}
  ctaLabel={mostrarFormulario ? 'Cancelar' : '+ Nuevo cliente'}
  onCta={() => setMostrarFormulario((v) => !v)}
/>
```

(Preserve whatever the existing state variable is named for the form-toggle boolean — use its real name instead of `mostrarFormulario` if different.)

- [ ] **Step 4: Replace the empty state**

Replace the dashed-box empty state with `<EmptyState message="..." />`, keeping the exact existing Spanish message text.

- [ ] **Step 5: Replace `FilaCliente` internals with `Row`, add list stagger**

```tsx
<motion.div
  initial="hidden"
  animate="show"
  variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
>
  {clientes.map((cliente, i) => (
    <Row key={cliente.id} index={i + 1} to={`/clientes/${cliente.id}`}>
      <span className="font-bold text-white">{cliente.apellido}, {cliente.nombre}</span>
      <span className="text-xs text-text-gray-light font-mono">{cliente.dni} · {cliente.whatsapp}</span>
      <EstadoBadge
        estado={cliente.estado}
        colorMap={{ Activo: 'success', Potencial: 'warning', Inactivo: 'neutral' }}
      />
    </Row>
  ))}
</motion.div>
```

Keep the exact field names from the existing `cliente` type (`apellido`, `nombre`, `dni`, `whatsapp`, `estado`) — do not rename or invent fields; if any of these differ from what's actually in `src/api/cliente.ts`'s type, use the real field names.

- [ ] **Step 6: Rebuild `FormularioCliente.tsx` with shadcn inputs**

Swap every `<input style={{...}}>` for `<Input className="rounded-sharp bg-graphite border-line" ...>` (same `name`/`value`/`onChange`/`required` props, unchanged), swap the notas `<textarea>` for shadcn `Textarea`, swap the submit/cancel buttons for shadcn `Button` (submit uses the same chrome-gradient treatment as `PageHeader`'s CTA; cancel uses `variant="ghost"`). Do not change field order, labels, or required-ness — only the rendering primitive.

- [ ] **Step 7: Verify — build, run, screenshot**

Run: `npm run build` — expected exit 0.
Use the `run` skill to start the dev server, navigate to `/clientes`, screenshot the list (with existing data if the API is reachable, otherwise the empty state), toggle the "+ Nuevo cliente" form open and screenshot it, and click into one client's detail link to confirm the route still navigates (detail page itself is unstyled until Task 5 of the next phase — that's expected).

- [ ] **Step 8: Self-critique against brand rules before moving on**

Check against the spec's non-negotiables: ~70% structural-black surface area, silver used only for CTA/active states/focus (not as a body-text color), sharp 2–6px radii throughout, no rounded-xl shadcn defaults leaking through, focus rings visible on Tab through the form, Spanish copy unchanged. Note any deviations found and fix them in this same task before committing.

- [ ] **Step 9: Commit**

```bash
git add src/paginas/Clientes.tsx src/componentes/FormularioCliente.tsx
git commit -m "feat: rebuild Clientes list and FormularioCliente on VINDEX brand system"
```

---

## Self-Review Notes

- **Spec coverage:** Tailwind/shadcn/Lato/Framer Motion setup ✓ (Tasks 1–2), logo assets ✓ (Task 3), shared primitives fixing the `#fdf1ef` inconsistency and per-page `EstadoBadge` duplication ✓ (Task 4), Layout chrome-gradient nav + route transition ✓ (Task 5), Clientes checkpoint screen with skeleton/dialog-free CRUD ✓ (Task 6). PanelDocumentos vault metaphor, remaining screens, and window.confirm/prompt→Dialog replacement are explicitly out of scope for Phase 1 (Expedientes/Presupuestos own those) and will be covered in Phase 2's plan after this checkpoint is approved.
- **Type consistency:** `Row`, `PageHeader`, `EstadoBadge`, `EmptyState`, `ErrorBanner`, `ListSkeleton` signatures defined in Task 4 are used identically in Task 6 — verified matching prop names.
- **No placeholders:** all steps contain literal code or literal shell commands; no "similar to Task N" references.
