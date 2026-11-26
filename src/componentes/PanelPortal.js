import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { api as portalApi } from '../api/portal';
import { api as novedadesApi, avisarCambioNovedades } from '../api/novedades';
import { EmptyState } from './EmptyState';
import { PropuestaPlazo } from './PropuestaPlazo';
import { usePlazosSugeridos } from '../lib/usePlazosSugeridos';
import { EnlacePlazo } from './EnlacePlazo';
import { ErrorBanner } from './ErrorBanner';
import { EstadoBadge } from './EstadoBadge';
import { ListSkeleton } from './ListSkeleton';
import { enlaceSeguro } from '../lib/texto';
import { Button } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
const botonClases = 'rounded-sharp border border-line text-text-gray-light hover:text-white';
const LIMITE = 30;
function avisoDeVinculo(novedades) {
    const sumadas = novedades === 0
        ? 'Todavía no había novedades guardadas de esa causa'
        : novedades === 1
            ? 'Se sumó 1 novedad que ya estaba guardada'
            : `Se sumaron ${novedades} novedades que ya estaban guardadas`;
    return `Causa vinculada. ${sumadas}; las próximas entran solas.`;
}
function formatearFecha(fechaISO) {
    const [anio, mes, dia] = fechaISO.slice(0, 10).split('-');
    return `${dia}/${mes}/${anio}`;
}
/**
 * Novedades del Portal de Notificaciones de este expediente y las causas del portal vinculadas con él.
 * Una causa importada no sabe de qué cliente es: el vínculo con el expediente lo decide el abogado acá.
 */
export function PanelPortal({ expedienteId }) {
    const [causas, setCausas] = useState([]);
    const [novedades, setNovedades] = useState([]);
    const [total, setTotal] = useState(0);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);
    const [aviso, setAviso] = useState(null);
    const [vinculando, setVinculando] = useState(false);
    const [sugeridas, setSugeridas] = useState([]);
    const sugerencias = usePlazosSugeridos(novedades.filter((n) => n.revisada_en === null));
    function cargar() {
        setCargando(true);
        setError(null);
        Promise.all([
            portalApi.causasDeExpediente(expedienteId),
            novedadesApi.listarNovedades({ expediente_id: expedienteId, estado: 'todas', limit: LIMITE }),
            portalApi.sugeridasDeExpediente(expedienteId),
        ])
            .then(([c, n, s]) => {
            setCausas(c);
            setSugeridas(s);
            setNovedades(n.novedades);
            setTotal(n.total);
        })
            .catch((e) => setError(e.message))
            .finally(() => setCargando(false));
    }
    useEffect(cargar, [expedienteId]);
    async function desvincular(causa) {
        if (!window.confirm(`Se desvincula la causa ${causa.numero_causa} de este expediente. Sus novedades siguen en la bandeja de Novedades, sin expediente. ¿Seguimos?`))
            return;
        setError(null);
        setAviso(null);
        try {
            const r = await portalApi.desvincularCausa(expedienteId, causa.id);
            setAviso(`Causa desvinculada (${r.novedades_desvinculadas} novedades quedaron sin expediente).`);
            cargar();
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'No se pudo desvincular la causa.');
        }
    }
    async function vincularSugerida(causaId) {
        setError(null);
        setAviso(null);
        try {
            const r = await portalApi.vincularCausa(expedienteId, causaId);
            setAviso(avisoDeVinculo(r.novedades_vinculadas));
            avisarCambioNovedades();
            cargar();
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'No se pudo vincular la causa.');
        }
    }
    async function alternarRevision(n) {
        setError(null);
        try {
            const r = await novedadesApi.marcarRevisada(n.id, n.revisada_en === null);
            setNovedades((actuales) => actuales.map((x) => (x.id === n.id ? { ...x, revisada_en: r.revisada_en } : x)));
            avisarCambioNovedades();
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'No se pudo actualizar la novedad.');
        }
    }
    return (_jsxs("section", { children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3 mb-3 mt-8", children: [_jsx("h2", { id: "portal", className: "eyebrow scroll-mt-6 text-silver", children: "Portal de Notificaciones" }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => setVinculando((v) => !v), className: botonClases, children: vinculando ? 'Cerrar' : '+ Vincular causa del portal' })] }), vinculando && (_jsx(SelectorCausa, { expedienteId: expedienteId, onVinculada: (n) => {
                    setVinculando(false);
                    setAviso(avisoDeVinculo(n));
                    cargar();
                }, onError: setError })), !cargando && sugeridas.length > 0 && (_jsxs("div", { className: "border border-line rounded-sharp bg-graphite p-4 mb-3 flex flex-col gap-2", children: [_jsx("p", { className: "text-xs text-text-gray-light", children: "Encontramos en el portal una causa con el mismo n\u00FAmero que este expediente:" }), sugeridas.map((c) => (_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center gap-2", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("div", { className: "text-sm text-white break-words", children: c.caratula ?? 'Sin carátula' }), _jsxs("div", { className: "text-xs font-mono text-text-gray-light break-words", children: [c.numero_causa, c.organismo ? ` · ${c.organismo}` : ''] }), _jsx("div", { className: `text-xs ${c.certeza === 'alta' ? 'text-success' : 'text-warning'}`, children: c.motivo })] }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => vincularSugerida(c.id), className: `${botonClases} sm:shrink-0`, children: "Vincular" })] }, c.id)))] })), aviso && _jsx("div", { className: "border-l-2 border-success text-success bg-graphite px-4 py-3 rounded-sharp text-sm mb-3", children: aviso }), error && _jsx(ErrorBanner, { message: `No se pudo completar la operación: ${error}` }), cargando ? (_jsx(ListSkeleton, { rows: 3 })) : (_jsxs(_Fragment, { children: [causas.length > 0 && (_jsx("div", { className: "flex flex-wrap gap-2 mb-3", children: causas.map((c) => (_jsxs("div", { className: "flex items-center gap-2 border border-line rounded-sharp px-2 py-1 text-xs text-silver", children: [_jsx("span", { className: "font-mono", children: c.numero_causa }), c.organismo && _jsxs("span", { className: "text-text-gray-light", children: ["\u00B7 ", c.organismo] }), _jsx("button", { type: "button", onClick: () => desvincular(c), "aria-label": `Desvincular la causa ${c.numero_causa}`, className: "ml-1 text-text-gray-light hover:text-warning", children: "\u00D7" })] }, c.id))) })), novedades.length === 0 ? (_jsx(EmptyState, { message: causas.length === 0
                            ? 'Todavía no hay novedades del portal en este expediente. Vinculá la causa del portal para que lleguen acá.'
                            : 'La causa está vinculada, pero todavía no llegó ninguna novedad. Las próximas van a aparecer acá.' })) : (_jsxs("div", { children: [novedades.map((n) => {
                                const revisada = n.revisada_en !== null;
                                return (_jsxs("article", { className: "py-3 border-b border-line", children: [_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4", children: [_jsxs("div", { className: "flex-1 min-w-0 flex flex-col gap-0.5", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsx("span", { className: "font-medium text-white break-words", children: n.tipo ?? 'Notificación del portal' }), _jsx(EstadoBadge, { estado: revisada ? 'Revisada' : 'Pendiente', colorMap: { Revisada: 'success', Pendiente: 'warning' } })] }), _jsxs("div", { className: "text-xs font-mono text-text-gray-light", children: [n.numero_causa, n.fecha_notificacion && ` · Notificada ${formatearFecha(n.fecha_notificacion)}`, !n.fecha_notificacion && n.fecha_alta && ` · Alta ${formatearFecha(n.fecha_alta)}`] }), n.texto_extracto && (_jsx("p", { className: "text-sm text-silver line-clamp-2", children: n.texto_extracto.replace(/\s+/g, ' ').trim() }))] }), _jsxs("div", { className: "flex flex-wrap items-center gap-2 sm:shrink-0", children: [_jsx(Button, { variant: "ghost", size: "sm", onClick: () => alternarRevision(n), className: botonClases, children: revisada ? 'Volver a pendiente' : 'Marcar revisada' }), enlaceSeguro(n.enlace) && (_jsx("a", { href: enlaceSeguro(n.enlace) ?? undefined, target: "_blank", rel: "noopener noreferrer", className: "text-xs text-text-gray-light hover:text-white underline-offset-4 hover:underline", children: "Abrir en el portal" })), _jsx(EnlacePlazo, { novedad: n })] })] }), !revisada && sugerencias[n.id]?.propuesta && _jsx(PropuestaPlazo, { novedad: n, propuesta: sugerencias[n.id].propuesta })] }, n.id));
                            }), total > novedades.length && (_jsxs(Link, { to: "/novedades", className: "inline-block mt-3 text-xs text-text-gray-light hover:text-white", children: ["Se muestran las ", novedades.length, " m\u00E1s recientes de ", total, ". Ver todas en Novedades"] }))] }))] }))] }));
}
function SelectorCausa({ expedienteId, onVinculada, onError, }) {
    const [causas, setCausas] = useState(null);
    const [filtro, setFiltro] = useState('');
    const [enviando, setEnviando] = useState(false);
    useEffect(() => {
        portalApi
            .listarCausas()
            .then(setCausas)
            .catch((e) => onError(e.message));
    }, [onError]);
    async function vincular(causa) {
        setEnviando(true);
        onError(null);
        try {
            const r = await portalApi.vincularCausa(expedienteId, causa.id);
            avisarCambioNovedades();
            onVinculada(r.novedades_vinculadas);
        }
        catch (e) {
            onError(e instanceof Error ? e.message : 'No se pudo vincular la causa.');
        }
        finally {
            setEnviando(false);
        }
    }
    const texto = filtro.trim().toUpperCase();
    const visibles = (causas ?? []).filter((c) => c.expediente_id !== expedienteId &&
        (texto === '' || `${c.numero_causa} ${c.caratula ?? ''} ${c.organismo ?? ''}`.toUpperCase().includes(texto)));
    return (_jsxs("div", { className: "border border-line rounded-sharp bg-graphite p-4 mb-3 flex flex-col gap-3", children: [_jsx("p", { className: "text-xs text-text-gray-light", children: "Eleg\u00ED la causa del portal que corresponde a este expediente. Solo aparecen las causas importadas con la extensi\u00F3n." }), _jsx(Input, { value: filtro, onChange: (e) => setFiltro(e.target.value), placeholder: "Buscar por n\u00FAmero, car\u00E1tula o juzgado", "aria-label": "Buscar causa del portal", className: "rounded-sharp bg-structural-black border-line focus-visible:ring-silver" }), causas === null ? (_jsx(ListSkeleton, { rows: 2 })) : visibles.length === 0 ? (_jsx("p", { className: "text-sm text-text-gray-light", children: "No hay causas importadas que coincidan." })) : (_jsx("div", { className: "max-h-72 overflow-y-auto flex flex-col", children: visibles.map((c) => {
                    const enOtro = c.expediente_id !== null;
                    return (_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center gap-2 py-2 border-b border-line last:border-b-0", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("div", { className: "text-sm text-white break-words", children: c.caratula ?? 'Sin carátula' }), _jsxs("div", { className: "text-xs font-mono text-text-gray-light break-words", children: [c.numero_causa, c.organismo ? ` · ${c.organismo}` : ''] }), enOtro && (_jsxs("div", { className: "text-xs text-warning", children: ["Ya vinculada con: ", c.expediente_caratula ?? 'otro expediente'] }))] }), _jsx(Button, { variant: "ghost", size: "sm", disabled: enviando || enOtro, onClick: () => vincular(c), className: `${botonClases} sm:shrink-0`, children: "Vincular" })] }, c.id));
                }) }))] }));
}
