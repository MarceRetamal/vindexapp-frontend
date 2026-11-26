import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { api as clientesApi } from '../api/cliente';
import { api as expedientesApi } from '../api/expedientes';
import { api as portalApi } from '../api/portal';
import { avisarCambioNovedades } from '../api/novedades';
import { EmptyState } from './EmptyState';
import { ErrorBanner } from './ErrorBanner';
import { EstadoBadge } from './EstadoBadge';
import { ListSkeleton } from './ListSkeleton';
import { MarcaPortal } from './MarcaPortal';
import { InsigniaRol } from './RolProfesional';
import { Button } from '@/componentes/ui/button';
const tituloClases = 'text-xs font-bold text-silver mb-3 uppercase tracking-[0.2em]';
/**
 * Expedientes del cliente y causas del Portal de Notificaciones que pueden ser suyas. La sugerencia compara el
 * apellido y el nombre con la carátula; nunca vincula sola: el abogado marca cuáles son y confirma.
 */
export function PanelCausasCliente({ clienteId }) {
    const [expedientes, setExpedientes] = useState([]);
    const [sugeridas, setSugeridas] = useState([]);
    const [elegidas, setElegidas] = useState(new Set());
    const [cargando, setCargando] = useState(true);
    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState(null);
    const [aviso, setAviso] = useState(null);
    function cargar() {
        setCargando(true);
        setError(null);
        Promise.all([expedientesApi.listarDeCliente(clienteId), clientesApi.causasSugeridas(clienteId)])
            .then(([e, s]) => {
            setExpedientes(e);
            setSugeridas(s);
            // Las de certeza alta vienen marcadas; las posibles (solo apellido) las marca el abogado si corresponden.
            setElegidas(new Set(s.filter((c) => c.certeza === 'alta' && !c.expediente_existente).map((c) => c.id)));
        })
            .catch((e) => setError(e.message))
            .finally(() => setCargando(false));
    }
    useEffect(cargar, [clienteId]);
    function alternar(id) {
        setElegidas((actuales) => {
            const nuevas = new Set(actuales);
            if (nuevas.has(id))
                nuevas.delete(id);
            else
                nuevas.add(id);
            return nuevas;
        });
    }
    async function vincularConExistente(causa) {
        if (!causa.expediente_existente)
            return;
        setEnviando(true);
        setError(null);
        setAviso(null);
        try {
            const r = await portalApi.vincularCausa(causa.expediente_existente.id, causa.id);
            setAviso(`Causa vinculada con el expediente "${causa.expediente_existente.caratula}"` +
                (r.novedades_vinculadas > 0 ? `, con ${r.novedades_vinculadas} ${r.novedades_vinculadas === 1 ? 'novedad que ya estaba guardada' : 'novedades que ya estaban guardadas'}.` : '.') +
                ' Las próximas novedades entran solas.');
            avisarCambioNovedades();
            cargar();
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'No se pudo vincular la causa.');
        }
        finally {
            setEnviando(false);
        }
    }
    async function vincular() {
        setEnviando(true);
        setError(null);
        setAviso(null);
        try {
            const r = await clientesApi.crearExpedientesDesdeCausas(clienteId, [...elegidas]);
            const novedades = r.expedientes.reduce((t, e) => t + e.novedades_vinculadas, 0);
            setAviso((r.expedientes.length === 1
                ? 'Se creó 1 expediente vinculado con el portal'
                : `Se crearon ${r.expedientes.length} expedientes vinculados con el portal`) +
                (novedades > 0 ? `, con ${novedades} ${novedades === 1 ? 'novedad que ya estaba guardada' : 'novedades que ya estaban guardadas'}.` : '.') +
                ' Las próximas novedades entran solas.');
            avisarCambioNovedades();
            cargar();
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'No se pudieron vincular las causas.');
        }
        finally {
            setEnviando(false);
        }
    }
    const conExistente = sugeridas.filter((c) => c.expediente_existente);
    const paraCrear = sugeridas.filter((c) => !c.expediente_existente);
    return (_jsxs("div", { className: "flex flex-col gap-6", children: [aviso && _jsx("div", { className: "border-l-2 border-success text-success bg-graphite px-4 py-3 rounded-sharp text-sm", children: aviso }), error && _jsx(ErrorBanner, { message: `No se pudo completar la operación: ${error}` }), _jsxs("section", { children: [_jsx("h2", { className: tituloClases, children: "Expedientes" }), cargando ? (_jsx(ListSkeleton, { rows: 2 })) : expedientes.length === 0 ? (_jsx(EmptyState, { message: "Este cliente todav\u00EDa no tiene expedientes." })) : (_jsx("div", { children: expedientes.map((e) => (_jsxs(Link, { to: `/expedientes/${e.id}`, className: "flex flex-col sm:flex-row sm:items-center gap-2 py-3 border-b border-line no-underline hover:bg-white/[0.02]", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-start gap-2 font-medium text-white break-words", children: [_jsx(InsigniaRol, { rol: e.rol_profesional }), _jsx("span", { children: e.caratula })] }), _jsxs("div", { className: "text-xs font-mono text-text-gray-light break-words", children: [e.numero ? `Nº ${e.numero}` : 'Sin número', e.juzgado ? ` · ${e.juzgado}` : ''] })] }), _jsxs("div", { className: "flex flex-wrap items-center gap-2 sm:shrink-0", children: [_jsx(MarcaPortal, { causas: e.causas_portal, pendientes: e.novedades_pendientes }), _jsx(EstadoBadge, { estado: e.estado, colorMap: { Activo: 'success', 'En trámite': 'warning', Archivado: 'neutral' } })] })] }, e.id))) }))] }), !cargando && conExistente.length > 0 && (_jsxs("section", { className: "superficie p-5", children: [_jsx("h2", { className: tituloClases, children: "Causas en el portal de expedientes que ya cargaste" }), _jsx("p", { className: "text-xs text-text-gray-light mb-3", children: "Tienen el mismo n\u00FAmero que un expediente de este cliente. Vinculalas para que sus novedades lleguen a la ficha." }), _jsx("div", { className: "flex flex-col", children: conExistente.map((c) => (_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center gap-2 py-2 border-b border-line last:border-b-0", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("div", { className: "text-sm text-white break-words", children: c.caratula ?? 'Sin carátula' }), _jsxs("div", { className: "text-xs font-mono text-text-gray-light break-words", children: [c.numero_causa, c.organismo ? ` · ${c.organismo}` : ''] }), _jsx("div", { className: `text-xs ${c.certeza === 'alta' ? 'text-success' : 'text-warning'}`, children: c.motivo }), _jsxs("div", { className: "text-xs text-text-gray-light", children: ["Expediente: ", c.expediente_existente?.caratula] })] }), _jsx(Button, { variant: "ghost", size: "sm", disabled: enviando, onClick: () => vincularConExistente(c), className: "rounded-sharp border border-line text-text-gray-light hover:text-white sm:shrink-0", children: "Vincular con ese expediente" })] }, c.id))) })] })), !cargando && paraCrear.length > 0 && (_jsxs("section", { className: "superficie p-5", children: [_jsx("h2", { className: tituloClases, children: "Causas en el portal que pueden ser de este cliente" }), _jsx("p", { className: "text-xs text-text-gray-light mb-3", children: "Encontradas por el apellido y el nombre en la car\u00E1tula. Marc\u00E1 las que correspondan: por cada una se crea el expediente con los datos del portal y sus novedades pasan a la ficha." }), _jsx("div", { className: "flex flex-col", children: paraCrear.map((c) => (_jsxs("label", { className: "flex items-start gap-3 py-2 border-b border-line last:border-b-0 cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: elegidas.has(c.id), onChange: () => alternar(c.id), className: "accent-silver mt-1 w-4 h-4 shrink-0" }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("div", { className: "text-sm text-white break-words", children: c.caratula ?? 'Sin carátula' }), _jsxs("div", { className: "text-xs font-mono text-text-gray-light break-words", children: [c.numero_causa, c.organismo ? ` · ${c.organismo}` : ''] }), _jsx("div", { className: `text-xs ${c.certeza === 'alta' ? 'text-success' : 'text-warning'}`, children: c.motivo })] })] }, c.id))) }), _jsx(Button, { onClick: vincular, disabled: enviando || elegidas.size === 0, className: "mt-3 rounded-sharp bg-gradient-to-br from-silver via-silver-deep to-silver text-structural-black font-bold hover:brightness-110 focus-visible:ring-2 focus-visible:ring-silver disabled:opacity-60", children: enviando
                            ? 'Vinculando…'
                            : elegidas.size === 0
                                ? 'Marcá al menos una causa'
                                : elegidas.size === 1
                                    ? 'Crear el expediente y vincular'
                                    : `Crear ${elegidas.size} expedientes y vincular` })] }))] }));
}
