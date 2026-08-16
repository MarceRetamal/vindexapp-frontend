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
