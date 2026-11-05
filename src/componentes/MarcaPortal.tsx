/** Marca de un expediente conectado con el Portal de Notificaciones, con sus novedades sin revisar. */
export function MarcaPortal({ causas, pendientes }: { causas?: number; pendientes?: number }) {
  if (!causas && !pendientes) return null;
  return (
    <span
      className={`rounded-sharp border px-2 py-0.5 text-xs whitespace-nowrap ${
        pendientes ? 'border-warning text-warning' : 'border-silver-deep text-silver-deep'
      }`}
      title="Conectado con el Portal de Notificaciones"
    >
      Portal{pendientes ? ` · ${pendientes} sin revisar` : ''}
    </span>
  );
}
