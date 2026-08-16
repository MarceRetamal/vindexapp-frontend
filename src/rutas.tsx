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

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'clientes', element: <Clientes /> },
      { path: 'clientes/:id', element: <ClienteDetalle /> },
      { path: 'expedientes', element: <Expedientes /> },
      { path: 'expedientes/:id', element: <ExpedienteDetalle /> },
      { path: 'presupuestos', element: <Presupuestos /> },
      { path: 'agenda', element: <Agenda /> },
      { path: 'liquidaciones', element: <Liquidaciones /> },
    ],
  },
]);