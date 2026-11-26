import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { api as expedientesApi } from '../api/expedientes';
import { api as presupuestosApi } from '../api/presupuestos';
const FORMATO_MONTO = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });
/**
 * Lo que hay que saber de un cliente antes de abrir nada: cuántas causas tiene, si hay algo sin revisar del portal y
 * cómo van los honorarios. Todo sale de lo ya cargado.
 */
export function SituacionCliente({ clienteId }) {
    const [expedientes, setExpedientes] = useState(null);
    const [presupuestos, setPresupuestos] = useState(null);
    useEffect(() => {
        expedientesApi.listarDeCliente(clienteId).then(setExpedientes).catch(() => setExpedientes(null));
        presupuestosApi
            .listarPresupuestos()
            .then((todos) => setPresupuestos(todos.filter((p) => p.cliente_id === clienteId)))
            .catch(() => setPresupuestos(null));
    }, [clienteId]);
    const vigentes = expedientes?.filter((e) => e.estado !== 'Archivado') ?? [];
    const pendientes = vigentes.reduce((total, e) => total + (e.novedades_pendientes ?? 0), 0);
    const vinculadas = vigentes.reduce((total, e) => total + (e.causas_portal ?? 0), 0);
    const firmado = (presupuestos ?? []).filter((p) => p.estado === 'firmado').reduce((t, p) => t + p.monto, 0);
    const enCurso = (presupuestos ?? []).filter((p) => p.estado === 'borrador' || p.estado === 'enviado').reduce((t, p) => t + p.monto, 0);
    return (_jsxs("section", { "aria-label": "Situaci\u00F3n del cliente", className: "mb-8 grid gap-3 md:grid-cols-3", children: [_jsxs("div", { className: "superficie p-5", children: [_jsx("p", { className: "eyebrow", children: "Expedientes" }), expedientes === null ? (_jsx("p", { className: "mt-3 text-sm text-text-gray-light", children: "Sin datos." })) : (_jsxs("div", { className: "mt-3", children: [_jsx("div", { className: "text-[26px] font-light leading-none tabular-nums text-white", children: vigentes.length }), _jsxs("div", { className: "mt-2 text-xs text-text-gray-light", children: [vigentes.length === 1 ? 'vigente' : 'vigentes', expedientes.length > vigentes.length ? ` · ${expedientes.length - vigentes.length} archivados` : ''] })] }))] }), _jsxs("div", { className: "superficie p-5", children: [_jsx("p", { className: "eyebrow", children: "Portal de notificaciones" }), expedientes === null ? (_jsx("p", { className: "mt-3 text-sm text-text-gray-light", children: "Sin datos." })) : vinculadas === 0 ? (_jsxs("div", { className: "mt-3", children: [_jsx("div", { className: "text-[15px] font-bold text-white", children: "Sin causas vinculadas" }), _jsx("div", { className: "mt-1 text-xs text-text-gray-light", children: "M\u00E1s abajo vemos si el portal tiene causas de este cliente." })] })) : (_jsxs("div", { className: "mt-3", children: [_jsx("div", { className: `text-[15px] font-bold ${pendientes > 0 ? 'text-warning' : 'text-white'}`, children: pendientes > 0 ? `${pendientes} ${pendientes === 1 ? 'novedad sin revisar' : 'novedades sin revisar'}` : 'Al día' }), _jsxs("div", { className: "mt-1 text-xs text-silver-deep", children: [vinculadas, " ", vinculadas === 1 ? 'causa vinculada' : 'causas vinculadas', pendientes > 0 && (_jsxs(_Fragment, { children: [' · ', _jsx(Link, { to: "/novedades", className: "text-silver underline-offset-4 hover:text-white hover:underline", children: "Ver novedades" })] }))] })] }))] }), _jsxs("div", { className: "superficie p-5", children: [_jsx("p", { className: "eyebrow", children: "Honorarios" }), presupuestos === null ? (_jsx("p", { className: "mt-3 text-sm text-text-gray-light", children: "Sin datos." })) : presupuestos.length === 0 ? (_jsxs("div", { className: "mt-3", children: [_jsx("div", { className: "text-[15px] font-bold text-white", children: "Sin presupuestos" }), _jsx(Link, { to: "/presupuestos", className: "mt-1 inline-block text-xs text-silver underline-offset-4 hover:text-white hover:underline", children: "Cargar un presupuesto" })] })) : (_jsxs("div", { className: "mt-3", children: [_jsx("div", { className: "text-[26px] font-light leading-none tabular-nums text-white", children: FORMATO_MONTO.format(firmado / 100) }), _jsxs("div", { className: "mt-2 text-xs text-text-gray-light", children: ["firmado", enCurso > 0 ? ` · ${FORMATO_MONTO.format(enCurso / 100)} en curso` : ''] })] }))] })] }));
}
