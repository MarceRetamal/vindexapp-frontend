import { createBrowserRouter, Navigate } from 'react-router';
import { Layout } from './componentes/Layout';
import { Clientes } from './paginas/Clientes';
import { Expedientes } from './paginas/Expedientes';
import { ExpedienteDetalle } from './paginas/ExpedienteDetalle';
import { Pendiente } from './paginas/Pendiente';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Navigate to="/clientes" replace /> },
      { path: 'clientes', element: <Clientes /> },
      { path: 'expedientes', element: <Expedientes /> },
      { path: 'expedientes/:id', element: <ExpedienteDetalle /> },
      { path: 'presupuestos', element: <Pendiente titulo="Presupuestos" /> },
      { path: 'agenda', element: <Pendiente titulo="Agenda" /> },
    ],
  },
]);