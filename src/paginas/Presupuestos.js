import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { FileTextIcon } from 'lucide-react';
import { api } from '../api/presupuestos';
import { api as clientesApi } from '../api/cliente';
import { api as expedientesApi } from '../api/expedientes';
import { PageHeader } from '../componentes/PageHeader';
import { BarraDeLista } from '../componentes/BarraDeLista';
import { BloqueIcono, FilaLista } from '../componentes/FilaLista';
import { coincide } from '../lib/texto';
import { fechaCorta } from '../lib/fechas';
import { EmptyState } from '../componentes/EmptyState';
import { ErrorBanner } from '../componentes/ErrorBanner';
import { ListSkeleton } from '../componentes/ListSkeleton';
import { BotonEliminar } from '../componentes/BotonEliminar';
import { EstadoBadge } from '../componentes/EstadoBadge';
import { Button } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
const FORMATO_MONTO = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });
const campoClases = 'rounded-sharp bg-graphite border-line focus-visible:ring-silver';
const etiquetaClases = 'text-xs text-text-gray-light';
const EN_CURSO = ['borrador', 'enviado'];
export function Presupuestos() {
    const [presupuestos, setPresupuestos] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [expedientes, setExpedientes] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [busqueda, setBusqueda] = useState('');
    const [filtro, setFiltro] = useState('todos');
    function cargar() {
        setCargando(true);
        setError(null);
        Promise.all([api.listarPresupuestos(), clientesApi.listarClientes(), expedientesApi.listarExpedientes()])
            .then(([p, c, e]) => {
            setPresupuestos(p);
            setClientes(c);
            setExpedientes(e);
        })
            .catch((e) => setError(e.message))
            .finally(() => setCargando(false));
    }
    useEffect(cargar, []);
    const clientesPorId = new Map(clientes.map((c) => [c.id, c]));
    const nombreDe = (p) => {
        const c = p.cliente_id ? clientesPorId.get(p.cliente_id) : undefined;
        return c ? `${c.apellido}, ${c.nombre}` : (p.contacto_nombre ?? '');
    };
    const suma = (lista) => lista.reduce((total, p) => total + p.monto, 0);
    const firmados = presupuestos.filter((p) => p.estado === 'firmado');
    const enCurso = presupuestos.filter((p) => EN_CURSO.includes(p.estado));
    const cerrados = presupuestos.filter((p) => p.estado === 'rechazado' || p.estado === 'vencido');
    const visibles = useMemo(() => presupuestos.filter((p) => (filtro === 'todos' || (filtro === 'firmados' ? p.estado === 'firmado' : filtro === 'encurso' ? EN_CURSO.includes(p.estado) : p.estado === 'rechazado' || p.estado === 'vencido')) &&
        coincide(busqueda, `${p.concepto} ${nombreDe(p)}`)), 
    // nombreDe depende de los clientes cargados.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [presupuestos, clientes, filtro, busqueda]);
    return (_jsxs("div", { children: [_jsx(PageHeader, { eyebrow: "Estudio", title: "Presupuestos", count: presupuestos.length, ctaLabel: mostrarFormulario ? 'Cancelar' : '+ Nuevo presupuesto', onCta: () => setMostrarFormulario((v) => !v) }), mostrarFormulario && (_jsx(FormularioNuevoPresupuesto, { clientes: clientes, onCreado: () => {
                    setMostrarFormulario(false);
                    cargar();
                } })), error && _jsx(ErrorBanner, { message: `No se pudo cargar el listado: ${error}` }), !cargando && presupuestos.length > 0 && (_jsxs(_Fragment, { children: [_jsxs("dl", { className: "mb-6 grid gap-3 sm:grid-cols-3", children: [_jsx(Cifra, { etiqueta: "Firmado", valor: FORMATO_MONTO.format(suma(firmados) / 100), detalle: `${firmados.length} ${firmados.length === 1 ? 'presupuesto' : 'presupuestos'}`, destacada: true }), _jsx(Cifra, { etiqueta: "En curso", valor: FORMATO_MONTO.format(suma(enCurso) / 100), detalle: `${enCurso.length} esperando respuesta o por enviar` }), _jsx(Cifra, { etiqueta: "Cerrados sin firma", valor: String(cerrados.length), detalle: "rechazados o vencidos" })] }), _jsx(BarraDeLista, { busqueda: busqueda, onBusqueda: setBusqueda, placeholder: "Concepto o cliente", etiquetaBusqueda: "Buscar un presupuesto", filtro: filtro, onFiltro: setFiltro, etiquetaFiltro: "Estado de los presupuestos", opciones: [
                            { valor: 'todos', texto: 'Todos', cantidad: presupuestos.length },
                            { valor: 'encurso', texto: 'En curso', cantidad: enCurso.length },
                            { valor: 'firmados', texto: 'Firmados', cantidad: firmados.length },
                            { valor: 'cerrados', texto: 'Cerrados', cantidad: cerrados.length },
                        ] })] })), cargando ? (_jsx(ListSkeleton, { rows: 6 })) : presupuestos.length === 0 ? (_jsx(EmptyState, { message: 'Todav\u00EDa no hay presupuestos cargados. Us\u00E1 "Nuevo presupuesto" para agregar el primero.' })) : visibles.length === 0 ? (_jsx(EmptyState, { message: "Ning\u00FAn presupuesto coincide con la b\u00FAsqueda." })) : (_jsx("div", { className: "flex flex-col gap-2", children: visibles.map((p) => (_jsx(FilaPresupuesto, { presupuesto: p, cliente: p.cliente_id ? clientesPorId.get(p.cliente_id) : undefined, expedientes: expedientes, onCambiado: cargar }, p.id))) }))] }));
}
function Cifra({ etiqueta, valor, detalle, destacada }) {
    return (_jsxs("div", { className: "superficie p-5", children: [_jsx("dt", { className: "eyebrow", children: etiqueta }), _jsx("dd", { className: `mt-2 text-[26px] font-light leading-none tabular-nums ${destacada ? 'text-white' : 'text-silver'}`, children: valor }), _jsx("dd", { className: "mt-2 text-xs text-text-gray-light", children: detalle })] }));
}
function FilaPresupuesto({ presupuesto, cliente, expedientes, onCambiado, }) {
    const [mostrarFirma, setMostrarFirma] = useState(false);
    const [editando, setEditando] = useState(false);
    const [procesando, setProcesando] = useState(false);
    const [error, setError] = useState(null);
    const nombreParte = cliente
        ? `${cliente.apellido}, ${cliente.nombre}`
        : presupuesto.contacto_nombre ?? 'Sin contacto';
    const esFinal = presupuesto.estado === 'firmado';
    async function transicionar(estado) {
        setProcesando(true);
        setError(null);
        try {
            await api.cambiarEstado(presupuesto.id, estado);
            onCambiado();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'No se pudo actualizar el estado.');
        }
        finally {
            setProcesando(false);
        }
    }
    async function eliminar() {
        if (!window.confirm(`¿Eliminar el presupuesto "${presupuesto.concepto}"? Esta acción no se puede deshacer.`)) {
            return;
        }
        setProcesando(true);
        setError(null);
        try {
            await api.eliminarPresupuesto(presupuesto.id);
            onCambiado();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'No se pudo eliminar el presupuesto.');
            setProcesando(false);
        }
    }
    return (_jsxs("div", { children: [_jsxs(FilaLista, { inicio: _jsx(BloqueIcono, { children: _jsx(FileTextIcon, { className: "h-5 w-5", strokeWidth: 1.5 }) }), lateral: _jsxs(_Fragment, { children: [_jsx("span", { className: "text-[15px] font-bold tabular-nums text-white", children: FORMATO_MONTO.format(presupuesto.monto / 100) }), _jsx(EstadoBadge, { estado: presupuesto.estado, colorMap: { borrador: 'neutral', enviado: 'warning', firmado: 'success', rechazado: 'warning', vencido: 'neutral' } })] }), acciones: _jsxs(_Fragment, { children: [!esFinal && (_jsxs(_Fragment, { children: [_jsx(Button, { variant: "ghost", size: "sm", disabled: procesando, onClick: (e) => {
                                        e.preventDefault();
                                        setEditando((v) => !v);
                                        setMostrarFirma(false);
                                    }, className: "rounded-sharp border border-line text-text-gray-light hover:text-white", children: editando ? 'Cancelar edición' : 'Editar' }), presupuesto.estado !== 'enviado' && (_jsx(Button, { variant: "ghost", size: "sm", disabled: procesando, onClick: (e) => {
                                        e.preventDefault();
                                        transicionar('enviado');
                                    }, className: "rounded-sharp border border-line text-text-gray-light hover:text-white", children: "Enviado" })), _jsx(Button, { variant: "ghost", size: "sm", disabled: procesando, onClick: (e) => {
                                        e.preventDefault();
                                        transicionar('rechazado');
                                    }, className: "rounded-sharp border border-line text-text-gray-light hover:text-white", children: "Rechazar" }), _jsx(Button, { variant: "ghost", size: "sm", disabled: procesando, onClick: (e) => {
                                        e.preventDefault();
                                        transicionar('vencido');
                                    }, className: "rounded-sharp border border-line text-text-gray-light hover:text-white", children: "Vencido" }), _jsx(Button, { variant: "ghost", size: "sm", disabled: procesando, onClick: (e) => {
                                        e.preventDefault();
                                        setMostrarFirma((v) => !v);
                                        setEditando(false);
                                    }, className: "rounded-sharp border border-success text-success hover:brightness-125", children: mostrarFirma ? 'Cancelar firma' : 'Firmar' }), _jsx(Button, { variant: "ghost", size: "sm", disabled: procesando, onClick: (e) => {
                                        e.preventDefault();
                                        eliminar();
                                    }, className: "rounded-sharp border border-warning text-warning hover:brightness-125", children: "Eliminar" })] })), esFinal && (_jsx(BotonEliminar, { descripcion: `el presupuesto firmado "${presupuesto.concepto}"`, tituloConContenido: "Eliminar presupuesto firmado", textoConfirmacion: "Este presupuesto est\u00E1 firmado. Si segu\u00EDs, se elimina definitivamente el registro del presupuesto. El cliente y el expediente vinculados NO se borran (si tambi\u00E9n fueron un error, eliminalos desde sus fichas) y el PDF, si existe, sigue en Documentos.", eliminar: (confirmado) => api.eliminarPresupuesto(presupuesto.id, confirmado), alEliminar: onCambiado, alFallar: setError }))] }), children: [_jsx("div", { className: "line-clamp-2 text-[15px] font-bold leading-snug text-white", children: presupuesto.concepto }), _jsxs("div", { className: "mt-0.5 truncate text-xs text-text-gray-light", children: [nombreParte, presupuesto.fecha_firma ? ` · firmado el ${fechaCorta(presupuesto.fecha_firma)}` : presupuesto.fecha_emision ? ` · emitido el ${fechaCorta(presupuesto.fecha_emision)}` : ''] })] }), error && _jsx("div", { className: "text-warning text-xs pb-3", children: error }), editando && (_jsx(FormularioEditarPresupuesto, { presupuesto: presupuesto, onGuardado: () => {
                    setEditando(false);
                    onCambiado();
                }, onCancelar: () => setEditando(false) })), mostrarFirma && (_jsx(FormularioFirma, { presupuesto: presupuesto, expedientes: expedientes, onFirmado: () => {
                    setMostrarFirma(false);
                    onCambiado();
                }, onCancelar: () => setMostrarFirma(false) }))] }));
}
function FormularioEditarPresupuesto({ presupuesto, onGuardado, onCancelar, }) {
    const [concepto, setConcepto] = useState(presupuesto.concepto);
    const [monto, setMonto] = useState((presupuesto.monto / 100).toFixed(2));
    const [contactoNombre, setContactoNombre] = useState(presupuesto.contacto_nombre ?? '');
    const [contactoTelefono, setContactoTelefono] = useState(presupuesto.contacto_telefono ?? '');
    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState(null);
    const necesitaContacto = !presupuesto.cliente_id;
    async function enviar(e) {
        e.preventDefault();
        setEnviando(true);
        setError(null);
        try {
            const montoNumero = Number(monto.replace(',', '.'));
            if (!Number.isFinite(montoNumero) || montoNumero <= 0) {
                throw new Error('El monto debe ser un número mayor a cero.');
            }
            await api.editarPresupuesto(presupuesto.id, {
                concepto,
                monto: Math.round(montoNumero * 100),
                contacto_nombre: necesitaContacto ? contactoNombre : undefined,
                contacto_telefono: necesitaContacto ? contactoTelefono || undefined : undefined,
            });
            onGuardado();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'No se pudo guardar los cambios.');
        }
        finally {
            setEnviando(false);
        }
    }
    return (_jsxs("form", { onSubmit: enviar, className: `superficie p-5 mb-4 grid gap-3 ${necesitaContacto ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`, children: [_jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { htmlFor: `editar-${presupuesto.id}-concepto`, className: etiquetaClases, children: "Concepto" }), _jsx(Input, { id: `editar-${presupuesto.id}-concepto`, className: campoClases, value: concepto, onChange: (e) => setConcepto(e.target.value), required: true })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { htmlFor: `editar-${presupuesto.id}-monto`, className: etiquetaClases, children: "Monto ($)" }), _jsx(Input, { id: `editar-${presupuesto.id}-monto`, type: "number", min: "0", step: "0.01", className: campoClases, value: monto, onChange: (e) => setMonto(e.target.value), required: true })] }), necesitaContacto && (_jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { htmlFor: `editar-${presupuesto.id}-contacto`, className: etiquetaClases, children: "Contacto" }), _jsx(Input, { id: `editar-${presupuesto.id}-contacto`, className: campoClases, value: contactoNombre, onChange: (e) => setContactoNombre(e.target.value), placeholder: "Nombre" }), _jsx(Input, { className: `${campoClases} mt-1.5`, value: contactoTelefono, onChange: (e) => setContactoTelefono(e.target.value), placeholder: "Tel\u00E9fono" })] })), error && _jsx("div", { className: "col-span-full text-warning text-sm", children: error }), _jsxs("div", { className: "col-span-full flex gap-2", children: [_jsx(Button, { type: "submit", disabled: enviando, className: "rounded-sharp bg-gradient-to-br from-silver via-silver-deep to-silver text-structural-black font-bold hover:brightness-110 focus-visible:ring-2 focus-visible:ring-silver disabled:opacity-60", children: enviando ? 'Guardando…' : 'Guardar cambios' }), _jsx(Button, { type: "button", variant: "ghost", onClick: onCancelar, disabled: enviando, className: "rounded-sharp border border-line text-text-gray-light hover:text-white", children: "Cancelar" })] })] }));
}
function FormularioFirma({ presupuesto, expedientes, onFirmado, onCancelar, }) {
    const [expedienteId, setExpedienteId] = useState('');
    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [dni, setDni] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState(null);
    const necesitaCliente = !presupuesto.cliente_id;
    async function enviar(e) {
        e.preventDefault();
        setEnviando(true);
        setError(null);
        try {
            await api.firmar(presupuesto.id, {
                expediente_id: expedienteId,
                nombre: necesitaCliente ? nombre : undefined,
                apellido: necesitaCliente ? apellido : undefined,
                dni: necesitaCliente ? dni || undefined : undefined,
            });
            onFirmado();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'No se pudo firmar el presupuesto.');
        }
        finally {
            setEnviando(false);
        }
    }
    return (_jsxs("form", { onSubmit: enviar, className: `superficie p-5 mb-4 grid gap-3 ${necesitaCliente ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1'}`, children: [_jsxs("div", { className: "flex flex-col gap-1 col-span-full", children: [_jsx("label", { htmlFor: `firma-${presupuesto.id}-expediente`, className: etiquetaClases, children: "Expediente" }), _jsxs("select", { id: `firma-${presupuesto.id}-expediente`, value: expedienteId, onChange: (e) => setExpedienteId(e.target.value), required: true, className: `${campoClases} block w-full h-8 px-2.5 text-sm text-white outline-none border`, children: [_jsx("option", { value: "", disabled: true, children: "Eleg\u00ED un expediente" }), expedientes.map((e) => (_jsx("option", { value: e.id, className: "bg-graphite text-white", children: e.caratula }, e.id)))] })] }), necesitaCliente && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { htmlFor: `firma-${presupuesto.id}-nombre`, className: etiquetaClases, children: "Nombre" }), _jsx(Input, { id: `firma-${presupuesto.id}-nombre`, className: campoClases, value: nombre, onChange: (e) => setNombre(e.target.value), required: true })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { htmlFor: `firma-${presupuesto.id}-apellido`, className: etiquetaClases, children: "Apellido" }), _jsx(Input, { id: `firma-${presupuesto.id}-apellido`, className: campoClases, value: apellido, onChange: (e) => setApellido(e.target.value), required: true })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { htmlFor: `firma-${presupuesto.id}-dni`, className: etiquetaClases, children: "DNI" }), _jsx(Input, { id: `firma-${presupuesto.id}-dni`, className: campoClases, value: dni, onChange: (e) => setDni(e.target.value) })] })] })), error && _jsx("div", { className: "col-span-full text-warning text-sm", children: error }), _jsxs("div", { className: "col-span-full flex gap-2", children: [_jsx(Button, { type: "submit", disabled: enviando || expedientes.length === 0, className: "rounded-sharp bg-gradient-to-br from-silver via-silver-deep to-silver text-structural-black font-bold hover:brightness-110 focus-visible:ring-2 focus-visible:ring-silver disabled:opacity-60", children: enviando ? 'Firmando…' : 'Confirmar firma' }), _jsx(Button, { type: "button", variant: "ghost", onClick: onCancelar, disabled: enviando, className: "rounded-sharp border border-line text-text-gray-light hover:text-white", children: "Cancelar" })] })] }));
}
function FormularioNuevoPresupuesto({ clientes, onCreado, }) {
    const [usaClienteExistente, setUsaClienteExistente] = useState(true);
    const [clienteId, setClienteId] = useState('');
    const [contactoNombre, setContactoNombre] = useState('');
    const [contactoTelefono, setContactoTelefono] = useState('');
    const [concepto, setConcepto] = useState('');
    const [monto, setMonto] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState(null);
    async function enviar(e) {
        e.preventDefault();
        setEnviando(true);
        setError(null);
        try {
            const montoNumero = Number(monto.replace(',', '.'));
            if (!Number.isFinite(montoNumero) || montoNumero <= 0) {
                throw new Error('El monto debe ser un número mayor a cero.');
            }
            await api.crearPresupuesto({
                cliente_id: usaClienteExistente ? clienteId : undefined,
                contacto_nombre: usaClienteExistente ? undefined : contactoNombre,
                contacto_telefono: usaClienteExistente ? undefined : contactoTelefono || undefined,
                concepto,
                monto: Math.round(montoNumero * 100),
            });
            onCreado();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Error al crear el presupuesto.');
        }
        finally {
            setEnviando(false);
        }
    }
    return (_jsxs("form", { onSubmit: enviar, className: "superficie p-5 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3", children: [_jsxs("div", { className: "sm:col-span-2 flex gap-4 text-sm text-white", children: [_jsxs("label", { htmlFor: "nuevo-presupuesto-cliente-existente", className: "flex items-center gap-1.5 cursor-pointer", children: [_jsx("input", { id: "nuevo-presupuesto-cliente-existente", type: "radio", checked: usaClienteExistente, onChange: () => setUsaClienteExistente(true), className: "accent-silver" }), "Cliente existente"] }), _jsxs("label", { htmlFor: "nuevo-presupuesto-contacto-nuevo", className: "flex items-center gap-1.5 cursor-pointer", children: [_jsx("input", { id: "nuevo-presupuesto-contacto-nuevo", type: "radio", checked: !usaClienteExistente, onChange: () => setUsaClienteExistente(false), className: "accent-silver" }), "Contacto nuevo (potencial cliente)"] })] }), usaClienteExistente ? (_jsxs("div", { className: "flex flex-col gap-1 sm:col-span-2", children: [_jsx("label", { htmlFor: "nuevo-presupuesto-cliente", className: etiquetaClases, children: "Cliente" }), _jsxs("select", { id: "nuevo-presupuesto-cliente", value: clienteId, onChange: (e) => setClienteId(e.target.value), required: true, className: `${campoClases} block w-full h-8 px-2.5 text-sm text-white outline-none border`, children: [_jsx("option", { value: "", disabled: true, children: "Eleg\u00ED un cliente" }), clientes.map((c) => (_jsxs("option", { value: c.id, className: "bg-graphite text-white", children: [c.apellido, ", ", c.nombre] }, c.id)))] })] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { htmlFor: "nuevo-presupuesto-contacto-nombre", className: etiquetaClases, children: "Nombre del contacto" }), _jsx(Input, { id: "nuevo-presupuesto-contacto-nombre", className: campoClases, value: contactoNombre, onChange: (e) => setContactoNombre(e.target.value), required: true })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { htmlFor: "nuevo-presupuesto-contacto-telefono", className: etiquetaClases, children: "Tel\u00E9fono" }), _jsx(Input, { id: "nuevo-presupuesto-contacto-telefono", className: campoClases, value: contactoTelefono, onChange: (e) => setContactoTelefono(e.target.value) })] })] })), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { htmlFor: "nuevo-presupuesto-concepto", className: etiquetaClases, children: "Concepto" }), _jsx(Input, { id: "nuevo-presupuesto-concepto", className: campoClases, value: concepto, onChange: (e) => setConcepto(e.target.value), required: true })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { htmlFor: "nuevo-presupuesto-monto", className: etiquetaClases, children: "Monto ($)" }), _jsx(Input, { id: "nuevo-presupuesto-monto", type: "number", min: "0", step: "0.01", className: campoClases, value: monto, onChange: (e) => setMonto(e.target.value), required: true })] }), error && _jsx("div", { className: "sm:col-span-2 text-warning text-sm", children: error }), _jsx("div", { className: "sm:col-span-2", children: _jsx(Button, { type: "submit", disabled: enviando, className: "rounded-sharp bg-gradient-to-br from-silver via-silver-deep to-silver text-structural-black font-bold hover:brightness-110 focus-visible:ring-2 focus-visible:ring-silver disabled:opacity-60", children: enviando ? 'Guardando…' : 'Guardar presupuesto' }) })] }));
}
