import type { ReactNode } from 'react'

/** Lista vacía: dice qué pasa y, si hay un paso siguiente, lo ofrece. */
export function EmptyState({ message, accion }: { message: string; accion?: ReactNode }) {
  return (
    <div className="superficie border-dashed px-6 py-14 text-center">
      <p className="mx-auto max-w-md text-sm leading-relaxed text-text-gray-light">{message}</p>
      {accion && <div className="mt-5">{accion}</div>}
    </div>
  )
}
