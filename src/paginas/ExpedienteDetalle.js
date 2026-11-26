import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { api as apiExpedientes } from '../api/expedientes';
import { api as apiActuaciones } from '../api/actuaciones';
import { api as apiTareas } from '../api/tareas';
import { BotonEliminar } from '../componentes/BotonEliminar';
import { PanelDocumentos } from '../componentes/PanelDocumentos';
import { PanelPortal } from '../componentes/PanelPortal';
import { EnlaceCliente, SituacionExpediente } from '../componentes/SituacionExpediente';
import { EstadoBadge } from '../componentes/EstadoBadge';
import { InsigniaRol, SelectorRol } from '../componentes/RolProfesional';
import { VerificarPlazo } from '../componentes/VerificarPlazo';
import { api as apiClientes } from '../api/cliente';
import { EmptyState } from '../componentes/EmptyState';
import { ErrorBanner } from '../componentes/ErrorBanner';
import { ListSkeleton } from '../componentes/ListSkeleton';
import { Button } from '@/componentes/ui/button';
import { Badge } from '@/componentes/ui/badge';
import { Input } from '@/componentes/ui/input';
import { Textarea } from '@/componentes/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, } from '@/componentes/ui/dialog';
const campoClases = 'rounded-sharp bg-graphite border-line focus-visible:ring-silver';
const etiquetaClases = 'text-xs text-text-gray-light';
function formatearFechaISO(fechaISO) {
    const [anio, mes, dia] = fechaISO.slice(0, 10).split('-');
    return `${dia}/${mes}/${anio}`;
}
function fechaISOVencida(fechaISO) {
    const hoy = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Argentina/Buenos_Aires',
    }).format(new Date());
    return fechaISO.slice(0, 10) < hoy;
}
export function ExpedienteDetalle() {
    const { id } = useParams();
    const navegar = useNavigate();
    const [errorEliminar, setErrorEliminar] = useState(null);
    const [expediente, setExpediente] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);
    const [actuaciones, setActuaciones] = useState([]);
    const [cargandoActuaciones, setCargandoActuaciones] = useState(true);
    const [errorActuaciones, setErrorActuaciones] = useState(null);
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [tareas, setTareas] = useState([]);
    const [cargandoTareas, setCargandoTareas] = useState(true);
    const [errorTareas, setErrorTareas] = useState(null);
    const [mostrarFormularioTarea, setMostrarFormularioTarea] = useState(false);
    function cargarExpediente() {
        if (!id)
            return;
        setCargando(true);
        setError(null);
        apiExpedientes
            .obtenerExpediente(id)
            .then(setExpediente)
            .catch((e) => setError(e.message))
            .finally(() => setCargando(false));
    }
    function cargarActuaciones() {
        if (!id)
            return;
        setCargandoActuaciones(true);
        setErrorActuaciones(null);
        apiActuaciones
            .listarActuaciones(id)
            .then(setActuaciones)
            .catch((e) => setErrorActuaciones(e.message))
            .finally(() => setCargandoActuaciones(false));
    }
    function cargarTareas() {
        if (!id)
            return;
        setCargandoTareas(true);
        setErrorTareas(null);
        apiTareas
            .listarTareas(id)
            .then(setTareas)
            .catch((e) => setErrorTareas(e.message))
            .finally(() => setCargandoTareas(false));
    }
    useEffect(cargarExpediente, [id]);
    useEffect(cargarActuaciones, [id]);
    useEffect(cargarTareas, [id]);
    async function notificar(actuacionId) {
        await apiActuaciones.notificarActuacion(actuacionId);
        setActuaciones((actuales) => actuales.map((a) => (a.id === actuacionId ? { ...a, notificado: 1, visible: 1 } : a)));
    }
    async function completarTarea(tareaId) {
        const anteriores = tareas;
        setTareas((actuales) => actuales.map((t) => t.id === tareaId ? { ...t, estado: 'Completada', completado_en: Date.now() } : t));
        try {
            await apiTareas.cambiarEstadoTarea(tareaId, 'Completada');
        }
        catch (e) {
            setTareas(anteriores);
            setErrorTareas(e instanceof Error ? e.message : 'No se pudo actualizar la tarea.');
        }
    }
    if (cargando) {
        return (_jsxs("div", { children: [_jsx(VolverAExpedientes, {}), _jsx("div", { className: "mt-4", children: _jsx(ListSkeleton, { rows: 3 }) })] }));
    }
    if (error) {
        return (_jsxs("div", { children: [_jsx(VolverAExpedientes, {}), _jsx("div", { className: "mt-4", children: _jsx(ErrorBanner, { message: `No se pudo cargar el expediente: ${error}` }) })] }));
    }
    if (!expediente) {
        return null;
    }
    return (_jsxs("div", { children: [_jsx(VolverAExpedientes, {}), _jsxs("header", { className: "mb-8 mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between", children: [_jsxs("div", { className: "min-w-0", children: [_jsxs("p", { className: "eyebrow flex flex-wrap items-center gap-2", children: [expediente.fuero ?? 'Expediente', _jsx(InsigniaRol, { rol: expediente.rol_profesional, grande: true }), expediente.origen === 'portal' && _jsx("span", { className: "font-normal normal-case tracking-normal text-text-gray-light", children: "\u00B7 sincronizado del portal" })] }), _jsx("h1", { className: "mt-2 break-words text-2xl font-black leading-tight text-white sm:text-[30px]", children: expediente.caratula }), _jsxs("p", { className: "mt-3 text-sm text-silver", children: [expediente.cliente_id ? (_jsx(EnlaceCliente, { clienteId: expediente.cliente_id, nombre: `${expediente.cliente_apellido ?? ''}, ${expediente.cliente_nombre ?? ''}` })) : (_jsx("span", { className: "text-warning", children: "Cliente por asignar" })), expediente.rol_procesal ? ` · ${expediente.rol_procesal}` : ''] }), _jsx("p", { className: "mt-1 text-xs text-text-gray-light", children: [expediente.numero, expediente.juzgado, expediente.departamento && !expediente.juzgado?.toLowerCase().includes(expediente.departamento.toLowerCase()) ? expediente.departamento : null].filter(Boolean).join(' · ') })] }), _jsxs("div", { className: "flex flex-row flex-wrap items-center gap-2 sm:flex-col sm:items-end sm:shrink-0", children: [_jsx(EstadoBadge, { estado: expediente.estado, colorMap: { Activo: 'success', 'En trámite': 'warning', Archivado: 'neutral' } }), _jsx(BotonEliminar, { etiqueta: "Eliminar expediente", descripcion: `el expediente "${expediente.caratula}"`, tituloConContenido: "Eliminar expediente con todo su contenido", alternativa: "Si el expediente termin\u00F3, conviene archivarlo (dar de baja) en vez de eliminarlo: queda guardado y se puede reactivar.", eliminar: (conContenido) => apiExpedientes.eliminarExpediente(expediente.id, conContenido), alEliminar: () => navegar('/expedientes'), alFallar: setErrorEliminar })] })] }), errorEliminar && _jsx(ErrorBanner, { message: errorEliminar }), _jsx(PanelRolYCliente, { expediente: expediente, onCambio: setExpediente }), _jsx(SituacionExpediente, { expedienteId: id, actuaciones: actuaciones, tareas: tareas }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-8", children: [_jsxs("div", { className: "lg:col-span-2", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx("h2", { className: "eyebrow text-silver", children: "Actuaciones" }), _jsx(Button, { onClick: () => setMostrarFormulario(true), className: "rounded-sharp bg-gradient-to-br from-silver via-silver-deep to-silver text-structural-black font-bold hover:brightness-110 focus-visible:ring-2 focus-visible:ring-silver", children: "+ Nueva actuaci\u00F3n" })] }), errorActuaciones && (_jsx(ErrorBanner, { message: `No se pudo cargar la línea de tiempo: ${errorActuaciones}` })), cargandoActuaciones ? (_jsx(ListSkeleton, { rows: 4 })) : actuaciones.length === 0 ? (_jsx(EmptyState, { message: 'Todav\u00EDa no hay actuaciones cargadas. Us\u00E1 "Nueva actuaci\u00F3n" para registrar la primera.' })) : (_jsx(motion.div, { initial: "hidden", animate: "show", variants: { hidden: {}, show: { transition: { staggerChildren: 0.04 } } }, children: actuaciones.map((actuacion) => (_jsx(FilaActuacion, { actuacion: actuacion, onNotificar: notificar, onEliminada: cargarActuaciones, onError: setErrorEliminar }, actuacion.id))) })), _jsxs("div", { className: "flex items-center justify-between mb-3 mt-8", children: [_jsx("h2", { className: "eyebrow text-silver", children: "Tareas" }), _jsx(Button, { onClick: () => setMostrarFormularioTarea(true), className: "rounded-sharp bg-gradient-to-br from-silver via-silver-deep to-silver text-structural-black font-bold hover:brightness-110 focus-visible:ring-2 focus-visible:ring-silver", children: "+ Nueva tarea" })] }), errorTareas && _jsx(ErrorBanner, { message: `No se pudieron cargar las tareas: ${errorTareas}` }), cargandoTareas ? (_jsx(ListSkeleton, { rows: 3 })) : tareas.length === 0 ? (_jsx(EmptyState, { message: 'Todav\u00EDa no hay tareas cargadas. Us\u00E1 "Nueva tarea" para crear la primera.' })) : (_jsx(motion.div, { initial: "hidden", animate: "show", variants: { hidden: {}, show: { transition: { staggerChildren: 0.04 } } }, children: tareas.map((tarea) => (_jsx(FilaTarea, { tarea: tarea, onCompletar: completarTarea, onEliminada: cargarTareas, onError: setErrorEliminar }, tarea.id))) })), _jsx(PanelPortal, { expedienteId: id })] }), _jsxs("div", { className: "flex flex-col gap-6", children: [_jsxs("section", { className: "superficie p-5", children: [_jsx("h2", { className: "eyebrow mb-3 text-silver", children: "Datos" }), _jsxs("div", { className: "flex flex-col gap-3", children: [_jsx(Dato, { etiqueta: "N\u00FAmero", valor: expediente.numero }), _jsx(Dato, { etiqueta: "Fuero", valor: expediente.fuero }), _jsx(Dato, { etiqueta: "Juzgado", valor: expediente.juzgado }), _jsx(Dato, { etiqueta: "Departamento judicial", valor: expediente.departamento }), _jsx(Dato, { etiqueta: "Rol procesal", valor: expediente.rol_procesal }), _jsx(Dato, { etiqueta: "Inicio", valor: expediente.inicio })] }), expediente.notas && (_jsxs("div", { className: "mt-4 pt-3 border-t border-line", children: [_jsx("div", { className: "text-xs text-text-gray-light mb-1", children: "Notas" }), _jsx("p", { className: "text-sm text-white", children: expediente.notas })] }))] }), _jsx(PanelDocumentos, { expedienteId: id })] })] }), _jsx(FormularioNuevaActuacion, { abierto: mostrarFormulario, expedienteId: id, onCerrar: () => setMostrarFormulario(false), onGuardado: () => {
                    setMostrarFormulario(false);
                    cargarActuaciones();
                } }), _jsx(FormularioNuevaTarea, { abierto: mostrarFormularioTarea, expedienteId: id, onCerrar: () => setMostrarFormularioTarea(false), onGuardado: () => {
                    setMostrarFormularioTarea(false);
                    cargarTareas();
                } })] }));
}
function VolverAExpedientes() {
    return (_jsx(Link, { to: "/expedientes", className: "text-sm text-silver hover:brightness-125 no-underline", children: "\u2190 Volver a expedientes" }));
}
function Dato({ etiqueta, valor }) {
    return (_jsxs("div", { children: [_jsx("div", { className: "text-xs text-text-gray-light mb-0.5", children: etiqueta }), _jsx("div", { className: "text-sm font-medium text-white", children: valor ?? '—' })] }));
}
function FilaActuacion({ actuacion, onNotificar, onEliminada, onError, }) {
    const [abierta, setAbierta] = useState(false);
    const [notificando, setNotificando] = useState(false);
    const esHito = actuacion.hito === 1;
    const vencida = actuacion.vencimiento != null && fechaISOVencida(actuacion.vencimiento);
    async function notificar(e) {
        e.stopPropagation();
        setNotificando(true);
        try {
            await onNotificar(actuacion.id);
        }
        finally {
            setNotificando(false);
        }
    }
    return (_jsxs(motion.div, { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.2 }, className: `border-b border-line py-4 ${esHito ? 'border-l-2 border-l-silver pl-3' : ''}`, children: [_jsxs("button", { onClick: () => setAbierta((v) => !v), className: "w-full flex items-center justify-between gap-4 text-left bg-transparent border-none p-0 cursor-pointer", children: [_jsxs("div", { className: "min-w-0 flex-1", children: [_jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [_jsx("span", { className: "font-bold text-white", children: actuacion.tipo }), esHito && (_jsx(Badge, { variant: "outline", className: "rounded-sharp uppercase text-xs border-silver text-silver", children: "Hito" })), actuacion.notificado === 1 && (_jsx(Badge, { variant: "outline", className: "rounded-sharp uppercase text-xs border-success text-success", children: "Notificado" })), actuacion.vencimiento &&
                                        (vencida && actuacion.notificado !== 1 ? (_jsxs(Badge, { className: "rounded-sharp uppercase text-xs bg-warning text-structural-black border-warning", children: ["Vencida: ", formatearFechaISO(actuacion.vencimiento)] })) : (_jsxs(Badge, { variant: "outline", className: "rounded-sharp uppercase text-xs border-warning text-warning", children: ["Vence: ", formatearFechaISO(actuacion.vencimiento)] })))] }), _jsx("span", { className: "text-xs text-text-gray-light font-mono", children: formatearFechaISO(actuacion.fecha) })] }), _jsxs("div", { className: "flex items-center gap-2 shrink-0", children: [actuacion.notificado !== 1 && (_jsx(Button, { onClick: notificar, disabled: notificando, variant: "ghost", size: "sm", className: "rounded-sharp border border-line text-text-gray-light hover:text-white", children: notificando ? 'Notificando…' : 'Notificar al cliente' })), _jsx("span", { className: "text-text-gray-light text-xs", children: abierta ? '▲' : '▼' })] })] }), _jsx(AnimatePresence, { children: abierta && (_jsx(motion.div, { initial: { height: 0, opacity: 0 }, animate: { height: 'auto', opacity: 1 }, exit: { height: 0, opacity: 0 }, transition: { duration: 0.15 }, className: "overflow-hidden", children: _jsxs("div", { className: "pt-3 flex flex-col gap-2", children: [actuacion.detalle_interno && (_jsxs("div", { children: [_jsx("div", { className: "text-xs text-text-gray-light mb-0.5", children: "Detalle interno" }), _jsx("p", { className: "text-sm text-white whitespace-pre-wrap", children: actuacion.detalle_interno })] })), actuacion.texto_cliente && (_jsxs("div", { children: [_jsx("div", { className: "text-xs text-text-gray-light mb-0.5", children: "Texto para el cliente" }), _jsx("p", { className: "text-sm text-white whitespace-pre-wrap", children: actuacion.texto_cliente })] })), !actuacion.detalle_interno && !actuacion.texto_cliente && (_jsx("p", { className: "text-sm text-text-gray-light italic", children: "Sin detalle cargado." })), _jsx("div", { className: "flex justify-end pt-1", children: _jsx(BotonEliminar, { etiqueta: "Eliminar actuaci\u00F3n", descripcion: `la actuación "${actuacion.tipo}"`, eliminar: () => apiActuaciones.eliminarActuacion(actuacion.id), alEliminar: onEliminada, alFallar: onError }) })] }) })) })] }));
}
function FormularioNuevaActuacion({ abierto, expedienteId, onCerrar, onGuardado, }) {
    const [tipo, setTipo] = useState('');
    const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
    const [vencimiento, setVencimiento] = useState('');
    const [detalleInterno, setDetalleInterno] = useState('');
    const [textoCliente, setTextoCliente] = useState('');
    const [hito, setHito] = useState(false);
    const [visible, setVisible] = useState(false);
    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState(null);
    function limpiar() {
        setTipo('');
        setFecha(new Date().toISOString().slice(0, 10));
        setVencimiento('');
        setDetalleInterno('');
        setTextoCliente('');
        setHito(false);
        setVisible(false);
        setError(null);
    }
    async function enviar(e) {
        e.preventDefault();
        setEnviando(true);
        setError(null);
        try {
            await apiActuaciones.crearActuacion({
                expediente_id: expedienteId,
                tipo,
                fecha,
                vencimiento: vencimiento || undefined,
                detalle_interno: detalleInterno || undefined,
                texto_cliente: textoCliente || undefined,
                hito,
                visible,
            });
            limpiar();
            onGuardado();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Error al guardar la actuación.');
        }
        finally {
            setEnviando(false);
        }
    }
    return (_jsx(Dialog, { open: abierto, onOpenChange: (open) => {
            if (!open)
                onCerrar();
        }, children: _jsxs(DialogContent, { className: "sm:max-w-md", children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: "Nueva actuaci\u00F3n" }) }), _jsxs("form", { onSubmit: enviar, className: "flex flex-col gap-3", children: [_jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { htmlFor: "act-tipo", className: etiquetaClases, children: "Tipo" }), _jsx(Input, { id: "act-tipo", className: campoClases, value: tipo, onChange: (e) => setTipo(e.target.value), required: true })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { htmlFor: "act-fecha", className: etiquetaClases, children: "Fecha" }), _jsx(Input, { id: "act-fecha", type: "date", className: campoClases, value: fecha, onChange: (e) => setFecha(e.target.value), required: true })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { htmlFor: "act-vencimiento", className: etiquetaClases, children: "Vencimiento" }), _jsx(Input, { id: "act-vencimiento", type: "date", className: campoClases, value: vencimiento, onChange: (e) => setVencimiento(e.target.value) }), _jsx("p", { className: "text-xs text-text-gray-light", children: "Fecha l\u00EDmite para actuar (la carg\u00E1s vos; el sistema no la calcula)." })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { htmlFor: "act-detalle", className: etiquetaClases, children: "Detalle interno" }), _jsx(Textarea, { id: "act-detalle", className: `${campoClases} resize-y min-h-[60px]`, value: detalleInterno, onChange: (e) => setDetalleInterno(e.target.value) })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { htmlFor: "act-texto-cliente", className: etiquetaClases, children: "Texto para el cliente" }), _jsx(Textarea, { id: "act-texto-cliente", className: `${campoClases} resize-y min-h-[60px]`, value: textoCliente, onChange: (e) => setTextoCliente(e.target.value) })] }), _jsxs("div", { className: "flex gap-4", children: [_jsxs("label", { className: "flex items-center gap-2 text-sm text-white cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: hito, onChange: (e) => setHito(e.target.checked), className: "accent-silver" }), "Es un hito"] }), _jsxs("label", { className: "flex items-center gap-2 text-sm text-white cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: visible, onChange: (e) => setVisible(e.target.checked), className: "accent-silver" }), "Visible para el cliente"] })] }), error && _jsx(ErrorBanner, { message: error }), _jsxs(DialogFooter, { children: [_jsx(Button, { type: "submit", disabled: enviando, className: "rounded-sharp bg-gradient-to-br from-silver via-silver-deep to-silver text-structural-black font-bold hover:brightness-110 focus-visible:ring-2 focus-visible:ring-silver disabled:opacity-60", children: enviando ? 'Guardando…' : 'Guardar actuación' }), _jsx(Button, { type: "button", variant: "ghost", onClick: onCerrar, disabled: enviando, className: "rounded-sharp border border-line text-text-gray-light hover:text-white", children: "Cancelar" })] })] })] }) }));
}
function FilaTarea({ tarea, onCompletar, onEliminada, onError, }) {
    const [completando, setCompletando] = useState(false);
    const completada = tarea.estado === 'Completada';
    const vencida = !completada && tarea.fecha_limite != null && fechaISOVencida(tarea.fecha_limite);
    async function completar() {
        setCompletando(true);
        try {
            await onCompletar(tarea.id);
        }
        finally {
            setCompletando(false);
        }
    }
    return (_jsxs(motion.div, { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.2 }, className: "flex items-center gap-3 border-b border-line py-3", children: [_jsx("input", { type: "checkbox", checked: completada, disabled: completada || completando, onChange: completar, className: "accent-silver shrink-0 w-4 h-4 cursor-pointer disabled:cursor-default" }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [_jsx("span", { className: `font-medium ${completada ? 'text-text-gray-light line-through' : 'text-white'}`, children: tarea.titulo }), _jsx(Badge, { variant: "outline", className: `rounded-sharp uppercase text-xs ${completada
                                    ? 'border-success text-success'
                                    : vencida
                                        ? 'border-warning text-warning'
                                        : 'border-line text-text-gray-light'}`, children: tarea.estado })] }), tarea.fecha_limite && (_jsxs("span", { className: `text-xs font-mono ${vencida ? 'text-warning' : 'text-text-gray-light'}`, children: ["Vence: ", formatearFechaISO(tarea.fecha_limite)] })), !completada && _jsx(VerificarPlazo, { tarea: tarea, onCambio: onEliminada })] }), _jsx(BotonEliminar, { descripcion: `la tarea "${tarea.titulo}"`, eliminar: () => apiTareas.eliminarTarea(tarea.id), alEliminar: onEliminada, alFallar: onError })] }));
}
function FormularioNuevaTarea({ abierto, expedienteId, onCerrar, onGuardado, }) {
    const [titulo, setTitulo] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [fechaLimite, setFechaLimite] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState(null);
    function limpiar() {
        setTitulo('');
        setDescripcion('');
        setFechaLimite('');
        setError(null);
    }
    async function enviar(e) {
        e.preventDefault();
        setEnviando(true);
        setError(null);
        try {
            await apiTareas.crearTarea({
                expediente_id: expedienteId,
                titulo,
                descripcion: descripcion || undefined,
                fecha_limite: fechaLimite || undefined,
            });
            limpiar();
            onGuardado();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Error al guardar la tarea.');
        }
        finally {
            setEnviando(false);
        }
    }
    return (_jsx(Dialog, { open: abierto, onOpenChange: (open) => {
            if (!open)
                onCerrar();
        }, children: _jsxs(DialogContent, { className: "sm:max-w-md", children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: "Nueva tarea" }) }), _jsxs("form", { onSubmit: enviar, className: "flex flex-col gap-3", children: [_jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { htmlFor: "tarea-titulo", className: etiquetaClases, children: "T\u00EDtulo" }), _jsx(Input, { id: "tarea-titulo", className: campoClases, value: titulo, onChange: (e) => setTitulo(e.target.value), required: true })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { htmlFor: "tarea-descripcion", className: etiquetaClases, children: "Descripci\u00F3n" }), _jsx(Textarea, { id: "tarea-descripcion", className: `${campoClases} resize-y min-h-[60px]`, value: descripcion, onChange: (e) => setDescripcion(e.target.value) })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { htmlFor: "tarea-fecha-limite", className: etiquetaClases, children: "Fecha l\u00EDmite" }), _jsx(Input, { id: "tarea-fecha-limite", type: "date", className: campoClases, value: fechaLimite, onChange: (e) => setFechaLimite(e.target.value) })] }), error && _jsx(ErrorBanner, { message: error }), _jsxs(DialogFooter, { children: [_jsx(Button, { type: "submit", disabled: enviando, className: "rounded-sharp bg-gradient-to-br from-silver via-silver-deep to-silver text-structural-black font-bold hover:brightness-110 focus-visible:ring-2 focus-visible:ring-silver disabled:opacity-60", children: enviando ? 'Guardando…' : 'Guardar tarea' }), _jsx(Button, { type: "button", variant: "ghost", onClick: onCerrar, disabled: enviando, className: "rounded-sharp border border-line text-text-gray-light hover:text-white", children: "Cancelar" })] })] })] }) }));
}
/**
 * Rol del abogado en este expediente y, si se creó desde el portal sin cliente, la asignación del cliente. Va arriba
 * de todo porque es lo primero que hay que saber de una causa (pedido de Marcelo: con el volumen DEAS no se puede
 * memorizar el rol de cada una).
 */
function PanelRolYCliente({ expediente, onCambio }) {
    const [clientes, setClientes] = useState(null);
    const [clienteElegido, setClienteElegido] = useState('');
    const [ocupado, setOcupado] = useState(false);
    const [error, setError] = useState(null);
    const sinCliente = expediente.cliente_id === null;
    const sinRol = expediente.rol_profesional === null;
    useEffect(() => {
        if (sinCliente)
            apiClientes.listarClientes().then(setClientes).catch(() => setClientes([]));
    }, [sinCliente]);
    if (!sinCliente && !sinRol) {
        return (_jsxs("div", { className: "mb-6 flex flex-wrap items-center gap-3", children: [_jsx("span", { className: "text-xs text-text-gray-light", children: "Tu rol:" }), _jsx(SelectorRol, { valor: expediente.rol_profesional, onCambio: (r) => void guardar({ rol_profesional: r }), deshabilitado: ocupado }), error && _jsx("span", { role: "alert", className: "text-xs text-warning", children: error })] }));
    }
    async function guardar(datos) {
        setOcupado(true);
        setError(null);
        try {
            onCambio(await apiExpedientes.editarExpediente(expediente.id, datos));
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'No se pudo guardar.');
        }
        finally {
            setOcupado(false);
        }
    }
    return (_jsxs("section", { className: "superficie mb-6 border-warning/40 p-5", children: [_jsx("p", { className: "eyebrow text-warning", children: "Falta completar" }), sinRol && (_jsxs("div", { className: "mt-3", children: [_jsx("p", { className: "mb-2 text-sm text-white", children: "\u00BFCu\u00E1l es tu rol en este expediente?" }), _jsx(SelectorRol, { valor: null, onCambio: (r) => void guardar({ rol_profesional: r }), deshabilitado: ocupado })] })), sinCliente && (_jsxs("div", { className: "mt-4", children: [_jsx("p", { className: "mb-2 text-sm text-white", children: expediente.rol_profesional === 'deas' ? 'Asigná a la persona defendida' : expediente.rol_profesional === 'asesor_incapaces' ? 'Asigná a la persona representada' : 'Asigná el cliente' }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsxs("select", { value: clienteElegido, onChange: (e) => setClienteElegido(e.target.value), disabled: ocupado || clientes === null, className: "h-9 min-w-[240px] flex-1 rounded-sharp border border-line bg-graphite px-2 text-sm text-white", "aria-label": "Cliente", children: [_jsx("option", { value: "", children: "Eleg\u00ED un cliente\u2026" }), (clientes ?? [])
                                        .slice()
                                        .sort((a, b) => `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`, 'es'))
                                        .map((c) => (_jsxs("option", { value: c.id, children: [c.apellido, ", ", c.nombre] }, c.id)))] }), _jsx(Button, { disabled: !clienteElegido || ocupado, onClick: () => void guardar({ cliente_id: clienteElegido }), className: "rounded-sharp bg-gradient-to-br from-silver via-silver-deep to-silver text-structural-black font-bold hover:brightness-110", children: "Asignar" }), _jsx(Link, { to: "/clientes", className: "self-center text-xs text-silver underline-offset-2 hover:underline", children: "Crear cliente nuevo" })] })] })), error && _jsx("p", { role: "alert", className: "mt-3 text-xs text-warning", children: error })] }));
}
