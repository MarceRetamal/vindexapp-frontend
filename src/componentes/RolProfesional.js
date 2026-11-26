import { jsx as _jsx } from "react/jsx-runtime";
/**
 * Papel del abogado en cada expediente: abogado particular, defensor designado por el DEAS o asesor ad hoc de
 * incapaces. Se muestra siempre igual en toda la app, para reconocerlo de un vistazo. Paleta de la marca: el DEAS va
 * en plata llena (es lo que más volumen tiene y lo que más hay que distinguir), el resto con contorno.
 */
export const ROLES = [
    { valor: 'particular', texto: 'Abogado particular', corto: 'Particular' },
    { valor: 'deas', texto: 'Defensor DEAS', corto: 'DEAS' },
    { valor: 'asesor_incapaces', texto: 'Asesor de incapaces', corto: 'Asesor' },
];
const ESTILO = {
    deas: 'bg-silver text-structural-black border-silver',
    particular: 'border-silver/60 text-silver',
    asesor_incapaces: 'border-silver-deep border-dashed text-silver-deep',
};
export function textoRol(rol) {
    return ROLES.find((r) => r.valor === rol)?.texto ?? 'Rol sin definir';
}
export function InsigniaRol({ rol, grande }) {
    const tam = grande ? 'h-6 px-2.5 text-[11px]' : 'h-5 px-1.5 text-[10px]';
    if (!rol)
        return (_jsx("span", { className: `inline-flex shrink-0 items-center rounded-sharp border border-warning/50 font-bold uppercase tracking-[0.1em] text-warning ${tam}`, title: "Marc\u00E1 tu rol en este expediente", children: "Sin rol" }));
    const r = ROLES.find((x) => x.valor === rol);
    return (_jsx("span", { className: `inline-flex shrink-0 items-center rounded-sharp border font-bold uppercase tracking-[0.1em] ${ESTILO[rol]} ${tam}`, title: r?.texto, children: r?.corto }));
}
/** Selector de rol: tres botones, con el actual marcado. */
export function SelectorRol({ valor, onCambio, deshabilitado }) {
    return (_jsx("div", { className: "flex flex-wrap gap-1.5", role: "radiogroup", "aria-label": "Rol profesional", children: ROLES.map((r) => {
            const activo = valor === r.valor;
            return (_jsx("button", { type: "button", role: "radio", "aria-checked": activo, disabled: deshabilitado, onClick: () => onCambio(activo ? null : r.valor), className: `h-8 rounded-sharp border px-3 text-xs transition-colors disabled:opacity-50 ${activo ? 'border-silver bg-silver text-structural-black font-bold' : 'border-line text-silver-deep hover:border-silver-deep hover:text-white'}`, children: r.texto }, r.valor));
        }) }));
}
