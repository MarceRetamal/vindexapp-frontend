import { Button } from '@/componentes/ui/button'

/**
 * Encabezado de una pantalla: el rótulo de la sección arriba, el título grande y, si corresponde, la cantidad y la
 * acción principal. `count`, `ctaLabel` y `onCta` son opcionales para las pantallas que no listan ni crean nada.
 */
export function PageHeader({
  title,
  eyebrow,
  descripcion,
  count,
  ctaLabel,
  onCta,
  ctaDisabled,
}: {
  title: string
  eyebrow?: string
  descripcion?: string
  count?: number
  ctaLabel?: string
  onCta?: () => void
  ctaDisabled?: boolean
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="mt-1.5 flex items-baseline gap-3 text-[28px] font-black leading-tight text-white sm:text-[32px]">
          {title}
          {count !== undefined && <span className="text-base font-light tabular-nums text-text-gray-light">{count}</span>}
        </h1>
        {descripcion && <p className="mt-1.5 max-w-2xl text-sm text-silver-deep">{descripcion}</p>}
      </div>
      {ctaLabel && onCta && (
        <Button
          onClick={onCta}
          disabled={ctaDisabled}
          className="rounded-sharp bg-gradient-to-br from-silver via-silver-deep to-silver text-structural-black font-bold uppercase tracking-[0.08em] text-xs hover:brightness-110 focus-visible:ring-2 focus-visible:ring-silver"
        >
          {ctaLabel}
        </Button>
      )}
    </div>
  )
}
