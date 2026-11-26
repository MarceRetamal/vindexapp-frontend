import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { apiAsignacion } from '../api/cliente';
import { ErrorBanner } from './ErrorBanner';
import { SelectorRol } from './RolProfesional';
import { Button } from '@/componentes/ui/button';
import { coincide } from '../lib/texto';
/**
 * Expedientes que el sistema ya trajo del portal y todavía no tienen cliente: se eligen y se asignan a este cliente,
 * con el rol del abogado en cada uno. Los que pueden ser suyos por la carátula aparecen primero y marcados. Si el
 * cliente va a iniciar una causa, todavía no hay expediente en el portal: el vínculo queda pendiente hasta que
 * aparezca (la lectura de "Mis Causas" es diaria).
 */
export function PanelAsignarExpedientes({ clienteId, onAsignado }) {
    const [disponibles, setDisponibles] = useState(null);
    const [elegidos, setElegidos] = useState(new Set());
    const [rol, setRol] = useState(null);
    const [busqueda, setBusqueda] = useState('');
    const [verTodos, setVerTodos] = useState(false);
    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState(null);
    const [aviso, setAviso] = useState(null);
    function cargar() {
        apiAsignacion
            .disponibles(clienteId)
            .then((d) => {
            setDisponibles(d);
            setElegidos(new Set(d.filter((e) => e.certeza === 'alta').map((e) => e.id)));
        })
            .catch((e) => setError(e.message));
    }
    useEffect(cargar, [clienteId]);
    const sugeridos = (disponibles ?? []).filter((e) => e.certeza !== null);
    const visibles = useMemo(() => {
        const base = verTodos || busqueda.trim() ? disponibles ?? [] : sugeridos;
        return base.filter((e) => coincide(busqueda, `${e.caratula} ${e.numero ?? ''} ${e.juzgado ?? ''}`)).slice(0, 60);
    }, [disponibles, sugeridos, verTodos, busqueda]);
    async function asignar() {
        setEnviando(true);
        setError(null);
        try {
            const r = await apiAsignacion.asignar(clienteId, [...elegidos], rol);
            setAviso(`${String(r.asignados)} expediente${r.asignados === 1 ? '' : 's'} asignado${r.asignados === 1 ? '' : 's'}.`);
            setElegidos(new Set());
            cargar();
            onAsignado?.();
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'No se pudo asignar.');
        }
        finally {
            setEnviando(false);
        }
    }
    if (disponibles === null)
        return null;
    return (_jsxs("section", { className: "superficie p-5", children: [_jsx("h2", { className: "eyebrow mb-1 text-silver", children: "Expedientes sincronizados sin cliente" }), _jsx("p", { className: "mb-4 text-xs leading-relaxed text-text-gray-light", children: "Causas que el sistema trajo del portal y todav\u00EDa no tienen cliente. Si este cliente va a iniciar una causa, el v\u00EDnculo queda pendiente hasta que aparezca en el portal." }), error && _jsx(ErrorBanner, { message: error }), aviso && _jsx("p", { className: "mb-3 text-sm text-success", children: aviso }), disponibles.length === 0 ? (_jsx("p", { className: "text-sm text-silver-deep", children: "No hay expedientes sin cliente. Cuando el portal traiga una causa nueva, va a aparecer ac\u00E1." })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "mb-3 flex flex-wrap items-center gap-2", children: [_jsx("input", { type: "search", value: busqueda, onChange: (e) => setBusqueda(e.target.value), placeholder: "Buscar por car\u00E1tula, n\u00FAmero o juzgado", "aria-label": "Buscar expediente sin cliente", className: "h-9 min-w-[220px] flex-1 rounded-sharp border border-line bg-graphite px-3 text-sm text-white placeholder:text-text-gray-light" }), !busqueda && (_jsx("button", { type: "button", onClick: () => setVerTodos((v) => !v), className: "text-xs text-silver underline-offset-2 hover:underline", children: verTodos ? 'Ver solo sugeridos' : `Ver los ${String(disponibles.length)}` }))] }), visibles.length === 0 ? (_jsx("p", { className: "text-sm text-silver-deep", children: sugeridos.length === 0 && !busqueda ? 'Ninguna carátula coincide con el nombre del cliente. Buscá el expediente o tocá "Ver" para elegirlo de la lista.' : 'Ningún expediente coincide con la búsqueda.' })) : (_jsx("ul", { className: "mb-4 max-h-80 overflow-y-auto", children: visibles.map((e) => (_jsx("li", { children: _jsxs("label", { className: "flex cursor-pointer items-start gap-3 border-b border-line py-2.5", children: [_jsx("input", { type: "checkbox", className: "mt-1 accent-silver", checked: elegidos.has(e.id), onChange: () => setElegidos((prev) => {
                                            const n = new Set(prev);
                                            if (n.has(e.id))
                                                n.delete(e.id);
                                            else
                                                n.add(e.id);
                                            return n;
                                        }) }), _jsxs("span", { className: "min-w-0 flex-1", children: [_jsx("span", { className: "block text-sm font-medium text-white", children: e.caratula }), _jsx("span", { className: "block text-xs text-text-gray-light", children: [e.numero, e.juzgado].filter(Boolean).join(' · ') }), e.certeza && _jsx("span", { className: `text-[11px] ${e.certeza === 'alta' ? 'text-success' : 'text-warning'}`, children: e.motivo })] })] }) }, e.id))) })), _jsxs("div", { className: "flex flex-col gap-3", children: [_jsxs("div", { children: [_jsxs("p", { className: "mb-1.5 text-xs text-text-gray-light", children: ["Tu rol en ", elegidos.size === 1 ? 'ese expediente' : 'esos expedientes'] }), _jsx(SelectorRol, { valor: rol, onCambio: setRol })] }), _jsx(Button, { disabled: elegidos.size === 0 || enviando, onClick: () => void asignar(), className: "self-start rounded-sharp bg-gradient-to-br from-silver via-silver-deep to-silver text-structural-black font-bold hover:brightness-110 disabled:opacity-50", children: enviando ? 'Asignando…' : `Asignar ${elegidos.size > 0 ? String(elegidos.size) : ''} a este cliente` })] })] }))] }));
}
