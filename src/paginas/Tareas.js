import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { VerificarPlazo } from '../componentes/VerificarPlazo';
import { Link } from 'react-router';
import { CheckIcon } from 'lucide-react';
import { api } from '../api/tareas';
import { api as clientesApi } from '../api/cliente';
import { api as alertasApi, mensajeDeError } from '../api/alertas';
import { PageHeader } from '../componentes/PageHeader';
import { EmptyState } from '../componentes/EmptyState';
import { ErrorBanner } from '../componentes/ErrorBanner';
import { ListSkeleton } from '../componentes/ListSkeleton';
import { BotonEliminar } from '../componentes/BotonEliminar';
import { BloqueFecha } from '../componentes/BloqueFecha';
import { Chips } from '../componentes/BarraFiltros';
import { BloqueIcono, FilaLista } from '../componentes/FilaLista';
import { diasEntre, hoyEnArgentina } from '../lib/fechas';
import { Button } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
import { Textarea } from '@/componentes/ui/textarea';
// Sugerencias para el tipo de gestión. Es texto libre: la lista de tipos no está cerrada.
const TIPOS_SUGERIDOS = ['Llamado', 'Email', 'Mensaje', 'Acuerdo extrajudicial', 'Reunión', 'Trámite'];
const campoClases = 'rounded-sharp bg-graphite border-line focus-visible:ring-silver';
const etiquetaClases = 'text-xs text-text-gray-light';
const botonClases = 'rounded-sharp border border-line text-text-gray-light hover:text-white';
export function Tareas() {
    const [tareas, setTareas] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [filtroEstado, setFiltroEstado] = useState('pendientes');
    const [filtroOrigen, setFiltroOrigen] = useState('todas');
    function cargar() {
        setCargando(true);
        setError(null);
        api
            .listarTodas()
            .then(setTareas)
            .catch((e) => setError(e.message))
            .finally(() => setCargando(false));
    }
    useEffect(() => {
        cargar();
        // Los clientes solo alimentan el selector del formulario: si fallan, se puede cargar la tarea sin cliente.
        clientesApi.listarClientes().then(setClientes).catch(() => setClientes([]));
    }, []);
    const pendientes = tareas.filter((t) => t.estado !== 'Completada');
    const visibles = tareas.filter((t) => (filtroEstado === 'todas' || (filtroEstado === 'completadas') === (t.estado === 'Completada')) &&
        (filtroOrigen === 'todas' || (filtroOrigen === 'judiciales') === (t.expediente_id !== null)));
    return (_jsxs("div", { children: [_jsx(PageHeader, { eyebrow: "Hoy", title: "Tareas", count: pendientes.length, ctaLabel: mostrarFormulario ? 'Cancelar' : '+ Nueva tarea', onCta: () => setMostrarFormulario((v) => !v) }), mostrarFormulario && (_jsx(FormularioTarea, { clientes: clientes, onGuardado: () => {
                    setMostrarFormulario(false);
                    cargar();
                }, onCancelar: () => setMostrarFormulario(false) })), _jsxs("div", { className: "mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between", children: [_jsx(Chips, { etiqueta: "Estado de las tareas", valor: filtroEstado, opciones: [
                            { valor: 'pendientes', texto: 'Pendientes', cantidad: pendientes.length },
                            { valor: 'completadas', texto: 'Completadas', cantidad: tareas.length - pendientes.length },
                            { valor: 'todas', texto: 'Todas', cantidad: tareas.length },
                        ], onCambio: setFiltroEstado }), _jsx(Chips, { etiqueta: "Origen de las tareas", valor: filtroOrigen, opciones: [
                            { valor: 'todas', texto: 'Todas' },
                            { valor: 'extrajudiciales', texto: 'Extrajudiciales' },
                            { valor: 'judiciales', texto: 'De expedientes' },
                        ], onCambio: setFiltroOrigen })] }), error && _jsx(ErrorBanner, { message: `No se pudo completar la operación: ${error}` }), cargando ? (_jsx(ListSkeleton, { rows: 6 })) : visibles.length === 0 ? (_jsx(EmptyState, { message: tareas.length === 0
                    ? 'Todavía no hay tareas. Usá "Nueva tarea" para anotar un llamado, un mail o un acuerdo pendiente.'
                    : 'No hay tareas con estos filtros.' })) : (_jsx(ListaTareas, { tareas: visibles, agrupar: filtroEstado === 'pendientes', clientes: clientes, onCambiado: cargar, onError: setError })), _jsx("div", { className: "mt-12 border-t border-line pt-6", children: _jsx(ResumenAgenda, { onError: setError }) })] }));
}
/** Estado del resumen diario de agenda por WhatsApp y botón para probarlo. */
function ResumenAgenda({ onError }) {
    const [activo, setActivo] = useState(null);
    const [enviando, setEnviando] = useState(false);
    const [aviso, setAviso] = useState(null);
    useEffect(() => {
        alertasApi
            .obtenerEstado()
            .then((r) => setActivo(r.whatsapp.configurado && r.whatsapp.estudio_correcto && Boolean(r.agenda?.plantilla)))
            .catch(() => setActivo(false));
    }, []);
    async function probar() {
        if (!window.confirm('Se enviará ahora por WhatsApp el resumen de agenda de hoy. ¿Seguimos?'))
            return;
        setEnviando(true);
        onError(null);
        setAviso(null);
        try {
            const r = await alertasApi.enviarAgendaPrueba();
            setAviso(`Resumen enviado (${r.pendientes} ${r.pendientes === 1 ? 'pendiente' : 'pendientes'}). Revisá tu WhatsApp.`);
        }
        catch (e) {
            onError(mensajeDeError(e));
        }
        finally {
            setEnviando(false);
        }
    }
    if (activo === null)
        return null;
    return (_jsxs("div", { className: "mb-6 flex flex-col gap-2", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-3 text-xs text-text-gray-light", children: [_jsx("span", { children: activo
                            ? 'Avisos por WhatsApp: a las 8, lo vencido y lo que vence hoy, mañana y pasado; 2 horas antes de cada audiencia con hora; y a las 17, lo que vence hoy y sigue pendiente.'
                            : 'El resumen diario de agenda por WhatsApp no está configurado.' }), activo && (_jsx(Button, { variant: "ghost", size: "sm", onClick: probar, disabled: enviando, className: botonClases, children: enviando ? 'Enviando…' : 'Enviar resumen de prueba' }))] }), aviso && _jsx("div", { className: "border-l-2 border-success text-success bg-graphite px-4 py-3 rounded-sharp text-sm", children: aviso })] }));
}
const GRUPOS_TAREA = [
    { id: 'vencidas', titulo: 'Vencidas', incluye: (d) => d !== null && d < 0 },
    { id: 'hoy', titulo: 'Hoy', incluye: (d) => d === 0 },
    { id: 'semana', titulo: 'Esta semana', incluye: (d) => d !== null && d >= 1 && d <= 7 },
    { id: 'luego', titulo: 'Más adelante', incluye: (d) => d !== null && d > 7 },
    { id: 'sinfecha', titulo: 'Sin fecha', incluye: (d) => d === null },
];
/** Las tareas pendientes se agrupan por urgencia, como en Mi día; el resto, en una sola lista. */
function ListaTareas({ tareas, agrupar, clientes, onCambiado, onError, }) {
    const hoy = hoyEnArgentina();
    const diasDe = (t) => (t.fecha_limite ? diasEntre(hoy, t.fecha_limite.slice(0, 10)) : null);
    if (!agrupar) {
        return (_jsx("div", { className: "flex flex-col gap-2", children: tareas.map((t) => (_jsx(FilaTarea, { tarea: t, clientes: clientes, onCambiado: onCambiado, onError: onError }, t.id))) }));
    }
    return (_jsx("div", { className: "flex flex-col gap-8", children: GRUPOS_TAREA.map((g) => {
            const delGrupo = tareas.filter((t) => g.incluye(diasDe(t)));
            if (delGrupo.length === 0)
                return null;
            return (_jsxs("section", { "aria-label": g.titulo, children: [_jsxs("h2", { className: `eyebrow mb-3 flex items-center gap-3 ${g.id === 'vencidas' ? 'text-warning' : g.id === 'hoy' ? 'text-white' : ''}`, children: [g.titulo, _jsx("span", { className: "font-light tabular-nums tracking-normal text-text-gray-light", children: delGrupo.length }), _jsx("span", { className: "h-px flex-1 bg-line", "aria-hidden": "true" })] }), _jsx("div", { className: "flex flex-col gap-2", children: delGrupo.map((t) => (_jsx(FilaTarea, { tarea: t, clientes: clientes, onCambiado: onCambiado, onError: onError }, t.id))) })] }, g.id));
        }) }));
}
function FilaTarea({ tarea, clientes, onCambiado, onError, }) {
    const [procesando, setProcesando] = useState(false);
    const [editando, setEditando] = useState(false);
    const completada = tarea.estado === 'Completada';
    const dias = tarea.fecha_limite ? diasEntre(hoyEnArgentina(), tarea.fecha_limite.slice(0, 10)) : null;
    const cliente = tarea.cliente_apellido ? `${tarea.cliente_apellido}, ${tarea.cliente_nombre ?? ''}` : null;
    const contexto = [tarea.expediente_id ? null : (tarea.tipo ?? 'Extrajudicial'), cliente].filter(Boolean).join(' · ');
    async function cambiarEstado() {
        setProcesando(true);
        onError(null);
        try {
            await api.cambiarEstadoTarea(tarea.id, completada ? 'Pendiente' : 'Completada');
            onCambiado();
        }
        catch (e) {
            onError(e instanceof Error ? e.message : 'No se pudo actualizar la tarea.');
        }
        finally {
            setProcesando(false);
        }
    }
    return (_jsxs("div", { children: [_jsxs(FilaLista, { resaltada: !completada && dias !== null && dias < 0, accionesVisibles: true, inicio: completada ? (_jsx(BloqueIcono, { children: _jsx(CheckIcon, { className: "h-5 w-5 text-success", strokeWidth: 1.8 }) })) : tarea.fecha_limite && dias !== null ? (_jsx(BloqueFecha, { fecha: tarea.fecha_limite.slice(0, 10), dias: dias })) : (_jsx(BloqueIcono, { children: _jsx("span", { className: "text-[11px] font-bold tracking-[0.12em] text-silver-deep", children: "S/F" }) })), acciones: _jsxs(_Fragment, { children: [_jsx(Button, { variant: "ghost", size: "sm", disabled: procesando, onClick: cambiarEstado, className: botonClases, children: completada ? 'Volver a pendiente' : 'Marcar hecha' }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => setEditando((v) => !v), className: botonClases, children: editando ? 'Cancelar edición' : 'Editar' }), _jsx(BotonEliminar, { descripcion: `la tarea "${tarea.titulo}"`, eliminar: () => api.eliminarTarea(tarea.id), alEliminar: onCambiado, alFallar: onError })] }), children: [_jsx("div", { className: `line-clamp-2 text-[15px] font-bold leading-snug ${completada ? 'text-text-gray-light line-through' : 'text-white'}`, children: tarea.titulo }), tarea.expediente_id && (_jsx(Link, { to: `/expedientes/${tarea.expediente_id}`, className: "mt-0.5 block truncate text-xs text-text-gray-light underline-offset-4 hover:text-white hover:underline", children: tarea.expediente_caratula ?? 'Ver expediente' })), contexto && _jsx("div", { className: "mt-0.5 truncate text-xs text-text-gray-light", children: contexto }), tarea.descripcion && tarea.automatica !== 1 && _jsx("p", { className: "mt-1 line-clamp-2 text-xs text-silver-deep", children: tarea.descripcion }), !completada && _jsx(VerificarPlazo, { tarea: tarea, onCambio: onCambiado })] }), editando && (_jsx("div", { className: "mt-2", children: _jsx(FormularioTarea, { tarea: tarea, clientes: clientes, onGuardado: () => {
                        setEditando(false);
                        onCambiado();
                    }, onCancelar: () => setEditando(false) }) }))] }));
}
/** Alta de una tarea extrajudicial, o edición de una existente (judicial o extrajudicial) si recibe `tarea`. */
function FormularioTarea({ tarea, clientes, onGuardado, onCancelar, }) {
    const [titulo, setTitulo] = useState(tarea?.titulo ?? '');
    const [tipo, setTipo] = useState(tarea?.tipo ?? '');
    const [clienteId, setClienteId] = useState(tarea?.cliente_id ?? '');
    const [fecha, setFecha] = useState(tarea?.fecha_limite ?? '');
    const [descripcion, setDescripcion] = useState(tarea?.descripcion ?? '');
    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState(null);
    const prefijo = tarea ? `editar-${tarea.id}` : 'nueva-tarea';
    async function enviar(e) {
        e.preventDefault();
        setEnviando(true);
        setError(null);
        try {
            if (tarea) {
                await api.editarTarea(tarea.id, {
                    titulo,
                    tipo: tipo || null,
                    cliente_id: clienteId || null,
                    fecha_limite: fecha || null,
                    descripcion: descripcion || null,
                });
            }
            else {
                await api.crearTareaExtrajudicial({
                    titulo,
                    tipo: tipo || undefined,
                    cliente_id: clienteId || undefined,
                    fecha_limite: fecha || undefined,
                    descripcion: descripcion || undefined,
                });
            }
            onGuardado();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'No se pudo guardar la tarea.');
        }
        finally {
            setEnviando(false);
        }
    }
    return (_jsxs("form", { onSubmit: enviar, className: "superficie p-5 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3", children: [_jsxs("div", { className: "flex flex-col gap-1 sm:col-span-2", children: [_jsx("label", { htmlFor: `${prefijo}-titulo`, className: etiquetaClases, children: "Qu\u00E9 hay que hacer" }), _jsx(Input, { id: `${prefijo}-titulo`, className: campoClases, value: titulo, onChange: (e) => setTitulo(e.target.value), placeholder: "Ej.: llamar al Dr. P\u00E9rez por la propuesta de acuerdo", required: true })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { htmlFor: `${prefijo}-tipo`, className: etiquetaClases, children: "Tipo" }), _jsx(Input, { id: `${prefijo}-tipo`, className: campoClases, value: tipo, onChange: (e) => setTipo(e.target.value), list: `${prefijo}-tipos`, placeholder: "Llamado, email, mensaje\u2026" }), _jsx("datalist", { id: `${prefijo}-tipos`, children: TIPOS_SUGERIDOS.map((t) => (_jsx("option", { value: t }, t))) })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { htmlFor: `${prefijo}-fecha`, className: etiquetaClases, children: "Fecha l\u00EDmite" }), _jsx(Input, { id: `${prefijo}-fecha`, type: "date", className: campoClases, value: fecha, onChange: (e) => setFecha(e.target.value) })] }), _jsxs("div", { className: "flex flex-col gap-1 sm:col-span-2", children: [_jsx("label", { htmlFor: `${prefijo}-cliente`, className: etiquetaClases, children: "Cliente (opcional)" }), _jsxs("select", { id: `${prefijo}-cliente`, value: clienteId, onChange: (e) => setClienteId(e.target.value), className: `${campoClases} block w-full h-8 px-2.5 text-sm text-white outline-none border`, children: [_jsx("option", { value: "", className: "bg-graphite text-white", children: "Sin cliente" }), clientes.map((c) => (_jsxs("option", { value: c.id, className: "bg-graphite text-white", children: [c.apellido, ", ", c.nombre] }, c.id)))] })] }), _jsxs("div", { className: "flex flex-col gap-1 sm:col-span-2", children: [_jsx("label", { htmlFor: `${prefijo}-descripcion`, className: etiquetaClases, children: "Notas" }), _jsx(Textarea, { id: `${prefijo}-descripcion`, className: campoClases, value: descripcion, onChange: (e) => setDescripcion(e.target.value), rows: 3 })] }), error && _jsx("div", { className: "sm:col-span-2 text-warning text-sm", children: error }), _jsxs("div", { className: "sm:col-span-2 flex flex-wrap gap-2", children: [_jsx(Button, { type: "submit", disabled: enviando, className: "rounded-sharp bg-gradient-to-br from-silver via-silver-deep to-silver text-structural-black font-bold hover:brightness-110 focus-visible:ring-2 focus-visible:ring-silver disabled:opacity-60", children: enviando ? 'Guardando…' : tarea ? 'Guardar cambios' : 'Guardar tarea' }), _jsx(Button, { type: "button", variant: "ghost", onClick: onCancelar, disabled: enviando, className: botonClases, children: "Cancelar" })] })] }));
}
