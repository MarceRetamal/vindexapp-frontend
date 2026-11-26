import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Link } from 'react-router';
import { ArrowRightIcon, CheckIcon } from 'lucide-react';
import { api as apiTareas } from '../api/tareas';
import { Button } from '@/componentes/ui/button';
import { diasEntre, etiquetaDias, fechaConDia, fechaCorta, hoyEnArgentina } from '../lib/fechas';
/** Enlace a la calculadora con la propuesta ya cargada, para revisarla y confirmarla. */
export function enlaceDeRevision(propuesta, novedad) {
    const params = new URLSearchParams({
        fecha: propuesta.fecha_notificacion,
        dias: String(propuesta.dias),
        regimen: propuesta.regimen,
        titulo: `${novedad.tipo ?? 'Notificación'} (${novedad.numero_causa})`,
        calcular: '1',
    });
    if (propuesta.vista)
        params.set('vista', '1');
    if (propuesta.localidad)
        params.set('localidad', propuesta.localidad);
    if (novedad.expediente_id)
        params.set('expediente_id', novedad.expediente_id);
    return `/plazos?${params.toString()}`;
}
/**
 * Plazo que el sistema propone para una novedad: la fecha de vencimiento, de dónde salen los días y el botón para
 * convertirlo en tarea. Si los días los dice el proveído se puede crear la tarea directo; si son los supletorios del
 * código hay que revisarlos primero en la calculadora. Nunca se crea nada sin que el abogado toque el botón.
 */
export function PropuestaPlazo({ novedad, propuesta }) {
    const [creando, setCreando] = useState(false);
    const [creada, setCreada] = useState(false);
    const [error, setError] = useState(null);
    const dias = diasEntre(hoyEnArgentina(), propuesta.vencimiento);
    const habiles = propuesta.regimen === 'cpcc' ? 'hábiles' : 'corridos';
    const supletorio = propuesta.origen === 'supletorio';
    async function crearTarea() {
        setCreando(true);
        setError(null);
        try {
            await apiTareas.crearTareaConVencimiento({
                titulo: `Vence: ${novedad.tipo ?? 'Notificación'} (${novedad.numero_causa})`,
                fecha_limite: propuesta.vencimiento,
                expediente_id: novedad.expediente_id ?? undefined,
                descripcion: `${propuesta.dias} días ${habiles} desde la notificación del ${fechaCorta(propuesta.fecha_notificacion)}. ${propuesta.fundamento}`,
                tipo: 'Plazo',
            });
            setCreada(true);
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'No se pudo crear la tarea.');
        }
        finally {
            setCreando(false);
        }
    }
    return (_jsxs("div", { className: "mt-3 rounded-md border border-line border-l-2 border-l-silver bg-structural-black/40 p-4", "aria-label": "Plazo propuesto", children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [_jsx("p", { className: "eyebrow", children: "Plazo propuesto" }), _jsx("span", { className: `rounded-sm border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${supletorio ? 'border-warning/60 text-warning' : 'border-silver-deep/60 text-silver'}`, children: supletorio ? 'Supletorio: verificalo' : 'Lo dice el proveído' })] }), _jsxs("div", { className: "mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1", children: [_jsxs("span", { className: "text-lg font-bold text-white", children: ["Vence ", fechaConDia(propuesta.vencimiento)] }), _jsx("span", { className: `text-xs font-bold ${dias < 0 ? 'text-warning' : dias === 0 ? 'text-white' : 'text-silver-deep'}`, children: etiquetaDias(dias) })] }), _jsxs("p", { className: "mt-1 text-xs text-silver", children: [propuesta.dias, " d\u00EDas ", habiles, " desde la notificaci\u00F3n del ", fechaCorta(propuesta.fecha_notificacion), propuesta.localidad ? ` · calendario de ${propuesta.localidad.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase())}` : ''] }), propuesta.cita && _jsx("blockquote", { className: "mt-2 border-l border-line pl-3 text-xs italic text-silver-deep", children: propuesta.cita }), _jsx("p", { className: "mt-2 text-xs text-text-gray-light", children: propuesta.fundamento }), propuesta.advertencias.length > 0 && (_jsx("ul", { className: "mt-2 flex flex-col gap-1 text-xs text-warning", children: propuesta.advertencias.map((a) => (_jsx("li", { children: a }, a))) })), error && _jsx("p", { className: "mt-2 text-xs text-warning", children: error }), _jsx("div", { className: "mt-3 flex flex-wrap items-center gap-x-4 gap-y-2", children: creada ? (_jsxs("span", { className: "inline-flex items-center gap-2 text-sm text-silver", children: [_jsx(CheckIcon, { className: "h-4 w-4", strokeWidth: 1.8 }), " Tarea creada para el ", fechaCorta(propuesta.vencimiento), ".", ' ', _jsx(Link, { to: "/tareas", className: "underline underline-offset-4 hover:text-white", children: "Ver tareas" })] })) : supletorio ? (_jsxs(Link, { to: enlaceDeRevision(propuesta, novedad), className: "inline-flex h-8 items-center gap-2 rounded-sharp bg-gradient-to-br from-silver via-silver-deep to-silver px-3 text-xs font-bold uppercase tracking-[0.08em] text-structural-black hover:brightness-110", children: ["Revisar y crear ", _jsx(ArrowRightIcon, { className: "h-3.5 w-3.5", strokeWidth: 2 })] })) : (_jsxs(_Fragment, { children: [_jsx(Button, { onClick: crearTarea, disabled: creando, className: "rounded-sharp bg-gradient-to-br from-silver via-silver-deep to-silver text-xs font-bold uppercase tracking-[0.08em] text-structural-black hover:brightness-110 focus-visible:ring-2 focus-visible:ring-silver", children: creando ? 'Creando…' : 'Crear tarea con este vencimiento' }), _jsx(Link, { to: enlaceDeRevision(propuesta, novedad), className: "text-xs text-silver underline-offset-4 hover:text-white hover:underline", children: "Ver el c\u00F3mputo" })] })) })] }));
}
