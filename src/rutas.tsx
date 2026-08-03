import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from './componentes/Layout';
import { Clientes } from './paginas/Clientes';
import { Pendiente } from './paginas/Pendiente';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Navigate to="/clientes" replace /> },
      { path: 'clientes', element: <Clientes /> },
      { path: 'expedientes', element: <Pendiente titulo="Expedientes" /> },
      { path: 'presupuestos', element: <Pendiente titulo="Presupuestos" /> },
      { path: 'agenda', element: <Pendiente titulo="Agenda" /> },
    ],
  },
]);
