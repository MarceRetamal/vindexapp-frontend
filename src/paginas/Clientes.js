import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { api } from '../api/cliente';
import { BarraDeLista } from '../componentes/BarraDeLista';
import { BloqueIcono, FilaLista } from '../componentes/FilaLista';
import { FormularioCliente } from '../componentes/FormularioCliente';
import { PageHeader } from '../componentes/PageHeader';
import { EmptyState } from '../componentes/EmptyState';
import { ErrorBanner } from '../componentes/ErrorBanner';
import { EstadoBadge } from '../componentes/EstadoBadge';
import { ListSkeleton } from '../componentes/ListSkeleton';
import { Button } from '@/componentes/ui/button';
import { iniciales } from '../lib/fechas';
import { coincide } from '../lib/texto';
export function Clientes() {
    const [clientes, setClientes] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [busqueda, setBusqueda] = useState('');
    const [filtro, setFiltro] = useState('todos');
    const navegar = useNavigate();
    function cargar() {
        setCargando(true);
        setError(null);
        api
            .listarClientes()
            .then(setClientes)
            .catch((e) => setError(e.message))
            .finally(() => setCargando(false));
    }
    useEffect(cargar, []);
    const visibles = useMemo(() => clientes.filter((c) => (filtro === 'todos' || c.estado === filtro) &&
        coincide(busqueda, `${c.apellido} ${c.nombre} ${c.dni ?? ''} ${c.email ?? ''} ${c.whatsapp ?? ''} ${c.localidad ?? ''}`)), [clientes, filtro, busqueda]);
    const cantidad = (estado) => (estado === 'todos' ? clientes.length : clientes.filter((c) => c.estado === estado).length);
    return (_jsxs("div", { children: [_jsx(PageHeader, { eyebrow: "Causas", title: "Clientes", count: clientes.length, ctaLabel: mostrarFormulario ? 'Cancelar' : '+ Nuevo cliente', onCta: () => setMostrarFormulario((v) => !v) }), mostrarFormulario && (_jsx(FormularioCliente
            // Después de crear un cliente se abre su ficha, donde el sistema busca sus causas en el portal.
            , { 
                // Después de crear un cliente se abre su ficha, donde el sistema busca sus causas en el portal.
                onGuardado: (id) => navegar(`/clientes/${id}`), onCancelar: () => setMostrarFormulario(false) })), error && _jsx(ErrorBanner, { message: `No se pudo cargar el listado: ${error}` }), !cargando && clientes.length > 0 && (_jsx(BarraDeLista, { busqueda: busqueda, onBusqueda: setBusqueda, placeholder: "Apellido, nombre, DNI o mail", etiquetaBusqueda: "Buscar un cliente", filtro: filtro, onFiltro: setFiltro, etiquetaFiltro: "Estado de los clientes", opciones: [
                    { valor: 'todos', texto: 'Todos', cantidad: cantidad('todos') },
                    { valor: 'Activo', texto: 'Activos', cantidad: cantidad('Activo') },
                    { valor: 'Potencial', texto: 'Potenciales', cantidad: cantidad('Potencial') },
                    { valor: 'Inactivo', texto: 'Inactivos', cantidad: cantidad('Inactivo') },
                ] })), cargando ? (_jsx(ListSkeleton, { rows: 6 })) : clientes.length === 0 ? (_jsx(EmptyState, { message: 'Todav\u00EDa no hay clientes cargados. Us\u00E1 "Nuevo cliente" para agregar el primero: al guardarlo, el sistema busca sus causas en el portal.' })) : visibles.length === 0 ? (_jsx(EmptyState, { message: "Ning\u00FAn cliente coincide con la b\u00FAsqueda.", accion: _jsx(Button, { variant: "ghost", onClick: () => { setBusqueda(''); setFiltro('todos'); }, className: "rounded-sharp border border-line text-silver hover:text-white", children: "Ver todos los clientes" }) })) : (_jsx("div", { className: "flex flex-col gap-2", children: visibles.map((cliente) => (_jsxs(FilaLista, { to: `/clientes/${cliente.id}`, inicio: _jsx(BloqueIcono, { redondo: true, children: iniciales(cliente.nombre, cliente.apellido) }), lateral: _jsx(EstadoBadge, { estado: cliente.estado, colorMap: { Activo: 'success', Potencial: 'warning', Inactivo: 'neutral' } }), children: [_jsxs("div", { className: "truncate text-[15px] font-bold text-white", children: [cliente.apellido, ", ", cliente.nombre] }), _jsx("div", { className: "mt-0.5 truncate text-xs text-text-gray-light", children: [cliente.dni ? `DNI ${cliente.dni}` : 'Sin DNI cargado', cliente.whatsapp, cliente.localidad].filter(Boolean).join(' · ') }), cliente.email && _jsx("div", { className: "truncate text-xs text-silver-deep", children: cliente.email })] }, cliente.id))) }))] }));
}
