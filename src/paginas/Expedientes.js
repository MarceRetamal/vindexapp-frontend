import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { FolderOpenIcon } from 'lucide-react';
import { api } from '../api/expedientes';
import { api as clientesApi } from '../api/cliente';
import { PageHeader } from '../componentes/PageHeader';
import { BarraDeLista } from '../componentes/BarraDeLista';
import { BloqueIcono, FilaLista } from '../componentes/FilaLista';
import { coincide } from '../lib/texto';
import { EmptyState } from '../componentes/EmptyState';
import { ErrorBanner } from '../componentes/ErrorBanner';
import { ListSkeleton } from '../componentes/ListSkeleton';
import { EstadoBadge } from '../componentes/EstadoBadge';
import { MarcaPortal } from '../componentes/MarcaPortal';
import { Chips } from '../componentes/BarraFiltros';
import { InsigniaRol, SelectorRol } from '../componentes/RolProfesional';
import { useSearchParams } from 'react-router';
import { Button } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
const campoClases = 'rounded-sharp bg-graphite border-line focus-visible:ring-silver';
const etiquetaClases = 'text-xs text-text-gray-light';
export function Expedientes() {
    const navegar = useNavigate();
    const [expedientes, setExpedientes] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [busqueda, setBusqueda] = useState('');
    const [filtro, setFiltro] = useState('vigentes');
    const [params, setParams] = useSearchParams();
    const filtroRol = (['particular', 'deas', 'asesor_incapaces', 'sin_rol', 'sin_cliente'].includes(params.get('rol') ?? '') ? params.get('rol') : 'todos');
    const setFiltroRol = (v) => setParams(v === 'todos' ? {} : { rol: v }, { replace: true });
    function cargar() {
        setCargando(true);
        setError(null);
        Promise.all([api.listarExpedientes(), clientesApi.listarClientes()])
            .then(([expedientesCargados, clientesCargados]) => {
            setExpedientes(expedientesCargados);
            setClientes(clientesCargados);
        })
            .catch((e) => setError(e.message))
            .finally(() => setCargando(false));
    }
    useEffect(cargar, []);
    const vigentes = expedientes.filter((e) => e.estado !== 'Archivado');
    const visibles = useMemo(() => expedientes.filter((e) => (filtro === 'todos' || (filtro === 'archivados') === (e.estado === 'Archivado')) &&
        (filtroRol === 'todos' ||
            (filtroRol === 'sin_cliente' ? e.cliente_id === null : filtroRol === 'sin_rol' ? e.rol_profesional === null : e.rol_profesional === filtroRol)) &&
        coincide(busqueda, `${e.caratula} ${e.numero ?? ''} ${e.juzgado ?? ''} ${e.fuero ?? ''} ${e.cliente_apellido ?? ''} ${e.cliente_nombre ?? ''}`)), [expedientes, filtro, busqueda, filtroRol]);
    return (_jsxs("div", { children: [_jsx(PageHeader, { eyebrow: "Causas", title: "Expedientes", count: vigentes.length, ctaLabel: mostrarFormulario ? 'Cancelar' : '+ Nuevo expediente', onCta: () => setMostrarFormulario((v) => !v) }), mostrarFormulario && (_jsx(FormularioNuevoExpediente, { clientes: clientes, 
                // Se abre la ficha del expediente nuevo: ahí aparece la causa del portal con el mismo número, si existe.
                onCreado: (id) => navegar(`/expedientes/${id}`) })), error && _jsx(ErrorBanner, { message: `No se pudo cargar el listado: ${error}` }), !cargando && expedientes.length > 0 && (_jsx(BarraDeLista, { busqueda: busqueda, onBusqueda: setBusqueda, placeholder: "Car\u00E1tula, n\u00FAmero, juzgado o cliente", etiquetaBusqueda: "Buscar un expediente", filtro: filtro, onFiltro: setFiltro, etiquetaFiltro: "Estado de los expedientes", opciones: [
                    { valor: 'vigentes', texto: 'Vigentes', cantidad: vigentes.length },
                    { valor: 'archivados', texto: 'Archivados', cantidad: expedientes.length - vigentes.length },
                    { valor: 'todos', texto: 'Todos', cantidad: expedientes.length },
                ] })), !cargando && expedientes.length > 0 && (_jsx("div", { className: "mb-4", children: _jsx(Chips, { etiqueta: "Rol profesional", valor: filtroRol, onCambio: setFiltroRol, opciones: [
                        { valor: 'todos', texto: 'Todos los roles' },
                        { valor: 'particular', texto: 'Particular', cantidad: vigentes.filter((e) => e.rol_profesional === 'particular').length },
                        { valor: 'deas', texto: 'DEAS', cantidad: vigentes.filter((e) => e.rol_profesional === 'deas').length },
                        { valor: 'asesor_incapaces', texto: 'Asesor de incapaces', cantidad: vigentes.filter((e) => e.rol_profesional === 'asesor_incapaces').length },
                        { valor: 'sin_rol', texto: 'Sin rol', cantidad: vigentes.filter((e) => e.rol_profesional === null).length },
                        { valor: 'sin_cliente', texto: 'Cliente por asignar', cantidad: vigentes.filter((e) => e.cliente_id === null).length },
                    ] }) })), cargando ? (_jsx(ListSkeleton, { rows: 6 })) : expedientes.length === 0 ? (_jsx(EmptyState, { message: 'Todav\u00EDa no hay expedientes cargados. Us\u00E1 "Nuevo expediente" para agregar el primero, o vincul\u00E1 las causas que ya ley\u00F3 el portal desde la ficha de un cliente.' })) : visibles.length === 0 ? (_jsx(EmptyState, { message: "Ning\u00FAn expediente coincide con la b\u00FAsqueda.", accion: _jsx(Button, { variant: "ghost", onClick: () => { setBusqueda(''); setFiltro('todos'); }, className: "rounded-sharp border border-line text-silver hover:text-white", children: "Ver todos los expedientes" }) })) : (_jsx("div", { className: "flex flex-col gap-2", children: visibles.map((e) => (_jsx(FilaExpediente, { expediente: e, onCambiado: cargar }, e.id))) }))] }));
}
function FilaExpediente({ expediente, onCambiado }) {
    const [editando, setEditando] = useState(false);
    const [procesando, setProcesando] = useState(false);
    const [error, setError] = useState(null);
    const estaDeBaja = expediente.estado === 'Archivado';
    async function darDeBaja() {
        const motivo = window.prompt('Motivo de la baja (opcional):');
        if (motivo === null)
            return;
        setProcesando(true);
        setError(null);
        try {
            await api.darDeBajaExpediente(expediente.id, motivo || undefined);
            onCambiado();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'No se pudo dar de baja el expediente.');
        }
        finally {
            setProcesando(false);
        }
    }
    async function reactivar() {
        setProcesando(true);
        setError(null);
        try {
            await api.reactivarExpediente(expediente.id);
            onCambiado();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'No se pudo reactivar el expediente.');
        }
        finally {
            setProcesando(false);
        }
    }
    const detalle = [expediente.cliente_id ? `${expediente.cliente_apellido ?? ''}, ${expediente.cliente_nombre ?? ''}` : 'Cliente por asignar', expediente.numero ? `N° ${expediente.numero}` : null, expediente.fuero].filter(Boolean).join(' · ');
    return (_jsxs("div", { children: [_jsxs(FilaLista, { to: `/expedientes/${expediente.id}`, inicio: _jsx(BloqueIcono, { children: _jsx(FolderOpenIcon, { className: "h-5 w-5", strokeWidth: 1.5 }) }), lateral: _jsxs(_Fragment, { children: [_jsx(MarcaPortal, { causas: expediente.causas_portal, pendientes: expediente.novedades_pendientes }), _jsx(EstadoBadge, { estado: expediente.estado, colorMap: { Activo: 'success', 'En trámite': 'warning', Archivado: 'neutral' } })] }), acciones: _jsxs(_Fragment, { children: [_jsx(Button, { variant: "ghost", size: "sm", disabled: procesando, onClick: () => setEditando((v) => !v), className: "rounded-sharp border border-line text-text-gray-light hover:text-white", children: editando ? 'Cancelar' : 'Editar' }), estaDeBaja ? (_jsx(Button, { variant: "ghost", size: "sm", disabled: procesando, onClick: reactivar, className: "rounded-sharp border border-success text-success hover:brightness-125", children: "Reactivar" })) : (_jsx(Button, { variant: "ghost", size: "sm", disabled: procesando, onClick: darDeBaja, className: "rounded-sharp border border-line text-text-gray-light hover:border-warning hover:text-warning", children: "Dar de baja" }))] }), children: [_jsxs("div", { className: "flex items-start gap-2", children: [_jsx(InsigniaRol, { rol: expediente.rol_profesional }), _jsx("div", { className: "line-clamp-2 text-[15px] font-bold leading-snug text-white", children: expediente.caratula })] }), _jsx("div", { className: "mt-0.5 truncate text-xs text-text-gray-light", children: detalle }), expediente.juzgado && _jsx("div", { className: "truncate text-xs text-silver-deep", children: expediente.juzgado })] }), error && _jsx("div", { className: "pt-2 text-xs text-warning", children: error }), editando && (_jsx(FormularioEditarExpediente, { expediente: expediente, onGuardado: () => {
                    setEditando(false);
                    onCambiado();
                }, onCancelar: () => setEditando(false) }))] }));
}
function FormularioEditarExpediente({ expediente, onGuardado, onCancelar, }) {
    const [caratula, setCaratula] = useState(expediente.caratula);
    const [numero, setNumero] = useState(expediente.numero ?? '');
    const [fuero, setFuero] = useState(expediente.fuero ?? '');
    const [juzgado, setJuzgado] = useState(expediente.juzgado ?? '');
    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState(null);
    async function enviar(e) {
        e.preventDefault();
        setEnviando(true);
        setError(null);
        try {
            await api.editarExpediente(expediente.id, {
                caratula,
                numero: numero || undefined,
                fuero: fuero || undefined,
                juzgado: juzgado || undefined,
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
    return (_jsxs("form", { onSubmit: enviar, className: "superficie p-5 mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3", children: [_jsxs("div", { className: "flex flex-col gap-1 sm:col-span-2", children: [_jsx("label", { htmlFor: `editar-${expediente.id}-caratula`, className: etiquetaClases, children: "Car\u00E1tula" }), _jsx(Input, { id: `editar-${expediente.id}-caratula`, className: campoClases, value: caratula, onChange: (e) => setCaratula(e.target.value), required: true })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { htmlFor: `editar-${expediente.id}-numero`, className: etiquetaClases, children: "N\u00FAmero" }), _jsx(Input, { id: `editar-${expediente.id}-numero`, className: campoClases, value: numero, onChange: (e) => setNumero(e.target.value) })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { htmlFor: `editar-${expediente.id}-fuero`, className: etiquetaClases, children: "Fuero" }), _jsx(Input, { id: `editar-${expediente.id}-fuero`, className: campoClases, value: fuero, onChange: (e) => setFuero(e.target.value) })] }), _jsxs("div", { className: "flex flex-col gap-1 sm:col-span-2", children: [_jsx("label", { htmlFor: `editar-${expediente.id}-juzgado`, className: etiquetaClases, children: "Juzgado" }), _jsx(Input, { id: `editar-${expediente.id}-juzgado`, className: campoClases, value: juzgado, onChange: (e) => setJuzgado(e.target.value) })] }), error && _jsx("div", { className: "sm:col-span-2 text-warning text-sm", children: error }), _jsxs("div", { className: "sm:col-span-2 flex gap-2", children: [_jsx(Button, { type: "submit", disabled: enviando, className: "rounded-sharp bg-gradient-to-br from-silver via-silver-deep to-silver text-structural-black font-bold hover:brightness-110 focus-visible:ring-2 focus-visible:ring-silver disabled:opacity-60", children: enviando ? 'Guardando…' : 'Guardar cambios' }), _jsx(Button, { type: "button", variant: "ghost", onClick: onCancelar, disabled: enviando, className: "rounded-sharp border border-line text-text-gray-light hover:text-white", children: "Cancelar" })] })] }));
}
function FormularioNuevoExpediente({ clientes, onCreado, }) {
    const [clienteId, setClienteId] = useState('');
    const [caratula, setCaratula] = useState('');
    const [numero, setNumero] = useState('');
    const [fuero, setFuero] = useState('');
    const [juzgado, setJuzgado] = useState('');
    const [rol, setRol] = useState(null);
    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState(null);
    async function enviar(e) {
        e.preventDefault();
        setEnviando(true);
        setError(null);
        try {
            const creado = await api.crearExpediente({
                cliente_id: clienteId,
                caratula,
                numero: numero || undefined,
                fuero: fuero || undefined,
                juzgado: juzgado || undefined,
                rol_profesional: rol,
            });
            onCreado(creado.id);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Error al crear el expediente.');
        }
        finally {
            setEnviando(false);
        }
    }
    return (_jsxs("form", { onSubmit: enviar, className: "superficie p-5 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3", children: [clientes.length === 0 && (_jsx("div", { className: "sm:col-span-2", children: _jsx(ErrorBanner, { message: "Todav\u00EDa no hay clientes cargados. Cre\u00E1 uno primero en la secci\u00F3n Clientes." }) })), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { htmlFor: "nuevo-expediente-cliente", className: etiquetaClases, children: "Cliente" }), _jsxs("select", { id: "nuevo-expediente-cliente", value: clienteId, onChange: (e) => setClienteId(e.target.value), required: true, className: `${campoClases} block w-full h-8 px-2.5 text-sm text-white outline-none border`, children: [_jsx("option", { value: "", disabled: true, children: "Eleg\u00ED un cliente" }), clientes.map((c) => (_jsxs("option", { value: c.id, className: "bg-graphite text-white", children: [c.apellido, ", ", c.nombre] }, c.id)))] })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { htmlFor: "nuevo-expediente-caratula", className: etiquetaClases, children: "Car\u00E1tula" }), _jsx(Input, { id: "nuevo-expediente-caratula", className: campoClases, value: caratula, onChange: (e) => setCaratula(e.target.value), required: true })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { htmlFor: "nuevo-expediente-numero", className: etiquetaClases, children: "N\u00FAmero" }), _jsx(Input, { id: "nuevo-expediente-numero", className: campoClases, value: numero, onChange: (e) => setNumero(e.target.value) })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { htmlFor: "nuevo-expediente-fuero", className: etiquetaClases, children: "Fuero" }), _jsx(Input, { id: "nuevo-expediente-fuero", className: campoClases, value: fuero, onChange: (e) => setFuero(e.target.value) })] }), _jsxs("div", { className: "flex flex-col gap-1 sm:col-span-2", children: [_jsx("label", { htmlFor: "nuevo-expediente-juzgado", className: etiquetaClases, children: "Juzgado" }), _jsx(Input, { id: "nuevo-expediente-juzgado", className: campoClases, value: juzgado, onChange: (e) => setJuzgado(e.target.value) })] }), _jsxs("div", { className: "flex flex-col gap-1.5 sm:col-span-2", children: [_jsx("span", { className: etiquetaClases, children: "Tu rol en el expediente" }), _jsx(SelectorRol, { valor: rol, onCambio: setRol })] }), error && _jsx("div", { className: "sm:col-span-2 text-warning text-sm", children: error }), _jsx("div", { className: "sm:col-span-2", children: _jsx(Button, { type: "submit", disabled: enviando || clientes.length === 0, className: "rounded-sharp bg-gradient-to-br from-silver via-silver-deep to-silver text-structural-black font-bold hover:brightness-110 focus-visible:ring-2 focus-visible:ring-silver disabled:opacity-60", children: enviando ? 'Guardando…' : 'Guardar expediente' }) })] }));
}
