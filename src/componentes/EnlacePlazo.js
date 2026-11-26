import { jsx as _jsx } from "react/jsx-runtime";
import { Link } from 'react-router';
/** Abre la calculadora de plazos con la fecha de notificación, el expediente y el trámite de la novedad. */
export function EnlacePlazo({ novedad }) {
    if (!novedad.fecha_notificacion)
        return null;
    const params = new URLSearchParams({ fecha: novedad.fecha_notificacion, titulo: `${novedad.tipo ?? 'Notificación'} (${novedad.numero_causa})` });
    if (novedad.expediente_id)
        params.set('expediente_id', novedad.expediente_id);
    return (_jsx(Link, { to: `/plazos?${params.toString()}`, className: "text-xs text-text-gray-light hover:text-white underline-offset-4 hover:underline", children: "Calcular plazo" }));
}
