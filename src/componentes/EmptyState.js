import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/** Lista vacía: dice qué pasa y, si hay un paso siguiente, lo ofrece. */
export function EmptyState({ message, accion }) {
    return (_jsxs("div", { className: "superficie border-dashed px-6 py-14 text-center", children: [_jsx("p", { className: "mx-auto max-w-md text-sm leading-relaxed text-text-gray-light", children: message }), accion && _jsx("div", { className: "mt-5", children: accion })] }));
}
