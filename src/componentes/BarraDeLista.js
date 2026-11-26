import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Chips, CampoBusqueda } from './BarraFiltros';
/** Búsqueda y filtros de una lista, en una sola barra. */
export function BarraDeLista({ busqueda, onBusqueda, placeholder, etiquetaBusqueda, filtro, onFiltro, etiquetaFiltro, opciones, }) {
    return (_jsxs("div", { className: "mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between", children: [_jsx(CampoBusqueda, { valor: busqueda, onCambio: onBusqueda, placeholder: placeholder, etiqueta: etiquetaBusqueda }), _jsx(Chips, { etiqueta: etiquetaFiltro, valor: filtro, opciones: opciones, onCambio: onFiltro })] }));
}
