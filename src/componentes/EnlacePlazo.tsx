import { Link } from 'react-router';
import type { Novedad } from '../api/novedades';

/** Abre la calculadora de plazos con la fecha de notificación, el expediente y el trámite de la novedad. */
export function EnlacePlazo({ novedad }: { novedad: Pick<Novedad, 'fecha_notificacion' | 'expediente_id' | 'tipo' | 'numero_causa'> }) {
  if (!novedad.fecha_notificacion) return null;
  const params = new URLSearchParams({ fecha: novedad.fecha_notificacion, titulo: `${novedad.tipo ?? 'Notificación'} (${novedad.numero_causa})` });
  if (novedad.expediente_id) params.set('expediente_id', novedad.expediente_id);
  return (
    <Link to={`/plazos?${params.toString()}`} className="text-xs text-text-gray-light hover:text-white underline-offset-4 hover:underline">
      Calcular plazo
    </Link>
  );
}
