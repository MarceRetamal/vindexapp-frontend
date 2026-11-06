import { SearchIcon, XIcon } from 'lucide-react';

/** Campo de búsqueda de una lista: filtra mientras se escribe. */
export function CampoBusqueda({ valor, onCambio, placeholder, etiqueta }: { valor: string; onCambio: (v: string) => void; placeholder: string; etiqueta: string }) {
  return (
    <div className="superficie flex h-10 w-full items-center gap-2.5 px-3 focus-within:border-silver sm:max-w-sm">
      <SearchIcon className="h-4 w-4 shrink-0 text-silver-deep" strokeWidth={1.6} aria-hidden="true" />
      <input
        type="search"
        value={valor}
        onChange={(e) => onCambio(e.target.value)}
        placeholder={placeholder}
        aria-label={etiqueta}
        className="sin-contorno min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-text-gray-light [&::-webkit-search-cancel-button]:hidden"
      />
      {valor && (
        <button type="button" onClick={() => onCambio('')} aria-label="Borrar la búsqueda" className="text-silver-deep hover:text-white">
          <XIcon className="h-4 w-4" strokeWidth={1.6} />
        </button>
      )}
    </div>
  );
}

/** Filtros en forma de píldoras, con la cantidad de cada uno. */
export function Chips<T extends string>({
  etiqueta,
  valor,
  opciones,
  onCambio,
}: {
  etiqueta: string;
  valor: T;
  opciones: { valor: T; texto: string; cantidad?: number }[];
  onCambio: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={etiqueta}>
      {opciones.map((o) => {
        const activo = o.valor === valor;
        return (
          <button
            key={o.valor}
            type="button"
            aria-pressed={activo}
            onClick={() => onCambio(o.valor)}
            className={`inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-[13px] transition-colors ${
              activo ? 'border-silver bg-graphite-raised font-bold text-white' : 'border-line text-silver-deep hover:border-silver-deep hover:text-white'
            }`}
          >
            {o.texto}
            {o.cantidad !== undefined && <span className={`tabular-nums ${activo ? 'text-silver' : 'text-text-gray-light'}`}>{o.cantidad}</span>}
          </button>
        );
      })}
    </div>
  );
}
