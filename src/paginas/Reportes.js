import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { api } from '../api/reportes';
import { EmptyState } from '../componentes/EmptyState';
import { ErrorBanner } from '../componentes/ErrorBanner';
import { ListSkeleton } from '../componentes/ListSkeleton';
import { PageHeader } from '../componentes/PageHeader';
const formateadorPesos = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
});
function formatearFechaISO(fechaISO) {
    const [anio, mes, dia] = fechaISO.slice(0, 10).split('-');
    return `${dia}/${mes}/${anio}`;
}
function hace90Dias() {
    const d = new Date();
    d.setDate(d.getDate() - 90);
    return d.toISOString().slice(0, 10);
}
function hoyISO() {
    return new Date().toISOString().slice(0, 10);
}
export function Reportes() {
    return (_jsxs("div", { children: [_jsx(PageHeader, { eyebrow: "Estudio", title: "Reportes", descripcion: "C\u00F3mo viene la cartera de causas y los honorarios del estudio." }), _jsxs("div", { className: "flex flex-col gap-12", children: [_jsx(SeccionExpedientes, {}), _jsx(SeccionPresupuestos, {})] })] }));
}
function SeccionExpedientes() {
    const [datos, setDatos] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        setCargando(true);
        setError(null);
        api
            .listarReporteExpedientes()
            .then(setDatos)
            .catch((e) => setError(e.message))
            .finally(() => setCargando(false));
    }, []);
    return (_jsxs("section", { children: [_jsx("h2", { className: "eyebrow mb-4 text-silver", children: "Expedientes" }), error && _jsx(ErrorBanner, { message: `No se pudo cargar el reporte: ${error}` }), cargando ? (_jsx(ListSkeleton, { rows: 3 })) : datos ? (_jsxs("div", { className: "flex flex-col gap-8", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsx(Desglose, { titulo: "Por estado", items: (datos.porEstado ?? []).map((i) => ({ etiqueta: i.estado, valor: i.cantidad })) }), _jsx(Desglose, { titulo: "Por fuero", items: (datos.porFuero ?? []).map((i) => ({ etiqueta: i.fuero, valor: i.cantidad })) }), _jsx(Desglose, { titulo: "Por departamento", items: (datos.porDepartamento ?? []).map((i) => ({ etiqueta: i.departamento, valor: i.cantidad })) })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-bold text-white mb-3", children: "Bajas recientes (\u00FAltimos 90 d\u00EDas)" }), (datos.bajasUltimos90Dias ?? []).length === 0 ? (_jsx(EmptyState, { message: "No hubo bajas de expedientes en los \u00FAltimos 90 d\u00EDas." })) : (_jsx(motion.div, { initial: "hidden", animate: "show", variants: { hidden: {}, show: { transition: { staggerChildren: 0.04 } } }, children: datos.bajasUltimos90Dias.map((b) => (_jsx(motion.div, { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.2 }, children: _jsxs(Link, { to: `/expedientes/${b.id}`, className: "flex items-center justify-between gap-4 py-3 border-b border-line no-underline hover:bg-graphite transition-colors", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "font-medium text-white truncate", children: b.caratula }), b.motivo_baja && (_jsx("div", { className: "text-xs text-text-gray-light truncate", children: b.motivo_baja }))] }), _jsx("span", { className: "text-xs font-mono text-text-gray-light shrink-0", children: formatearFechaISO(b.baja) })] }) }, b.id))) }))] })] })) : null] }));
}
function SeccionPresupuestos() {
    const [desde, setDesde] = useState(hace90Dias());
    const [hasta, setHasta] = useState(hoyISO());
    const [datos, setDatos] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        setCargando(true);
        setError(null);
        api
            .listarReportePresupuestos(desde, hasta)
            .then(setDatos)
            .catch((e) => setError(e.message))
            .finally(() => setCargando(false));
    }, [desde, hasta]);
    return (_jsxs("section", { children: [_jsxs("div", { className: "flex items-baseline justify-between mb-4 flex-wrap gap-3", children: [_jsx("h2", { className: "eyebrow text-silver", children: "Presupuestos" }), _jsxs("div", { className: "flex items-center gap-2 text-xs text-text-gray-light", children: [_jsxs("label", { className: "flex items-center gap-1.5", children: ["Desde", _jsx("input", { type: "date", value: desde, max: hasta, onChange: (e) => setDesde(e.target.value), className: "rounded-sharp bg-graphite border border-line focus-visible:ring-silver h-8 px-2 text-sm text-white outline-none" })] }), _jsxs("label", { className: "flex items-center gap-1.5", children: ["Hasta", _jsx("input", { type: "date", value: hasta, min: desde, onChange: (e) => setHasta(e.target.value), className: "rounded-sharp bg-graphite border border-line focus-visible:ring-silver h-8 px-2 text-sm text-white outline-none" })] })] })] }), error && _jsx(ErrorBanner, { message: `No se pudo cargar el reporte: ${error}` }), cargando ? (_jsx(ListSkeleton, { rows: 3 })) : datos ? (_jsxs("div", { className: "flex flex-col gap-6", children: [_jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-4", children: [_jsxs("div", { className: "superficie p-5", children: [_jsx("div", { className: "text-2xl font-black text-white", children: formateadorPesos.format((datos.totalFirmadoCentavos ?? 0) / 100) }), _jsx("div", { className: "text-xs text-text-gray-light mt-1", children: "Total firmado" })] }), _jsxs("div", { className: "superficie p-5", children: [_jsx("div", { className: "text-2xl font-black text-white", children: formateadorPesos.format((datos.totalPendienteCentavos ?? 0) / 100) }), _jsx("div", { className: "text-xs text-text-gray-light mt-1", children: "Total pendiente" })] }), _jsxs("div", { className: "superficie p-5", children: [_jsx("div", { className: "text-2xl font-black text-white", children: datos.tasaConversion == null ? 'Sin datos' : `${Math.round(datos.tasaConversion * 100)}%` }), _jsx("div", { className: "text-xs text-text-gray-light mt-1", children: "Tasa de conversi\u00F3n" })] })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-bold text-white mb-3", children: "Por estado" }), (datos.porEstado ?? []).length === 0 ? (_jsx(EmptyState, { message: "No hay presupuestos en este rango de fechas." })) : (_jsx(DesglosePresupuestos, { items: datos.porEstado }))] })] })) : null] }));
}
function Desglose({ titulo, items }) {
    const max = Math.max(1, ...items.map((i) => i.valor));
    return (_jsxs("div", { className: "superficie p-5", children: [_jsx("div", { className: "text-xs text-text-gray-light mb-3", children: titulo }), items.length === 0 ? (_jsx("p", { className: "text-sm text-text-gray-light italic m-0", children: "Sin datos" })) : (_jsx("div", { className: "flex flex-col gap-2", children: items.map((i) => (_jsxs("div", { children: [_jsxs("div", { className: "flex items-baseline justify-between text-xs mb-1", children: [_jsx("span", { className: "text-white truncate", children: i.etiqueta }), _jsx("span", { className: "font-mono text-text-gray-light", children: i.valor })] }), _jsx("div", { className: "h-1.5 rounded-sharp bg-line overflow-hidden", children: _jsx("div", { className: "h-full bg-silver", style: { width: `${Math.max(4, (i.valor / max) * 100)}%` } }) })] }, i.etiqueta))) }))] }));
}
function DesglosePresupuestos({ items, }) {
    const max = Math.max(1, ...items.map((i) => i.montoTotal));
    return (_jsx("div", { className: "superficie p-5 flex flex-col gap-3", children: items.map((i) => (_jsxs("div", { children: [_jsxs("div", { className: "flex items-baseline justify-between text-xs mb-1", children: [_jsxs("span", { className: "text-white", children: [i.estado, " ", _jsxs("span", { className: "text-text-gray-light font-mono", children: ["\u00B7 ", i.cantidad] })] }), _jsx("span", { className: "font-mono text-text-gray-light", children: formateadorPesos.format(i.montoTotal / 100) })] }), _jsx("div", { className: "h-1.5 rounded-sharp bg-line overflow-hidden", children: _jsx("div", { className: "h-full bg-silver", style: { width: `${Math.max(4, (i.montoTotal / max) * 100)}%` } }) })] }, i.estado))) }));
}
