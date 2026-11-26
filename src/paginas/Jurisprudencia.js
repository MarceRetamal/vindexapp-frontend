import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { CheckIcon, ChevronDownIcon, CopyIcon, ExternalLinkIcon, SearchIcon } from 'lucide-react';
import { Button } from '@/componentes/ui/button';
import { api } from '../api/jurisprudencia';
import { Chips } from '../componentes/BarraFiltros';
import { EmptyState } from '../componentes/EmptyState';
import { ErrorBanner } from '../componentes/ErrorBanner';
import { ListSkeleton } from '../componentes/ListSkeleton';
import { PageHeader } from '../componentes/PageHeader';
import { enlaceSeguro } from '../lib/texto';
const botonPrincipal = 'rounded-sharp bg-gradient-to-br from-silver via-silver-deep to-silver text-structural-black font-bold uppercase tracking-[0.08em] text-xs hover:brightness-110 focus-visible:ring-2 focus-visible:ring-silver';
const botonSecundario = 'rounded-sharp border border-line text-text-gray-light hover:text-white';
const JURISDICCIONES = [
    { valor: 'todas', texto: 'Todas' },
    { valor: 'buenos_aires', texto: 'Provincia de Buenos Aires' },
    { valor: 'federal', texto: 'Federal' },
    { valor: 'nacional', texto: 'Nacional' },
];
/** Buscadores oficiales que no se pueden consultar desde el sistema: se abren en otra pestaña. */
const FUENTES_OFICIALES = [
    { nombre: 'CSJN, fallos completos', url: 'https://sjconsulta.csjn.gov.ar/sjconsulta/fallos/consulta.html' },
    { nombre: 'SCBA, JUBA', url: 'https://juba.scba.gov.ar/Busquedas.aspx' },
];
function fechaLegible(iso) {
    const [anio, mes, dia] = iso.split('-');
    return `${dia}/${mes}/${anio}`;
}
/** Lo que SAIJ informa del sumario, tal cual: no se completa nada que la fuente no diga. */
function citaDe(r) {
    const partes = [r.titulo, r.numero_sumario ? `sumario ${r.numero_sumario}` : null, r.fecha ? fechaLegible(r.fecha) : null, 'SAIJ', r.enlace];
    return partes.filter(Boolean).join(', ');
}
/**
 * Buscador de jurisprudencia. Consulta SAIJ (Ministerio de Justicia) y muestra los sumarios; cada uno se abre acá
 * mismo y enlaza a la fuente. La búsqueda queda en la dirección (?q=…), así se puede volver atrás o compartirla.
 */
export function Jurisprudencia() {
    const [params, setParams] = useSearchParams();
    const consulta = params.get('q') ?? '';
    const jurisdiccion = (JURISDICCIONES.find((j) => j.valor === params.get('j'))?.valor ?? 'todas');
    const [texto, setTexto] = useState(consulta);
    const [pagina, setPagina] = useState(null);
    const [resultados, setResultados] = useState([]);
    const [buscando, setBuscando] = useState(false);
    const [cargandoMas, setCargandoMas] = useState(false);
    const [error, setError] = useState(null);
    const pedidoActual = useRef(0);
    useEffect(() => {
        setTexto(consulta);
        if (consulta.trim().length < 3) {
            setPagina(null);
            setResultados([]);
            setError(null);
            return;
        }
        const turno = ++pedidoActual.current;
        setBuscando(true);
        setError(null);
        api
            .buscar(consulta, jurisdiccion, 1)
            .then((p) => {
            if (turno !== pedidoActual.current)
                return;
            setPagina(p);
            setResultados(p.resultados);
        })
            .catch((e) => {
            if (turno !== pedidoActual.current)
                return;
            setPagina(null);
            setResultados([]);
            setError(e.message);
        })
            .finally(() => {
            if (turno === pedidoActual.current)
                setBuscando(false);
        });
    }, [consulta, jurisdiccion]);
    function buscar(e) {
        e.preventDefault();
        const q = texto.trim();
        if (q.length < 3)
            return;
        setParams(jurisdiccion === 'todas' ? { q } : { q, j: jurisdiccion });
    }
    function cambiarJurisdiccion(j) {
        const siguiente = {};
        if (consulta)
            siguiente.q = consulta;
        if (j !== 'todas')
            siguiente.j = j;
        setParams(siguiente);
    }
    async function cargarMas() {
        if (!pagina)
            return;
        setCargandoMas(true);
        try {
            const p = await api.buscar(consulta, jurisdiccion, pagina.pagina + 1);
            setPagina(p);
            setResultados((previos) => [...previos, ...p.resultados.filter((r) => !previos.some((x) => x.id === r.id))]);
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'No se pudieron cargar más resultados.');
        }
        finally {
            setCargandoMas(false);
        }
    }
    const hayMas = pagina !== null && pagina.resultados.length === pagina.por_pagina && resultados.length < pagina.total;
    return (_jsxs("div", { children: [_jsx(PageHeader, { eyebrow: "Causas", title: "Jurisprudencia", descripcion: "Sumarios de jurisprudencia de todo el pa\u00EDs, de la base oficial del Ministerio de Justicia (SAIJ)." }), _jsxs("form", { onSubmit: buscar, className: "flex flex-col gap-3 sm:flex-row", role: "search", children: [_jsxs("div", { className: "superficie flex h-12 min-w-0 flex-1 items-center gap-3 px-4 focus-within:border-silver", children: [_jsx(SearchIcon, { className: "h-[18px] w-[18px] shrink-0 text-silver-deep", strokeWidth: 1.6, "aria-hidden": "true" }), _jsx("input", { type: "search", value: texto, onChange: (e) => setTexto(e.target.value), placeholder: "Por ejemplo: caducidad de instancia, cuidado personal, da\u00F1o moral", "aria-label": "Buscar jurisprudencia", autoFocus: true, maxLength: 200, className: "sin-contorno min-w-0 flex-1 bg-transparent text-[15px] text-white outline-none placeholder:text-text-gray-light [&::-webkit-search-cancel-button]:hidden" })] }), _jsx(Button, { type: "submit", className: `${botonPrincipal} h-12 px-6`, disabled: buscando || texto.trim().length < 3, children: buscando ? 'Buscando…' : 'Buscar' })] }), _jsx("div", { className: "mt-4", children: _jsx(Chips, { etiqueta: "Jurisdicci\u00F3n", valor: jurisdiccion, opciones: JURISDICCIONES, onCambio: cambiarJurisdiccion }) }), _jsxs("div", { className: "mt-6", children: [error && _jsx(ErrorBanner, { message: error }), buscando && _jsx(ListSkeleton, { rows: 4 }), !buscando && !error && consulta.trim().length < 3 && (_jsx(EmptyState, { message: "Escrib\u00ED el tema que necesit\u00E1s y toc\u00E1 Buscar. Los resultados son sumarios: el criterio del tribunal resumido, con el enlace a la fuente." })), !buscando && !error && pagina !== null && resultados.length === 0 && (_jsx(EmptyState, { message: `No hay sumarios para "${pagina.consulta}"${jurisdiccion === 'todas' ? '' : ' en esa jurisdicción'}. Probá con menos palabras o con otro término.` })), !buscando && pagina !== null && resultados.length > 0 && (_jsxs(_Fragment, { children: [_jsxs("p", { className: "mb-3 text-xs text-text-gray-light", "aria-live": "polite", children: [pagina.total.toLocaleString('es-AR'), " ", pagina.total === 1 ? 'sumario' : 'sumarios', " para \"", pagina.consulta, "\", los m\u00E1s recientes primero."] }), _jsx("ul", { className: "flex flex-col gap-3", children: resultados.map((r) => (_jsx(Sumario, { resultado: r }, r.id))) }), hayMas && (_jsx("div", { className: "mt-5 flex justify-center", children: _jsx(Button, { variant: "ghost", className: botonSecundario, onClick: () => void cargarMas(), disabled: cargandoMas, children: cargandoMas ? 'Cargando…' : 'Ver más resultados' }) }))] }))] }), _jsxs("section", { className: "mt-10 border-t border-line pt-6", "aria-label": "Otras fuentes oficiales", children: [_jsx("p", { className: "eyebrow", children: "Otras fuentes oficiales" }), _jsx("p", { className: "mt-2 max-w-2xl text-xs leading-relaxed text-text-gray-light", children: "Los buscadores de la Corte Suprema y de la Suprema Corte bonaerense no permiten consultarse desde otro sistema. Se abren en una pesta\u00F1a nueva." }), _jsx("div", { className: "mt-3 flex flex-wrap gap-2", children: FUENTES_OFICIALES.map((f) => (_jsxs("a", { href: f.url, target: "_blank", rel: "noopener noreferrer", className: "inline-flex h-9 items-center gap-2 rounded-sharp border border-line px-3.5 text-[13px] text-silver-deep transition-colors hover:border-silver-deep hover:text-white", children: [f.nombre, _jsx(ExternalLinkIcon, { className: "h-3.5 w-3.5", strokeWidth: 1.6, "aria-hidden": "true" })] }, f.url))) })] })] }));
}
function Sumario({ resultado: r }) {
    const [abierto, setAbierto] = useState(false);
    const [documento, setDocumento] = useState(null);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);
    const [copiado, setCopiado] = useState(null);
    const enlace = enlaceSeguro(r.enlace);
    function alternar() {
        const siguiente = !abierto;
        setAbierto(siguiente);
        if (!siguiente || documento || cargando)
            return;
        setCargando(true);
        setError(null);
        api
            .documento(r.id)
            .then(setDocumento)
            .catch((e) => setError(e.message))
            .finally(() => setCargando(false));
    }
    async function copiar(que) {
        const contenido = que === 'cita' ? citaDe(r) : `${(documento?.parrafos ?? [r.extracto]).join('\n\n')}\n\n(${citaDe(r)})`;
        try {
            await navigator.clipboard.writeText(contenido);
            setCopiado(que);
            window.setTimeout(() => setCopiado(null), 2000);
        }
        catch {
            setError('El navegador no permitió copiar. Seleccioná el texto y copialo a mano.');
        }
    }
    const datos = [r.fecha ? fechaLegible(r.fecha) : null, r.jurisdiccion, r.tipo_tribunal ? `Tribunal: ${r.tipo_tribunal}` : null, r.numero_sumario ? `Sumario ${r.numero_sumario}` : null].filter(Boolean);
    const idPanel = `sumario-${r.id}`;
    return (_jsxs("li", { className: "superficie p-5", children: [_jsxs("button", { type: "button", onClick: alternar, "aria-expanded": abierto, "aria-controls": idPanel, className: "flex w-full items-start gap-3 text-left", children: [_jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("h2", { className: "text-[15px] font-bold leading-snug text-white first-letter:uppercase", children: r.titulo }), datos.length > 0 && _jsx("p", { className: "mt-1 text-xs text-text-gray-light", children: datos.join(' · ') }), !abierto && r.extracto && _jsx("p", { className: "mt-2 line-clamp-3 text-sm leading-relaxed text-silver-deep", children: r.extracto })] }), _jsx(ChevronDownIcon, { className: `mt-0.5 h-5 w-5 shrink-0 text-silver-deep transition-transform ${abierto ? 'rotate-180' : ''}`, strokeWidth: 1.6, "aria-hidden": "true" })] }), abierto && (_jsxs("div", { id: idPanel, className: "mt-4 border-t border-line pt-4", children: [cargando && _jsx("p", { className: "text-sm text-text-gray-light", children: "Trayendo el sumario completo\u2026" }), error && _jsx("p", { role: "alert", className: "text-sm text-warning", children: error }), (documento?.parrafos ?? (cargando ? [] : [r.extracto])).map((p, i) => (_jsx("p", { className: "mb-3 max-w-3xl text-sm leading-relaxed text-silver", children: p }, i))), documento?.materia && _jsxs("p", { className: "text-xs text-text-gray-light", children: ["Materia: ", documento.materia.toLowerCase()] }), r.voces.length > 0 && _jsxs("p", { className: "mt-1 text-xs text-text-gray-light", children: ["Voces: ", r.voces.join(', ')] }), _jsxs("div", { className: "mt-4 flex flex-wrap gap-2", children: [_jsxs(Button, { variant: "ghost", size: "sm", className: botonSecundario, onClick: () => void copiar('texto'), disabled: cargando, children: [copiado === 'texto' ? _jsx(CheckIcon, { "aria-hidden": "true" }) : _jsx(CopyIcon, { "aria-hidden": "true" }), copiado === 'texto' ? 'Copiado' : 'Copiar texto y cita'] }), _jsxs(Button, { variant: "ghost", size: "sm", className: botonSecundario, onClick: () => void copiar('cita'), children: [copiado === 'cita' ? _jsx(CheckIcon, { "aria-hidden": "true" }) : _jsx(CopyIcon, { "aria-hidden": "true" }), copiado === 'cita' ? 'Copiada' : 'Copiar cita'] }), enlace && (_jsxs("a", { href: enlace, target: "_blank", rel: "noopener noreferrer", className: "inline-flex h-7 items-center gap-1.5 rounded-sharp border border-line px-2.5 text-[0.8rem] text-text-gray-light transition-colors hover:text-white", children: ["Abrir en SAIJ", _jsx(ExternalLinkIcon, { className: "h-3.5 w-3.5", strokeWidth: 1.6, "aria-hidden": "true" })] }))] })] }))] }));
}
