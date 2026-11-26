import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { ShieldCheckIcon } from 'lucide-react';
import { api } from '../api/tareas';
function leer(calculo) {
    if (!calculo)
        return null;
    try {
        return JSON.parse(calculo);
    }
    catch {
        return null;
    }
}
function fecha(iso) {
    if (!iso)
        return '';
    const [a, m, d] = iso.split('-');
    return `${d ?? ''}/${m ?? ''}/${a ?? ''}`;
}
/**
 * Tarea creada sola a partir de un proveído: muestra de dónde salió el vencimiento (lo que dijo el proveído, la
 * notificación, el código y las normas) y deja marcarla como verificada. Mientras no se verifica, se ve en naranja.
 */
export function VerificarPlazo({ tarea, onCambio }) {
    const [abierto, setAbierto] = useState(false);
    const [ocupado, setOcupado] = useState(false);
    if (tarea.automatica !== 1)
        return null;
    const verificada = tarea.verificada_en != null;
    const c = leer(tarea.calculo);
    async function marcar(v) {
        setOcupado(true);
        try {
            await api.verificarTarea(tarea.id, v);
            onCambio();
        }
        finally {
            setOcupado(false);
        }
    }
    return (_jsxs("div", { className: `mt-1.5 rounded-sharp border px-2.5 py-1.5 text-xs ${verificada ? 'border-line text-text-gray-light' : 'border-warning/50 bg-warning/5 text-warning'}`, children: [_jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsx(ShieldCheckIcon, { className: "h-3.5 w-3.5 shrink-0", strokeWidth: 1.8, "aria-hidden": "true" }), _jsx("span", { children: verificada ? 'Vencimiento calculado automáticamente · verificado' : 'Vencimiento calculado automáticamente · falta verificarlo' }), _jsx("button", { type: "button", onClick: () => setAbierto((v) => !v), className: "underline-offset-2 hover:underline", children: abierto ? 'Ocultar cálculo' : 'Ver cálculo' }), _jsx("button", { type: "button", disabled: ocupado, onClick: () => void marcar(!verificada), className: `ml-auto rounded-sharp border px-2 py-0.5 font-bold ${verificada ? 'border-line text-silver-deep hover:text-white' : 'border-warning text-warning hover:bg-warning/10'}`, children: verificada ? 'Desmarcar' : 'Está bien, verificado' })] }), abierto && c && (_jsxs("div", { className: "mt-2 space-y-1 text-[12px] leading-relaxed text-silver", children: [c.cita && _jsxs("p", { children: ["Prove\u00EDdo: \u201C", c.cita, "\u201D"] }), _jsxs("p", { children: ["Notificaci\u00F3n: ", fecha(c.fecha_notificacion), " \u00B7 ", c.dias, " d\u00EDas \u00B7 ", c.regimen === 'cpp' ? 'CPP (Ley 11.922)' : 'CPCC PBA'] }), c.normas && c.normas.length > 0 && _jsxs("p", { children: ["Normas: ", c.normas.join('; ')] }), c.advertencias && c.advertencias.length > 0 && _jsxs("p", { className: "text-warning", children: ["Atenci\u00F3n: ", c.advertencias.join(' ')] }), _jsx("p", { className: "text-text-gray-light", children: "Si la fecha no es correcta, editala: al corregirla queda verificada." })] }))] }));
}
