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
