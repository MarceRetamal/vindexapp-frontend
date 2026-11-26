import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { CornerDownLeftIcon, FolderOpenIcon, SearchIcon, UsersIcon } from 'lucide-react';
import { api as clientesApi } from '../api/cliente';
import { api as expedientesApi } from '../api/expedientes';
import { EVENTO_PALETA, SECCIONES } from '../navegacion';
/** Compara sin tildes ni mayúsculas: "Rodriguez" encuentra "Rodríguez". */
function normalizar(texto) {
    return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}
function coincide(tokens, texto) {
    const base = normalizar(texto);
    return tokens.every((t) => base.includes(t));
}
/**
 * Búsqueda rápida (Ctrl+K o ⌘K): expedientes, clientes y pantallas desde cualquier lugar, sin sacar las manos
 * del teclado. Carga las listas la primera vez que se abre y filtra en el navegador.
 */
export function PaletaComandos() {
    const navegar = useNavigate();
    const [abierta, setAbierta] = useState(false);
    const [consulta, setConsulta] = useState('');
    const [indice, setIndice] = useState(0);
    const [datos, setDatos] = useState(null);
    const [cargando, setCargando] = useState(false);
    const entrada = useRef(null);
    const foco = useRef(null);
    useEffect(() => {
        const alTeclear = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setAbierta((a) => !a);
            }
        };
        const alPedirla = () => setAbierta(true);
        window.addEventListener('keydown', alTeclear);
        window.addEventListener(EVENTO_PALETA, alPedirla);
        return () => {
            window.removeEventListener('keydown', alTeclear);
            window.removeEventListener(EVENTO_PALETA, alPedirla);
        };
    }, []);
    useEffect(() => {
        if (!abierta) {
            if (foco.current instanceof HTMLElement)
                foco.current.focus();
            return;
        }
        foco.current = document.activeElement;
        setConsulta('');
        setIndice(0);
        requestAnimationFrame(() => entrada.current?.focus());
        if (datos || cargando)
            return;
        setCargando(true);
        Promise.allSettled([expedientesApi.listarExpedientes(), clientesApi.listarClientes()]).then(([e, c]) => {
            setDatos({
                expedientes: e.status === 'fulfilled' ? e.value : [],
                clientes: c.status === 'fulfilled' ? c.value : [],
            });
            setCargando(false);
        });
        // Solo reacciona a abrir y cerrar.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [abierta]);
    const opciones = useMemo(() => {
        const tokens = normalizar(consulta).split(/\s+/).filter(Boolean);
        const pantallas = SECCIONES.filter((s) => tokens.length === 0 || coincide(tokens, s.etiqueta)).map((s) => ({
            id: `pantalla:${s.ruta}`,
            grupo: 'Ir a',
            titulo: s.etiqueta,
            icono: s.icono,
            ir: s.ruta,
        }));
        if (tokens.length === 0 || !datos)
            return pantallas;
        const expedientes = datos.expedientes
            .filter((x) => coincide(tokens, `${x.caratula} ${x.numero ?? ''} ${x.juzgado ?? ''}`))
            .slice(0, 6)
            .map((x) => ({
            id: `expediente:${x.id}`,
            grupo: 'Expedientes',
            titulo: x.caratula,
            detalle: [x.numero, x.juzgado].filter(Boolean).join(' · '),
            icono: FolderOpenIcon,
            ir: `/expedientes/${x.id}`,
        }));
        const clientes = datos.clientes
            .filter((x) => coincide(tokens, `${x.apellido} ${x.nombre} ${x.dni ?? ''}`))
            .slice(0, 5)
            .map((x) => ({
            id: `cliente:${x.id}`,
            grupo: 'Clientes',
            titulo: `${x.apellido}, ${x.nombre}`,
            detalle: x.dni ? `DNI ${x.dni}` : undefined,
            icono: UsersIcon,
            ir: `/clientes/${x.id}`,
        }));
        return [...expedientes, ...clientes, ...pantallas];
    }, [consulta, datos]);
    useEffect(() => {
        setIndice(0);
    }, [consulta]);
    useEffect(() => {
        document.getElementById(`opcion-paleta-${indice}`)?.scrollIntoView({ block: 'nearest' });
    }, [indice]);
    if (!abierta)
        return null;
    const elegir = (o) => {
        if (!o)
            return;
        setAbierta(false);
        navegar(o.ir);
    };
    const alTeclear = (e) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            setAbierta(false);
        }
        else if (e.key === 'ArrowDown') {
            e.preventDefault();
            setIndice((i) => Math.min(i + 1, opciones.length - 1));
        }
        else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setIndice((i) => Math.max(i - 1, 0));
        }
        else if (e.key === 'Enter') {
            e.preventDefault();
            elegir(opciones[indice]);
        }
    };
    return (_jsxs("div", { className: "fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]", onKeyDown: alTeclear, children: [_jsx("button", { type: "button", "aria-label": "Cerrar la b\u00FAsqueda", onClick: () => setAbierta(false), className: "absolute inset-0 bg-black/75 backdrop-blur-[2px]", tabIndex: -1 }), _jsxs("div", { role: "dialog", "aria-modal": "true", "aria-label": "Buscar", className: "superficie aparecer relative w-full max-w-xl overflow-hidden shadow-2xl shadow-black/60", children: [_jsxs("div", { className: "flex items-center gap-3 border-b border-line px-4", children: [_jsx(SearchIcon, { className: "h-[18px] w-[18px] shrink-0 text-silver-deep", strokeWidth: 1.6 }), _jsx("input", { ref: entrada, value: consulta, onChange: (e) => setConsulta(e.target.value), placeholder: "Buscar un expediente, un cliente o una pantalla", role: "combobox", "aria-expanded": "true", "aria-controls": "lista-paleta", "aria-activedescendant": opciones[indice] ? `opcion-paleta-${indice}` : undefined, className: "sin-contorno h-14 w-full bg-transparent text-[15px] text-white placeholder:text-text-gray-light outline-none" })] }), _jsxs("ul", { id: "lista-paleta", role: "listbox", className: "max-h-[52vh] overflow-y-auto py-2", children: [opciones.length === 0 && (_jsx("li", { className: "px-5 py-8 text-center text-sm text-text-gray-light", children: cargando ? 'Buscando…' : 'No encontramos nada con esa búsqueda.' })), opciones.map((o, i) => {
                                const Icono = o.icono;
                                const nuevoGrupo = i === 0 || opciones[i - 1]?.grupo !== o.grupo;
                                return (_jsxs("li", { role: "presentation", children: [nuevoGrupo && _jsx("div", { className: "eyebrow px-5 pb-1.5 pt-3", children: o.grupo }), _jsxs("div", { id: `opcion-paleta-${i}`, role: "option", "aria-selected": i === indice, onMouseMove: () => setIndice(i), onClick: () => elegir(o), className: `mx-2 flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 ${i === indice ? 'bg-graphite-raised' : ''}`, children: [_jsx(Icono, { className: `h-[18px] w-[18px] shrink-0 ${i === indice ? 'text-silver' : 'text-silver-deep'}`, strokeWidth: 1.6 }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("div", { className: "truncate text-sm text-white", children: o.titulo }), o.detalle && _jsx("div", { className: "truncate text-xs text-text-gray-light", children: o.detalle })] }), i === indice && _jsx(CornerDownLeftIcon, { className: "h-4 w-4 shrink-0 text-silver-deep", strokeWidth: 1.6, "aria-hidden": "true" })] })] }, o.id));
                            })] }), _jsxs("div", { className: "flex items-center gap-4 border-t border-line px-5 py-2.5 text-[11px] text-text-gray-light", children: [_jsx("span", { children: "\u2191 \u2193 para moverte" }), _jsx("span", { children: "Enter para abrir" }), _jsx("span", { children: "Esc para cerrar" })] })] })] }));
}
