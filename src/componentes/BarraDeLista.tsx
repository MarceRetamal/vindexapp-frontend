import { Chips, CampoBusqueda } from './BarraFiltros';

/** Búsqueda y filtros de una lista, en una sola barra. */
export function BarraDeLista<T extends string>({
  busqueda,
  onBusqueda,
  placeholder,
  etiquetaBusqueda,
  filtro,
  onFiltro,
  etiquetaFiltro,
  opciones,
}: {
  busqueda: string;
  onBusqueda: (v: string) => void;
  placeholder: string;
  etiquetaBusqueda: string;
  filtro: T;
  onFiltro: (v: T) => void;
  etiquetaFiltro: string;
  opciones: { valor: T; texto: string; cantidad?: number }[];
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <CampoBusqueda valor={busqueda} onCambio={onBusqueda} placeholder={placeholder} etiqueta={etiquetaBusqueda} />
      <Chips etiqueta={etiquetaFiltro} valor={filtro} opciones={opciones} onCambio={onFiltro} />
    </div>
  );
}
