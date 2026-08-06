import { createBrowserRouter, Navigate } from 'react-router';
import { Layout } from './componentes/Layout';
import { Clientes } from './paginas/Clientes';
import { Expedientes } from './paginas/Expedientes';
import { ExpedienteDetalle } from './paginas/ExpedienteDetalle';
import { Presupuestos } from './paginas/Presupuestos';
import { Agenda } from './paginas/Agenda';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Navigate to="/clientes" replace /> },
      { path: 'clientes', element: <Clientes /> },
      { path: 'expedientes', element: <Expedientes /> },
      { path: 'expedientes/:id', element: <ExpedienteDetalle /> },
      { path: 'presupuestos', element: <Presupuestos /> },
      { path: 'agenda', element: <Agenda /> },
    ],
  },
]);