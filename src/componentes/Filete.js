import { jsx as _jsx } from "react/jsx-runtime";
/** Filete de plata bajo el título de una pantalla: línea fina y un tramo corto de Plata Vindex. */
export function Filete({ className = '' }) {
    return (_jsx("div", { className: `relative h-px bg-line ${className}`, "aria-hidden": "true", children: _jsx("span", { className: "absolute left-0 -top-px h-[3px] w-10 bg-silver" }) }));
}
