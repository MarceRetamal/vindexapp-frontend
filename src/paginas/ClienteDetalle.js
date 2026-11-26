import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { MailIcon, MessageCircleIcon, PhoneIcon } from 'lucide-react';
import { api } from '../api/cliente';
import { EstadoBadge } from '../componentes/EstadoBadge';
import { BotonEliminar } from '../componentes/BotonEliminar';
import { PanelDocumentos } from '../componentes/PanelDocumentos';
import { PanelCausasCliente } from '../componentes/PanelCausasCliente';
import { PanelAsignarExpedientes } from '../componentes/PanelAsignarExpedientes';
import { SituacionCliente } from '../componentes/SituacionCliente';
import { enlaceWhatsApp } from '../lib/telefono';
import { EmptyState } from '../componentes/EmptyState';
import { ErrorBanner } from '../componentes/ErrorBanner';
import { ListSkeleton } from '../componentes/ListSkeleton';
const accionContacto = 'inline-flex h-9 items-center gap-2 rounded-full border border-line px-3.5 text-[13px] text-silver transition-colors hover:border-silver-deep hover:text-white';
export function ClienteDetalle() {
    const [asignados, setAsignados] = useState(0);
    const { id } = useParams();
    const navegar = useNavigate();
    const [errorEliminar, setErrorEliminar] = useState(null);
    const [cliente, setCliente] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        if (!id)
            return;
        setCargando(true);
        setError(null);
        api
            .obtenerCliente(id)
            .then(setCliente)
            .catch((e) => setError(e.message))
            .finally(() => setCargando(false));
    }, [id]);
    if (cargando) {
        return (_jsxs("div", { children: [_jsx(VolverAClientes, {}), _jsx("div", { className: "mt-4", children: _jsx(ListSkeleton, { rows: 3 }) })] }));
    }
    if (error) {
        return (_jsxs("div", { children: [_jsx(VolverAClientes, {}), _jsx("div", { className: "mt-4", children: _jsx(ErrorBanner, { message: `No se pudo cargar el cliente: ${error}` }) })] }));
    }
    if (!cliente) {
        return null;
    }
    const sinDatos = !cliente.domicilio &&
        !cliente.localidad &&
        !cliente.telefono_fijo &&
        !cliente.whatsapp &&
        !cliente.email;
    return (_jsxs("div", { children: [_jsx(VolverAClientes, {}), _jsxs("header", { className: "mb-8 mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "eyebrow", children: "Cliente" }), _jsxs("h1", { className: "mt-2 break-words text-2xl font-black leading-tight text-white sm:text-[30px]", children: [cliente.apellido, ", ", cliente.nombre] }), _jsx("p", { className: "mt-2 text-sm text-silver", children: [cliente.dni ? `DNI ${cliente.dni}` : 'Sin DNI cargado', cliente.localidad].filter(Boolean).join(' · ') }), _jsxs("div", { className: "mt-4 flex flex-wrap gap-2", children: [enlaceWhatsApp(cliente.whatsapp) && (_jsxs("a", { href: enlaceWhatsApp(cliente.whatsapp) ?? undefined, target: "_blank", rel: "noopener noreferrer", className: accionContacto, children: [_jsx(MessageCircleIcon, { className: "h-4 w-4", strokeWidth: 1.6 }), " WhatsApp"] })), (cliente.telefono_fijo || cliente.whatsapp) && (_jsxs("a", { href: `tel:${(cliente.whatsapp ?? cliente.telefono_fijo ?? '').replace(/[^\d+]/g, '')}`, className: accionContacto, children: [_jsx(PhoneIcon, { className: "h-4 w-4", strokeWidth: 1.6 }), " Llamar"] })), cliente.email && (_jsxs("a", { href: `mailto:${cliente.email}`, className: accionContacto, children: [_jsx(MailIcon, { className: "h-4 w-4", strokeWidth: 1.6 }), " Mail"] }))] })] }), _jsxs("div", { className: "flex flex-row flex-wrap items-center gap-2 sm:flex-col sm:items-end sm:shrink-0", children: [_jsx(EstadoBadge, { estado: cliente.estado, colorMap: { Activo: 'success', Potencial: 'warning', Inactivo: 'neutral' } }), _jsx(BotonEliminar, { etiqueta: "Eliminar cliente", descripcion: `el cliente ${cliente.apellido}, ${cliente.nombre}`, tituloConContenido: "Eliminar cliente con todo su contenido", alternativa: "Si solo quer\u00E9s dejar de verlo en la lista de activos, es mejor pasarlo a estado Inactivo: no se pierde nada.", eliminar: (conContenido) => api.eliminarCliente(cliente.id, conContenido), alEliminar: () => navegar('/clientes'), alFallar: setErrorEliminar })] })] }), errorEliminar && _jsx(ErrorBanner, { message: errorEliminar }), _jsx(SituacionCliente, { clienteId: id }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-8", children: [_jsxs("div", { className: "lg:col-span-2 flex flex-col gap-6", children: [_jsxs("section", { className: "superficie p-5", children: [_jsx("h2", { className: "eyebrow mb-3 text-silver", children: "Datos de contacto" }), sinDatos ? (_jsx(EmptyState, { message: "Todav\u00EDa no se cargaron datos de contacto para este cliente." })) : (_jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: [_jsx(Dato, { etiqueta: "Domicilio", valor: cliente.domicilio }), _jsx(Dato, { etiqueta: "Localidad", valor: cliente.localidad }), _jsx(Dato, { etiqueta: "Tel\u00E9fono fijo", valor: cliente.telefono_fijo }), _jsx(Dato, { etiqueta: "WhatsApp", valor: cliente.whatsapp }), _jsx(Dato, { etiqueta: "Email", valor: cliente.email })] })), cliente.notas && (_jsxs("div", { className: "mt-4 pt-3 border-t border-line", children: [_jsx("div", { className: "text-xs text-text-gray-light mb-1", children: "Notas" }), _jsx("p", { className: "text-sm text-white whitespace-pre-wrap", children: cliente.notas })] }))] }), _jsx(PanelCausasCliente, { clienteId: id }, `causas-${String(asignados)}`), _jsx(PanelAsignarExpedientes, { clienteId: id, onAsignado: () => setAsignados((n) => n + 1) })] }), _jsx("div", { className: "flex flex-col gap-6", children: _jsx(PanelDocumentos, { clienteId: id }) })] })] }));
}
function VolverAClientes() {
    return (_jsx(Link, { to: "/clientes", className: "text-sm text-silver hover:brightness-125 no-underline", children: "\u2190 Volver a clientes" }));
}
function Dato({ etiqueta, valor }) {
    return (_jsxs("div", { children: [_jsx("div", { className: "text-xs text-text-gray-light mb-0.5", children: etiqueta }), _jsx("div", { className: "text-sm font-medium text-white", children: valor ?? '—' })] }));
}
