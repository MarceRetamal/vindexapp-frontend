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
