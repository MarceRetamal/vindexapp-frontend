import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Skeleton } from '@/componentes/ui/skeleton';
export function ListSkeleton({ rows }) {
    return (_jsx("div", { className: "flex flex-col gap-2", "aria-busy": "true", "aria-label": "Cargando", children: Array.from({ length: rows }).map((_, i) => (_jsxs("div", { className: "superficie flex items-center gap-4 p-3.5", children: [_jsx(Skeleton, { className: "h-12 w-12 shrink-0 rounded-md" }), _jsxs("div", { className: "flex flex-1 flex-col gap-2", children: [_jsx(Skeleton, { className: "h-4 w-1/3" }), _jsx(Skeleton, { className: "h-3 w-1/4" })] })] }, i))) }));
}
