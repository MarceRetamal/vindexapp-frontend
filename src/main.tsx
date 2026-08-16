import '@fontsource/lato/100.css'
import '@fontsource/lato/300.css'
import '@fontsource/lato/400.css'
import '@fontsource/lato/700.css'
import '@fontsource/lato/900.css'
import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { router } from './rutas';
import { whoami } from './api/whoami';
import { setEstudioId } from './api/http';
import './estilos.css';

function Arranque() {
  const [estado, setEstado] = useState<'cargando' | 'listo' | 'error'>('cargando');
  const [error, setError] = useState('');

  useEffect(() => {
    whoami()
      .then(({ estudio }) => {
        setEstudioId(estudio.id);
        setEstado('listo');
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Error desconocido');
        setEstado('error');
      });
  }, []);

  if (estado === 'cargando') {
    return <div style={{ padding: 40 }}>Verificando sesión...</div>;
  }

  if (estado === 'error') {
    return (
      <div style={{ padding: 40 }}>
        <h2>No se pudo iniciar sesión</h2>
        <p>{error}</p>
      </div>
    );
  }

  return <RouterProvider router={router} />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Arranque />
  </StrictMode>
);