/** Filete de plata bajo el título de una pantalla: línea fina y un tramo corto de Plata Vindex. */
export function Filete({ className = '' }: { className?: string }) {
  return (
    <div className={`relative h-px bg-line ${className}`} aria-hidden="true">
      <span className="absolute left-0 -top-px h-[3px] w-10 bg-silver" />
    </div>
  )
}
