import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import isotipo from '@/assets/marca/isotipo.png';
import isologo from '@/assets/marca/isologo.png';
/*
 * Elementos de marca (manual de identidad VINDEX LEGAL, edición 2026).
 *
 * Los archivos del logo traen fondo casi negro (no exactamente #07090C). `mix-blend-lighten` deja pasar solo
 * lo más claro entre la imagen y el fondo, así el isotipo se apoya sobre el Negro Estructural sin que se
 * dibuje un recuadro. Por eso estos componentes tienen que ir siempre sobre fondo Negro Estructural.
 */
/** Isotipo "V" cromado aislado, para formatos reducidos. */
export function Isotipo({ tamano = 40, className = '' }) {
    return (_jsx("img", { src: isotipo, alt: "", width: tamano, height: tamano, className: `mix-blend-lighten select-none ${className}`, draggable: false }));
}
/** Wordmark en tipografía de marca: VINDEX en Black, LEGAL en Light, mayúsculas con tracking amplio. */
export function Wordmark({ className = '' }) {
    return (_jsxs("div", { className: `leading-none ${className}`, "aria-label": "VINDEX LEGAL", children: [_jsx("div", { className: "text-[17px] font-black uppercase tracking-[0.34em] text-white", children: "Vindex" }), _jsx("div", { className: "mt-1.5 text-[9px] font-light uppercase tracking-[0.62em] text-silver", children: "Legal" })] }));
}
/** Pantalla completa de marca (arranque, error de sesión): isologo vertical de máxima jerarquía. */
export function PantallaMarca({ titulo, detalle }) {
    return (_jsxs("div", { className: "min-h-screen bg-structural-black flex flex-col items-center justify-center px-6 text-center", children: [_jsx("img", { src: isologo, alt: "VINDEX LEGAL", width: 160, className: "aparecer mix-blend-lighten select-none", draggable: false }), _jsx("div", { className: "mt-10 h-px w-10 bg-silver-deep" }), _jsx("p", { className: "mt-6 text-xs font-light uppercase tracking-[0.3em] text-silver", children: titulo }), detalle && _jsx("p", { className: "mt-3 max-w-sm text-sm text-text-gray-light", children: detalle })] }));
}
