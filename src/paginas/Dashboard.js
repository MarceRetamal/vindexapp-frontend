import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { InsigniaRol } from '../componentes/RolProfesional';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { ArrowRightIcon, CalendarDaysIcon, CheckIcon, HourglassIcon, SquareCheckBigIcon } from 'lucide-react';
import { api as apiDashboard, apiAgenda } from '../api/dashboard';
import { api as novedadesApi } from '../api/novedades';
import { enlaceDeRevision } from '../componentes/PropuestaPlazo';
import { api as portalApi } from '../api/portal';
import { sesionActual } from '../api/whoami';
import { diasEntre, etiquetaDias, fechaLarga, fechaConDia, haceCuanto, hoyEnArgentina, horaEnArgentina, resumenDelDia, saludoDe } from '../lib/fechas';
import { usePlazosSugeridos } from '../lib/usePlazosSugeridos';
import { BloqueFecha } from '../componentes/BloqueFecha';
import { EnlacePlazo } from '../componentes/EnlacePlazo';
import { ErrorBanner } from '../componentes/ErrorBanner';
import { ListSkeleton } from '../componentes/ListSkeleton';
import { PrimerosPasos } from '../componentes/PrimerosPasos';
const ICONO_CLASE = {
    plazo: { icono: HourglassIcon, etiqueta: 'Plazo' },
    audiencia: { icono: CalendarDaysIcon, etiqueta: 'Audiencia' },
    tarea: { icono: SquareCheckBigIcon, etiqueta: 'Tarea' },
};
const GRUPOS_AGENDA = [
    { id: 'vencido', titulo: 'Vencido', incluye: (d) => d < 0 },
    { id: 'hoy', titulo: 'Hoy', incluye: (d) => d === 0 },
    { id: 'manana', titulo: 'Mañana', incluye: (d) => d === 1 },
    { id: 'semana', titulo: 'Esta semana', incluye: (d) => d >= 2 && d <= 7 },
    { id: 'luego', titulo: 'Más adelante', incluye: (d) => d > 7 },
];
export function Dashboard() {
    const [agenda, setAgenda] = useState(null);
    const [error, setError] = useState(null);
    const [novedades, setNovedades] = useState(null);
    const [portal, setPortal] = useState(null);
    const [expedientesActivos, setExpedientesActivos] = useState(null);
    const { usuario } = sesionActual();
    useEffect(() => {
        apiAgenda
            .obtenerAgenda(14)
            .then(setAgenda)
            .catch((e) => setError(e.message));
        // Lo del portal es un agregado: si no carga, el resto de la pantalla se muestra igual.
        novedadesApi
            .listarNovedades({ estado: 'pendientes', limit: 4 })
            .then((r) => setNovedades({ lista: r.novedades, total: r.total }))
            .catch(() => setNovedades({ lista: [], total: 0 }));
        portalApi
            .obtenerEstado()
            .then(setPortal)
            .catch(() => setPortal(null));
        // Con cero expedientes el estudio es nuevo: en vez de "agenda despejada" se muestran los primeros pasos.
        apiDashboard
            .obtenerDashboard()
            .then((d) => setExpedientesActivos(d.expedientesActivos))
            .catch(() => setExpedientesActivos(null));
    }, []);
    const resumen = useMemo(() => {
        if (!agenda)
            return null;
        const deHoy = agenda.items.filter((i) => i.dias === 0);
        const audiencias = deHoy.filter((i) => i.clase === 'audiencia');
        return resumenDelDia({
            vencidas: agenda.resumen.vencidas,
            plazosHoy: deHoy.filter((i) => i.clase === 'plazo').length,
            audienciasHoy: audiencias.length,
            horaAudiencia: audiencias[0]?.hora ?? null,
            tareasHoy: deHoy.filter((i) => i.clase === 'tarea').length,
            novedades: novedades?.total ?? 0,
        });
    }, [agenda, novedades]);
    return (_jsxs("div", { children: [_jsx(Encabezado, { fecha: agenda?.hoy, nombre: usuario?.nombre, frase: resumen, cifras: agenda ? [
                    { etiqueta: 'Vencido', valor: agenda.resumen.vencidas, tono: agenda.resumen.vencidas > 0 ? 'urgente' : 'calmo' },
                    { etiqueta: 'Hoy', valor: agenda.resumen.hoy, tono: agenda.resumen.hoy > 0 ? 'hoy' : 'calmo' },
                    { etiqueta: 'Próximos 7 días', valor: agenda.resumen.proximas, tono: 'calmo' },
                ] : null }), error && _jsx(ErrorBanner, { message: `No se pudo cargar tu agenda: ${error}` }), _jsxs("div", { className: "mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]", children: [_jsx("section", { "aria-label": "Agenda", className: "min-w-0", children: !agenda && !error ? (_jsx(ListSkeleton, { rows: 5 })) : agenda && agenda.items.length === 0 && expedientesActivos === 0 ? (_jsx(PrimerosPasos, {})) : (agenda && _jsx(ListaAgenda, { items: agenda.items })) }), _jsxs("aside", { className: "flex min-w-0 flex-col gap-5", children: [_jsx(PulsoPortal, { estado: portal }), _jsx(TarjetaNovedades, { datos: novedades })] })] })] }));
}
function Encabezado({ fecha, nombre, frase, cifras, }) {
    const saludo = saludoDe(horaEnArgentina());
    return (_jsxs("header", { className: "superficie aparecer flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "eyebrow", children: fecha ? fechaLarga(fecha) : ' ' }), _jsxs("h1", { className: "mt-2 text-[28px] font-black leading-tight text-white sm:text-[34px]", children: [saludo, nombre ? `, ${nombre}` : ''] }), _jsx("p", { className: "mt-3 max-w-xl text-[17px] font-light leading-relaxed text-silver sm:text-lg", children: frase ?? ' ' })] }), cifras && (_jsx("dl", { className: "flex shrink-0 divide-x divide-line self-start lg:self-end", children: cifras.map((c) => (_jsxs("div", { className: "px-5 first:pl-0 last:pr-0 sm:px-6", children: [_jsx("dd", { className: `text-[40px] font-light leading-none tabular-nums sm:text-5xl ${c.tono === 'urgente' ? 'text-warning' : c.tono === 'hoy' ? 'text-white' : 'text-silver-deep'}`, children: c.valor }), _jsx("dt", { className: "eyebrow mt-2.5 text-[10px]", children: c.etiqueta })] }, c.etiqueta))) }))] }));
}
function ListaAgenda({ items }) {
    if (items.length === 0) {
        return (_jsxs("div", { className: "superficie flex flex-col items-center px-6 py-14 text-center", children: [_jsx("div", { className: "flex h-12 w-12 items-center justify-center rounded-full border border-silver-deep/50 text-silver", children: _jsx(CheckIcon, { className: "h-6 w-6", strokeWidth: 1.6 }) }), _jsx("h2", { className: "mt-5 text-lg font-bold text-white", children: "Agenda despejada" }), _jsx("p", { className: "mt-2 max-w-sm text-sm text-text-gray-light", children: "No hay tareas, audiencias ni plazos para los pr\u00F3ximos 14 d\u00EDas. Cuando cargues algo con fecha, aparece ac\u00E1 ordenado por urgencia." }), _jsxs(Link, { to: "/tareas", className: "mt-6 inline-flex items-center gap-2 text-sm text-silver hover:text-white", children: ["Cargar una tarea ", _jsx(ArrowRightIcon, { className: "h-4 w-4", strokeWidth: 1.6 })] })] }));
    }
    let orden = 0;
    return (_jsx("div", { className: "flex flex-col gap-9", children: GRUPOS_AGENDA.map((g) => {
            const delGrupo = items.filter((i) => g.incluye(i.dias));
            if (delGrupo.length === 0)
                return null;
            return (_jsxs("section", { "aria-label": g.titulo, children: [_jsxs("h2", { className: `eyebrow mb-3 flex items-center gap-3 ${g.id === 'vencido' ? 'text-warning' : g.id === 'hoy' ? 'text-white' : ''}`, children: [g.titulo, _jsx("span", { className: "font-light tabular-nums tracking-normal text-text-gray-light", children: delGrupo.length }), _jsx("span", { className: "h-px flex-1 bg-line", "aria-hidden": "true" })] }), _jsx("ul", { className: "flex flex-col gap-2", children: delGrupo.map((item) => (_jsx(FilaAgenda, { item: item, demora: Math.min(orden++, 10) * 0.03 }, item.clave))) })] }, g.id));
        }) }));
}
function FilaAgenda({ item, demora }) {
    const { icono: Icono, etiqueta } = ICONO_CLASE[item.clase];
    const destino = item.expediente_id ? `/expedientes/${item.expediente_id}` : '/tareas';
    const contexto = [item.caratula ?? (item.clase === 'tarea' ? 'Sin expediente' : null), item.cliente].filter(Boolean).join(' · ');
    const cuando = [etiquetaDias(item.dias), item.hora ? `${item.hora} hs` : null, item.detalle].filter(Boolean).join(' · ');
    return (_jsx(motion.li, { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.25, delay: demora }, children: _jsxs(Link, { to: destino, className: "superficie group flex items-center gap-4 p-3.5 transition-colors hover:border-silver-deep hover:bg-graphite-raised focus-visible:border-silver", children: [_jsx(BloqueFecha, { fecha: item.fecha, dias: item.dias, hora: item.hora }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-1.5", children: [item.expediente_id && _jsx(InsigniaRol, { rol: item.rol }), item.a_verificar && (_jsx("span", { className: "inline-flex h-5 items-center rounded-sharp border border-warning/60 bg-warning/10 px-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-warning", title: "Vencimiento calculado autom\u00E1ticamente a partir del prove\u00EDdo: verificalo", children: "Verificar" }))] }), _jsx("div", { className: "line-clamp-2 text-[15px] font-bold leading-snug text-white", children: item.titulo }), contexto && _jsx("div", { className: "mt-0.5 truncate text-xs text-text-gray-light", children: contexto }), _jsx("div", { className: `mt-1 truncate text-xs ${item.dias < 0 ? 'font-bold text-warning' : item.dias === 0 ? 'font-bold text-white' : 'text-silver-deep'}`, children: cuando })] }), _jsxs("span", { className: "hidden shrink-0 items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-silver-deep sm:inline-flex", children: [_jsx(Icono, { className: "h-4 w-4", strokeWidth: 1.6 }), etiqueta] }), _jsx(ArrowRightIcon, { className: "h-4 w-4 shrink-0 text-silver-deep transition-transform group-hover:translate-x-0.5 group-hover:text-silver", strokeWidth: 1.6, "aria-hidden": "true" })] }) }));
}
function pulsoDelPortal(e) {
    if (!e.configurado)
        return { tono: 'apagado', titulo: 'Portal sin conectar', detalle: 'Falta cargar los datos de conexión.' };
    if (e.pausada)
        return { tono: 'alerta', titulo: 'Lectura en pausa', detalle: 'El portal rechazó la clave. Revisala para retomar la lectura.' };
    if (e.errores_consecutivos >= 3)
        return { tono: 'alerta', titulo: 'Sin lectura reciente', detalle: `Hubo ${e.errores_consecutivos} intentos fallidos seguidos.` };
    if (e.causas_importadas === 0)
        return { tono: 'apagado', titulo: 'Sin causas para vigilar', detalle: 'Importá tus causas del portal para empezar.' };
    return {
        tono: 'ok',
        titulo: `Vigilando ${e.causas_importadas} ${e.causas_importadas === 1 ? 'causa' : 'causas'}`,
        detalle: e.ultimo_ok ? `Última lectura ${haceCuanto(e.ultimo_ok)}` : 'Esperando la primera lectura',
        extra: e.ultimas_nuevas > 0 ? `${e.ultimas_nuevas} ${e.ultimas_nuevas === 1 ? 'novedad nueva' : 'novedades nuevas'} en esa lectura` : 'Sin novedades nuevas',
    };
}
/** Hace visible lo que trabaja solo: el sistema leyendo el portal de la SCBA mientras el abogado hace otra cosa. */
function PulsoPortal({ estado }) {
    if (!estado)
        return null;
    const p = pulsoDelPortal(estado);
    return (_jsxs("section", { className: "superficie p-5", "aria-label": "Estado del portal", children: [_jsx("p", { className: "eyebrow", children: "Portal de notificaciones" }), _jsxs("div", { className: "mt-3 flex items-center gap-3", children: [_jsx("span", { className: `h-2.5 w-2.5 shrink-0 rounded-full ${p.tono === 'ok' ? 'pulso bg-silver' : p.tono === 'alerta' ? 'bg-warning' : 'bg-silver-deep/50'}`, "aria-hidden": "true" }), _jsx("h2", { className: "text-[15px] font-bold text-white", children: p.titulo })] }), _jsx("p", { className: "mt-2 text-sm text-silver", children: p.detalle }), p.extra && _jsx("p", { className: "mt-0.5 text-xs text-text-gray-light", children: p.extra })] }));
}
function TarjetaNovedades({ datos }) {
    const sugerencias = usePlazosSugeridos(datos?.lista ?? []);
    if (!datos)
        return null;
    return (_jsxs("section", { className: "superficie p-5", "aria-label": "Novedades del portal", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("p", { className: "eyebrow", children: "Por revisar" }), datos.total > 0 && (_jsx("span", { className: "min-w-5 rounded-full border border-warning/70 bg-warning/10 px-1.5 text-center font-mono text-[11px] leading-5 text-warning", children: datos.total }))] }), datos.lista.length === 0 ? (_jsxs("div", { className: "mt-4 flex items-center gap-3 text-sm text-silver", children: [_jsx("span", { className: "flex h-8 w-8 items-center justify-center rounded-full border border-silver-deep/50 text-silver", children: _jsx(CheckIcon, { className: "h-4 w-4", strokeWidth: 1.8 }) }), "Todo revisado."] })) : (_jsx("ul", { className: "mt-3 flex flex-col", children: datos.lista.map((n) => (_jsxs("li", { className: "border-b border-line py-3 last:border-b-0", children: [_jsx("div", { className: "text-sm font-bold text-white", children: n.tipo ?? 'Notificación del portal' }), _jsxs("div", { className: "mt-0.5 truncate text-xs text-text-gray-light", children: [n.numero_causa, n.caratula ? ` · ${n.caratula}` : ''] }), sugerencias[n.id]?.propuesta && _jsx(LineaPlazo, { propuesta: sugerencias[n.id].propuesta, novedad: n }), _jsxs("div", { className: "mt-1.5 flex items-center justify-between gap-3", children: [_jsx("span", { className: "text-xs text-silver-deep", children: n.fecha_notificacion ? `Notificada el ${n.fecha_notificacion.split('-').reverse().join('/')}` : 'Sin fecha de notificación' }), _jsx(EnlacePlazo, { novedad: n })] })] }, n.id))) })), _jsxs(Link, { to: "/novedades", className: "mt-3 inline-flex items-center gap-2 text-xs text-silver hover:text-white", children: [datos.total > datos.lista.length ? `Ver las ${datos.total} novedades` : 'Abrir la bandeja', " ", _jsx(ArrowRightIcon, { className: "h-3.5 w-3.5", strokeWidth: 1.6 })] })] }));
}
/** Una línea con el plazo propuesto de una novedad; al tocarla se revisa en la calculadora. */
function LineaPlazo({ propuesta, novedad }) {
    const dias = diasEntre(hoyEnArgentina(), propuesta.vencimiento);
    return (_jsxs(Link, { to: enlaceDeRevision(propuesta, novedad), className: `mt-2 flex items-center justify-between gap-3 rounded-sm border px-2.5 py-1.5 text-xs transition-colors hover:border-silver ${dias <= 0 ? 'border-warning/50 text-warning' : 'border-line text-silver'}`, children: [_jsxs("span", { className: "min-w-0 truncate", children: ["Vence ", fechaConDia(propuesta.vencimiento).replace(/\/\d{4}$/, ''), propuesta.origen === 'supletorio' ? ' · a verificar' : ''] }), _jsx("span", { className: "shrink-0 font-bold", children: etiquetaDias(dias) })] }));
}
