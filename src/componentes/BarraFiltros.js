import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { SearchIcon, XIcon } from 'lucide-react';
/** Campo de búsqueda de una lista: filtra mientras se escribe. */
export function CampoBusqueda({ valor, onCambio, placeholder, etiqueta }) {
    return (_jsxs("div", { className: "superficie flex h-10 w-full items-center gap-2.5 px-3 focus-within:border-silver sm:max-w-sm", children: [_jsx(SearchIcon, { className: "h-4 w-4 shrink-0 text-silver-deep", strokeWidth: 1.6, "aria-hidden": "true" }), _jsx("input", { type: "search", value: valor, onChange: (e) => onCambio(e.target.value), placeholder: placeholder, "aria-label": etiqueta, className: "sin-contorno min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-text-gray-light [&::-webkit-search-cancel-button]:hidden" }), valor && (_jsx("button", { type: "button", onClick: () => onCambio(''), "aria-label": "Borrar la b\u00FAsqueda", className: "text-silver-deep hover:text-white", children: _jsx(XIcon, { className: "h-4 w-4", strokeWidth: 1.6 }) }))] }));
}
/** Filtros en forma de píldoras, con la cantidad de cada uno. */
export function Chips({ etiqueta, valor, opciones, onCambio, }) {
    return (_jsx("div", { className: "flex flex-wrap gap-2", role: "group", "aria-label": etiqueta, children: opciones.map((o) => {
            const activo = o.valor === valor;
            return (_jsxs("button", { type: "button", "aria-pressed": activo, onClick: () => onCambio(o.valor), className: `inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-[13px] transition-colors ${activo ? 'border-silver bg-graphite-raised font-bold text-white' : 'border-line text-silver-deep hover:border-silver-deep hover:text-white'}`, children: [o.texto, o.cantidad !== undefined && _jsx("span", { className: `tabular-nums ${activo ? 'text-silver' : 'text-text-gray-light'}`, children: o.cantidad })] }, o.valor));
        }) }));
}
