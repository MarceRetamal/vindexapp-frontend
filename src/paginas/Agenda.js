import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/audiencias';
import { api as expedientesApi } from '../api/expedientes';
import { PageHeader } from '../componentes/PageHeader';
import { BloqueFecha } from '../componentes/BloqueFecha';
import { Chips } from '../componentes/BarraFiltros';
import { FilaLista } from '../componentes/FilaLista';
import { diasEntre, hoyEnArgentina } from '../lib/fechas';
import { EmptyState } from '../componentes/EmptyState';
import { ErrorBanner } from '../componentes/ErrorBanner';
import { ListSkeleton } from '../componentes/ListSkeleton';
import { BotonEliminar } from '../componentes/BotonEliminar';
import { EstadoBadge } from '../componentes/EstadoBadge';
import { Button } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
const MODALIDADES = ['Presencial', 'Videoconferencia', 'Telefónica'];
const campoClases = 'rounded-sharp bg-graphite border-line focus-visible:ring-silver';
const etiquetaClases = 'text-xs text-text-gray-light';
const GRUPOS_AGENDA = [
    { id: 'cerrar', titulo: 'Para cerrar', incluye: (d) => d < 0 },
    { id: 'hoy', titulo: 'Hoy', incluye: (d) => d === 0 },
    { id: 'manana', titulo: 'Mañana', incluye: (d) => d === 1 },
    { id: 'semana', titulo: 'Esta semana', incluye: (d) => d >= 2 && d <= 7 },
    { id: 'luego', titulo: 'Más adelante', incluye: (d) => d > 7 },
];
export function Agenda() {
    const [audiencias, setAudiencias] = useState([]);
    const [expedientes, setExpedientes] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [filtro, setFiltro] = useState('proximas');
    function cargar() {
        setCargando(true);
        setError(null);
        Promise.all([api.listarAudiencias(), expedientesApi.listarExpedientes()])
            .then(([a, e]) => {
            setAudiencias(a);
            setExpedientes(e);
        })
            .catch((e) => setError(e.message))
            .finally(() => setCargando(false));
    }
    useEffect(cargar, []);
    const expedientesPorId = new Map(expedientes.map((e) => [e.id, e]));
    const hoy = hoyEnArgentina();
    const diasDe = (a) => diasEntre(hoy, a.fecha.slice(0, 10));
    // "Próximas" son las programadas: las de fechas ya pasadas van arriba, como "Para cerrar" (hay que marcarlas hechas o suspendidas).
    const programadas = useMemo(() => audiencias.filter((a) => a.estado === 'Programada'), [audiencias]);
    const cerradas = useMemo(() => audiencias.filter((a) => a.estado !== 'Programada'), [audiencias]);
    const visibles = filtro === 'proximas' ? programadas : filtro === 'pasadas' ? cerradas : audiencias;
    const fila = (a) => _jsx(FilaAudiencia, { audiencia: a, dias: diasDe(a), expediente: expedientesPorId.get(a.expediente_id), onCambiado: cargar }, a.id);
    return (_jsxs("div", { children: [_jsx(PageHeader, { eyebrow: "Hoy", title: "Agenda", count: programadas.length, ctaLabel: mostrarFormulario ? 'Cancelar' : '+ Nueva audiencia', onCta: () => setMostrarFormulario((v) => !v) }), mostrarFormulario && (_jsx(FormularioNuevaAudiencia, { expedientes: expedientes, onCreado: () => {
                    setMostrarFormulario(false);
                    cargar();
                } })), error && _jsx(ErrorBanner, { message: `No se pudo cargar el listado: ${error}` }), !cargando && audiencias.length > 0 && (_jsx("div", { className: "mb-6", children: _jsx(Chips, { etiqueta: "Audiencias a mostrar", valor: filtro, opciones: [
                        { valor: 'proximas', texto: 'Programadas', cantidad: programadas.length },
                        { valor: 'pasadas', texto: 'Cerradas', cantidad: cerradas.length },
                        { valor: 'todas', texto: 'Todas', cantidad: audiencias.length },
                    ], onCambio: setFiltro }) })), cargando ? (_jsx(ListSkeleton, { rows: 6 })) : audiencias.length === 0 ? (_jsx(EmptyState, { message: 'Todav\u00EDa no hay audiencias cargadas. Us\u00E1 "Nueva audiencia" para agregar la primera: el sistema te avisa por WhatsApp 2 horas antes.' })) : visibles.length === 0 ? (_jsx(EmptyState, { message: filtro === 'proximas' ? 'No hay audiencias programadas.' : 'Todavía no hay audiencias cerradas.' })) : filtro === 'proximas' ? (_jsx("div", { className: "flex flex-col gap-8", children: GRUPOS_AGENDA.map((g) => {
                    const delGrupo = visibles.filter((a) => g.incluye(diasDe(a)));
                    if (delGrupo.length === 0)
                        return null;
                    return (_jsxs("section", { "aria-label": g.titulo, children: [_jsxs("h2", { className: `eyebrow mb-3 flex items-center gap-3 ${g.id === 'cerrar' ? 'text-warning' : g.id === 'hoy' ? 'text-white' : ''}`, children: [g.titulo, _jsx("span", { className: "font-light tabular-nums tracking-normal text-text-gray-light", children: delGrupo.length }), _jsx("span", { className: "h-px flex-1 bg-line", "aria-hidden": "true" })] }), _jsx("div", { className: "flex flex-col gap-2", children: delGrupo.map(fila) })] }, g.id));
                }) })) : (_jsx("div", { className: "flex flex-col gap-2", children: [...visibles].sort((a, b) => b.fecha.localeCompare(a.fecha)).map(fila) }))] }));
}
function FilaAudiencia({ audiencia, dias, expediente, onCambiado, }) {
    const [procesando, setProcesando] = useState(false);
    const [error, setError] = useState(null);
    const programada = audiencia.estado === 'Programada';
    async function transicionar(estado) {
        setProcesando(true);
        setError(null);
        try {
            await api.cambiarEstado(audiencia.id, estado);
            onCambiado();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'No se pudo actualizar el estado.');
        }
        finally {
            setProcesando(false);
        }
    }
    const boton = 'rounded-sharp border border-line text-text-gray-light hover:text-white';
    const detalle = [audiencia.hora ? `${audiencia.hora.slice(0, 5)} hs` : null, audiencia.modalidad, audiencia.lugar].filter(Boolean).join(' · ');
    return (_jsxs("div", { children: [_jsxs(FilaLista, { to: expediente ? `/expedientes/${expediente.id}` : undefined, resaltada: programada && dias < 0, inicio: _jsx(BloqueFecha, { fecha: audiencia.fecha.slice(0, 10), dias: programada ? dias : 1, hora: audiencia.hora ? audiencia.hora.slice(0, 5) : null }), lateral: _jsx(EstadoBadge, { estado: audiencia.estado, colorMap: { Programada: 'warning', Realizada: 'success', Suspendida: 'warning', Cancelada: 'neutral' } }), acciones: _jsxs(_Fragment, { children: [programada && (_jsxs(_Fragment, { children: [_jsx(Button, { variant: "ghost", size: "sm", disabled: procesando, onClick: () => transicionar('Realizada'), className: boton, children: "Realizada" }), _jsx(Button, { variant: "ghost", size: "sm", disabled: procesando, onClick: () => transicionar('Suspendida'), className: boton, children: "Suspender" }), _jsx(Button, { variant: "ghost", size: "sm", disabled: procesando, onClick: () => transicionar('Cancelada'), className: boton, children: "Cancelar" })] })), _jsx(BotonEliminar, { descripcion: `la audiencia "${audiencia.tipo}" del ${audiencia.fecha}`, eliminar: () => api.eliminarAudiencia(audiencia.id), alEliminar: onCambiado, alFallar: setError })] }), children: [_jsx("div", { className: "line-clamp-2 text-[15px] font-bold leading-snug text-white", children: audiencia.tipo }), _jsx("div", { className: "mt-0.5 truncate text-xs text-text-gray-light", children: expediente ? expediente.caratula : 'Expediente no encontrado' }), detalle && _jsx("div", { className: "truncate text-xs text-silver-deep", children: detalle })] }), error && _jsx("div", { className: "pt-2 text-xs text-warning", children: error })] }));
}
function FormularioNuevaAudiencia({ expedientes, onCreado, }) {
    const [expedienteId, setExpedienteId] = useState('');
    const [tipo, setTipo] = useState('');
    const [fecha, setFecha] = useState('');
    const [hora, setHora] = useState('');
    const [modalidad, setModalidad] = useState('');
    const [lugar, setLugar] = useState('');
    const [recordatorio, setRecordatorio] = useState(true);
    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState(null);
    async function enviar(e) {
        e.preventDefault();
        setEnviando(true);
        setError(null);
        try {
            await api.crearAudiencia({
                expediente_id: expedienteId,
                tipo,
                fecha,
                hora: hora || undefined,
                modalidad: modalidad || undefined,
                lugar: lugar || undefined,
                recordatorio,
            });
            onCreado();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Error al crear la audiencia.');
        }
        finally {
            setEnviando(false);
        }
    }
    return (_jsxs("form", { onSubmit: enviar, className: "superficie p-5 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3", children: [expedientes.length === 0 && (_jsx("div", { className: "sm:col-span-2", children: _jsx(ErrorBanner, { message: "Todav\u00EDa no hay expedientes cargados. Cre\u00E1 uno primero en la secci\u00F3n Expedientes." }) })), _jsxs("div", { className: "flex flex-col gap-1 sm:col-span-2", children: [_jsx("label", { htmlFor: "nueva-audiencia-expediente", className: etiquetaClases, children: "Expediente" }), _jsxs("select", { id: "nueva-audiencia-expediente", value: expedienteId, onChange: (e) => setExpedienteId(e.target.value), required: true, className: `${campoClases} block w-full h-8 px-2.5 text-sm text-white outline-none border`, children: [_jsx("option", { value: "", disabled: true, children: "Eleg\u00ED un expediente" }), expedientes.map((e) => (_jsx("option", { value: e.id, className: "bg-graphite text-white", children: e.caratula }, e.id)))] })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { htmlFor: "nueva-audiencia-tipo", className: etiquetaClases, children: "Tipo" }), _jsx(Input, { id: "nueva-audiencia-tipo", className: campoClases, value: tipo, onChange: (e) => setTipo(e.target.value), placeholder: "Audiencia de conciliaci\u00F3n", required: true })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { htmlFor: "nueva-audiencia-modalidad", className: etiquetaClases, children: "Modalidad" }), _jsxs("select", { id: "nueva-audiencia-modalidad", value: modalidad, onChange: (e) => setModalidad(e.target.value), className: `${campoClases} block w-full h-8 px-2.5 text-sm text-white outline-none border`, children: [_jsx("option", { value: "", children: "Sin especificar" }), MODALIDADES.map((m) => (_jsx("option", { value: m, className: "bg-graphite text-white", children: m }, m)))] })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { htmlFor: "nueva-audiencia-fecha", className: etiquetaClases, children: "Fecha" }), _jsx(Input, { id: "nueva-audiencia-fecha", type: "date", className: campoClases, value: fecha, onChange: (e) => setFecha(e.target.value), required: true })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { htmlFor: "nueva-audiencia-hora", className: etiquetaClases, children: "Hora" }), _jsx(Input, { id: "nueva-audiencia-hora", type: "time", className: campoClases, value: hora, onChange: (e) => setHora(e.target.value) })] }), _jsxs("div", { className: "flex flex-col gap-1 sm:col-span-2", children: [_jsx("label", { htmlFor: "nueva-audiencia-lugar", className: etiquetaClases, children: "Lugar" }), _jsx(Input, { id: "nueva-audiencia-lugar", className: campoClases, value: lugar, onChange: (e) => setLugar(e.target.value) })] }), _jsxs("div", { className: "sm:col-span-2 flex flex-col gap-1", children: [_jsxs("label", { htmlFor: "nueva-audiencia-recordatorio", className: "flex items-center gap-2 text-sm text-white", children: [_jsx("input", { id: "nueva-audiencia-recordatorio", type: "checkbox", checked: recordatorio, onChange: (e) => setRecordatorio(e.target.checked), className: "accent-silver" }), "Record\u00E1rmela por WhatsApp 2 horas antes"] }), recordatorio && !hora && (_jsx("span", { className: "text-xs text-text-gray-light", children: "Sin hora cargada no hay recordatorio: la audiencia sale solo en el resumen de la ma\u00F1ana." }))] }), error && _jsx("div", { className: "sm:col-span-2 text-warning text-sm", children: error }), _jsx("div", { className: "sm:col-span-2", children: _jsx(Button, { type: "submit", disabled: enviando || expedientes.length === 0, className: "rounded-sharp bg-gradient-to-br from-silver via-silver-deep to-silver text-structural-black font-bold hover:brightness-110 focus-visible:ring-2 focus-visible:ring-silver disabled:opacity-60", children: enviando ? 'Guardando…' : 'Guardar audiencia' }) })] }));
}
