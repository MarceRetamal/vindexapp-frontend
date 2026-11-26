import { jsx as _jsx } from "react/jsx-runtime";
import '@fontsource/lato/100.css';
import '@fontsource/lato/300.css';
import '@fontsource/lato/400.css';
import '@fontsource/lato/700.css';
import '@fontsource/lato/900.css';
import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { router } from './rutas';
import { setSesion, whoami } from './api/whoami';
import { setEstudioId } from './api/http';
import { PantallaMarca } from './componentes/Marca';
import './estilos.css';
function Arranque() {
    const [estado, setEstado] = useState('cargando');
    const [error, setError] = useState('');
    useEffect(() => {
        whoami()
            .then(({ usuario, estudio, demo }) => {
            setEstudioId(estudio.id);
            setSesion(usuario, estudio, demo === true);
            if (demo === true && !document.title.startsWith('[Demostración]'))
                document.title = `[Demostración] ${document.title}`;
            setEstado('listo');
        })
            .catch((err) => {
            setError(err instanceof Error ? err.message : 'Error desconocido');
            setEstado('error');
        });
    }, []);
    if (estado === 'cargando') {
        return _jsx(PantallaMarca, { titulo: "Verificando sesi\u00F3n" });
    }
    if (estado === 'error') {
        return _jsx(PantallaMarca, { titulo: "No se pudo iniciar sesi\u00F3n", detalle: error });
    }
    return _jsx(RouterProvider, { router: router });
}
createRoot(document.getElementById('root')).render(_jsx(StrictMode, { children: _jsx(Arranque, {}) }));
