import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from '@/componentes/ui/button';
/**
 * Encabezado de una pantalla: el rótulo de la sección arriba, el título grande y, si corresponde, la cantidad y la
 * acción principal. `count`, `ctaLabel` y `onCta` son opcionales para las pantallas que no listan ni crean nada.
 */
export function PageHeader({ title, eyebrow, descripcion, count, ctaLabel, onCta, ctaDisabled, }) {
    return (_jsxs("div", { className: "mb-8 flex flex-wrap items-end justify-between gap-x-4 gap-y-3", children: [_jsxs("div", { className: "min-w-0", children: [eyebrow && _jsx("p", { className: "eyebrow", children: eyebrow }), _jsxs("h1", { className: "mt-1.5 flex items-baseline gap-3 text-[28px] font-black leading-tight text-white sm:text-[32px]", children: [title, count !== undefined && _jsx("span", { className: "text-base font-light tabular-nums text-text-gray-light", children: count })] }), descripcion && _jsx("p", { className: "mt-1.5 max-w-2xl text-sm text-silver-deep", children: descripcion })] }), ctaLabel && onCta && (_jsx(Button, { onClick: onCta, disabled: ctaDisabled, className: "rounded-sharp bg-gradient-to-br from-silver via-silver-deep to-silver text-structural-black font-bold uppercase tracking-[0.08em] text-xs hover:brightness-110 focus-visible:ring-2 focus-visible:ring-silver", children: ctaLabel }))] }));
}
