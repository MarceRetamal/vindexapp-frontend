import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { ArrowRightIcon } from 'lucide-react';
import { api as audienciasApi } from '../api/audiencias';
import { api as novedadesApi } from '../api/novedades';
import { api as portalApi } from '../api/portal';
import { diasEntre, etiquetaDias, fechaConDia, hoyEnArgentina } from '../lib/fechas';
import { BloqueFecha } from './BloqueFecha';
const NOMBRE_CLASE = { plazo: 'Plazo', audiencia: 'Audiencia', tarea: 'Tarea' };
/**
 * Lo primero que hay que saber de una causa, antes de leer nada: qué es lo próximo que vence, cuál fue el último
 * movimiento y si hay algo sin revisar del portal. Todo sale de lo ya cargado; no calcula plazos.
 */
export function SituacionExpediente({ expedienteId, actuaciones, tareas }) {
    const [audiencias, setAudiencias] = useState([]);
    const [portal, setPortal] = useState(null);
    const hoy = hoyEnArgentina();
    useEffect(() => {
        audienciasApi.listarDeExpediente(expedienteId).then(setAudiencias).catch(() => setAudiencias([]));
        Promise.all([portalApi.causasDeExpediente(expedienteId), novedadesApi.listarNovedades({ expediente_id: expedienteId, estado: 'pendientes', limit: 1 })])
            .then(([causas, novedades]) => setPortal({ causas: causas.length, pendientes: novedades.total }))
            .catch(() => setPortal(null));
    }, [expedienteId]);
    const proximos = useMemo(() => [
        ...actuaciones.filter((a) => a.vencimiento && a.vencimiento.slice(0, 10) >= hoy).map((a) => ({ clase: 'plazo', titulo: a.tipo, fecha: a.vencimiento.slice(0, 10), hora: null })),
        ...audiencias.filter((a) => a.estado === 'Programada' && a.fecha.slice(0, 10) >= hoy).map((a) => ({ clase: 'audiencia', titulo: a.tipo, fecha: a.fecha.slice(0, 10), hora: a.hora ? a.hora.slice(0, 5) : null })),
        ...tareas.filter((t) => t.estado !== 'Completada' && t.fecha_limite).map((t) => ({ clase: 'tarea', titulo: t.titulo, fecha: t.fecha_limite.slice(0, 10), hora: null })),
    ].sort((a, b) => a.fecha.localeCompare(b.fecha) || (a.hora ?? '99').localeCompare(b.hora ?? '99')), [actuaciones, audiencias, tareas, hoy]);
    const proximo = proximos[0];
    const ultimo = useMemo(() => [...actuaciones].sort((a, b) => b.fecha.localeCompare(a.fecha) || b.creado_en - a.creado_en)[0], [actuaciones]);
    return (_jsxs("section", { "aria-label": "Situaci\u00F3n del expediente", className: "mb-8 grid gap-3 md:grid-cols-3", children: [_jsxs("div", { className: "superficie p-5", children: [_jsx("p", { className: "eyebrow", children: "Lo pr\u00F3ximo" }), proximo ? (_jsxs("div", { className: "mt-3 flex items-center gap-4", children: [_jsx(BloqueFecha, { fecha: proximo.fecha, dias: diasEntre(hoy, proximo.fecha), hora: proximo.hora }), _jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "line-clamp-2 text-[15px] font-bold leading-snug text-white", children: proximo.titulo }), _jsxs("div", { className: `mt-1 text-xs ${diasEntre(hoy, proximo.fecha) <= 0 ? 'font-bold text-white' : 'text-silver-deep'}`, children: [NOMBRE_CLASE[proximo.clase], " \u00B7 ", etiquetaDias(diasEntre(hoy, proximo.fecha)), proximos.length > 1 ? ` · y ${proximos.length - 1} más` : ''] })] })] })) : (_jsx("p", { className: "mt-3 text-sm text-text-gray-light", children: "Sin vencimientos, audiencias ni tareas con fecha." }))] }), _jsxs("div", { className: "superficie p-5", children: [_jsx("p", { className: "eyebrow", children: "\u00DAltimo movimiento" }), ultimo ? (_jsxs("div", { className: "mt-3", children: [_jsx("div", { className: "line-clamp-2 text-[15px] font-bold leading-snug text-white", children: ultimo.tipo }), _jsxs("div", { className: "mt-1 text-xs text-silver-deep first-letter:uppercase", children: [fechaConDia(ultimo.fecha.slice(0, 10)), diasEntre(ultimo.fecha.slice(0, 10), hoy) >= 0 && ` · hace ${diasEntre(ultimo.fecha.slice(0, 10), hoy)} ${diasEntre(ultimo.fecha.slice(0, 10), hoy) === 1 ? 'día' : 'días'}`] })] })) : (_jsx("p", { className: "mt-3 text-sm text-text-gray-light", children: "Todav\u00EDa no hay actuaciones cargadas." }))] }), _jsxs("div", { className: "superficie p-5", children: [_jsx("p", { className: "eyebrow", children: "Portal de notificaciones" }), portal === null ? (_jsx("p", { className: "mt-3 text-sm text-text-gray-light", children: "Sin datos del portal." })) : portal.causas === 0 ? (_jsxs("div", { className: "mt-3", children: [_jsx("div", { className: "text-[15px] font-bold text-white", children: "Sin causa vinculada" }), _jsxs("a", { href: "#portal", className: "mt-1 inline-flex items-center gap-1.5 text-xs text-silver hover:text-white", children: ["Vincular la causa del portal ", _jsx(ArrowRightIcon, { className: "h-3.5 w-3.5", strokeWidth: 1.6 })] })] })) : (_jsxs("div", { className: "mt-3", children: [_jsx("div", { className: `text-[15px] font-bold ${portal.pendientes > 0 ? 'text-warning' : 'text-white'}`, children: portal.pendientes > 0 ? `${portal.pendientes} ${portal.pendientes === 1 ? 'novedad sin revisar' : 'novedades sin revisar'}` : 'Al día' }), _jsxs("div", { className: "mt-1 text-xs text-silver-deep", children: [portal.causas, " ", portal.causas === 1 ? 'causa vinculada' : 'causas vinculadas', portal.pendientes > 0 && (_jsxs(_Fragment, { children: [' · ', _jsx("a", { href: "#portal", className: "text-silver underline-offset-4 hover:text-white hover:underline", children: "Ver abajo" })] }))] })] }))] })] }));
}
/** Enlace a la ficha del cliente de un expediente. */
export function EnlaceCliente({ clienteId, nombre }) {
    return (_jsx(Link, { to: `/clientes/${clienteId}`, className: "text-white underline-offset-4 hover:underline", children: nombre }));
}
