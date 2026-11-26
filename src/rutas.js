import { jsx as _jsx } from "react/jsx-runtime";
import { createBrowserRouter } from 'react-router';
import { Layout } from './componentes/Layout';
import { Dashboard } from './paginas/Dashboard';
import { Clientes } from './paginas/Clientes';
import { ClienteDetalle } from './paginas/ClienteDetalle';
import { Expedientes } from './paginas/Expedientes';
import { ExpedienteDetalle } from './paginas/ExpedienteDetalle';
import { Presupuestos } from './paginas/Presupuestos';
import { Agenda } from './paginas/Agenda';
import { Liquidaciones } from './paginas/Liquidaciones';
import { Reportes } from './paginas/Reportes';
import { Novedades } from './paginas/Novedades';
import { Tareas } from './paginas/Tareas';
import { Plazos } from './paginas/Plazos';
import { Configuracion } from './paginas/Configuracion';
import { Jurisprudencia } from './paginas/Jurisprudencia';
import { WhatsApp } from './paginas/WhatsApp';
export const router = createBrowserRouter([
    {
        path: '/',
        element: _jsx(Layout, {}),
        children: [
            { index: true, element: _jsx(Dashboard, {}) },
            { path: 'novedades', element: _jsx(Novedades, {}) },
            { path: 'tareas', element: _jsx(Tareas, {}) },
            { path: 'plazos', element: _jsx(Plazos, {}) },
            { path: 'clientes', element: _jsx(Clientes, {}) },
            { path: 'clientes/:id', element: _jsx(ClienteDetalle, {}) },
            { path: 'expedientes', element: _jsx(Expedientes, {}) },
            { path: 'expedientes/:id', element: _jsx(ExpedienteDetalle, {}) },
            { path: 'presupuestos', element: _jsx(Presupuestos, {}) },
            { path: 'agenda', element: _jsx(Agenda, {}) },
            { path: 'liquidaciones', element: _jsx(Liquidaciones, {}) },
            { path: 'reportes', element: _jsx(Reportes, {}) },
            { path: 'configuracion', element: _jsx(Configuracion, {}) },
            { path: 'jurisprudencia', element: _jsx(Jurisprudencia, {}) },
            { path: 'whatsapp', element: _jsx(WhatsApp, {}) },
        ],
    },
]);
