import { Button } from '@/componentes/ui/button'
import { Filete } from './Filete'

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
    <div className="mb-9">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <h1 className="text-xl sm:text-2xl font-black uppercase tracking-[0.08em] sm:tracking-[0.1em] text-white">
          {title}{' '}
          <span className="text-text-gray-light font-light normal-case tracking-normal tabular-nums">({count})</span>
        </h1>
        <Button
          onClick={onCta}
          disabled={ctaDisabled}
          className="rounded-sharp bg-gradient-to-br from-silver via-silver-deep to-silver text-structural-black font-bold uppercase tracking-[0.08em] text-xs hover:brightness-110 focus-visible:ring-2 focus-visible:ring-silver"
        >
          {ctaLabel}
        </Button>
      </div>
      <Filete className="mt-5" />
    </div>
  )
}
