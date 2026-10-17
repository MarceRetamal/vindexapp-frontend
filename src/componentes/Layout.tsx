import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';

import logo from '@/assets/vindex-isologo.png';
import { api as novedadesApi, EVENTO_NOVEDADES } from '../api/novedades';
import { ErrorBoundary } from './ErrorBoundary';

const SECCIONES = [
  { ruta: '/', etiqueta: 'Inicio' },
  { ruta: '/novedades', etiqueta: 'Novedades' },
  { ruta: '/clientes', etiqueta: 'Clientes' },
  { ruta: '/expedientes', etiqueta: 'Expedientes' },
  { ruta: '/presupuestos', etiqueta: 'Presupuestos' },
  { ruta: '/agenda', etiqueta: 'Agenda' },
  { ruta: '/liquidaciones', etiqueta: 'Liquidaciones' },
  { ruta: '/reportes', etiqueta: 'Reportes' },
];

export function Layout() {
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();
  const [novedadesPendientes, setNovedadesPendientes] = useState(0);

  // La cantidad de novedades pendientes se refresca al cambiar de pantalla y cuando la bandeja avisa un cambio.
  useEffect(() => {
    let vigente = true;
    const refrescar = () => {
      novedadesApi
        .obtenerResumen()
        .then((r) => {
          if (vigente) setNovedadesPendientes(r.pendientes);
        })
        .catch(() => {
          // Si falla, el menú queda sin indicador: no es motivo para molestar al usuario.
        });
    };
    refrescar();
    window.addEventListener(EVENTO_NOVEDADES, refrescar);
    return () => {
      vigente = false;
      window.removeEventListener(EVENTO_NOVEDADES, refrescar);
    };
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen bg-structural-black">
      <aside className="w-[220px] shrink-0 border-r border-line bg-graphite">
        <div className="px-6 py-8">
          <img src={logo} alt="VINDEX LEGAL" className="w-full max-w-[176px]" />
          <p className="mt-3 font-mono text-[10px] tracking-[0.2em] text-text-gray-light uppercase">
            Gestión interna
          </p>
        </div>

        <nav className="flex flex-col gap-0.5">
          {SECCIONES.map((s) => (
            <NavLink
              key={s.ruta}
              to={s.ruta}
              end={s.ruta === '/'}
              className={({ isActive }) =>
                `relative flex items-center px-6 py-3 text-sm transition-colors ${
                  isActive ? 'text-white font-bold' : 'text-text-gray-light hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-silver via-silver-deep to-silver" />
                  )}
                  {s.etiqueta}
                  {s.ruta === '/novedades' && novedadesPendientes > 0 && (
                    <span
                      className="ml-2 min-w-5 rounded-sharp border border-warning px-1.5 text-center font-mono text-[10px] leading-5 text-warning"
                      aria-label={`${novedadesPendientes} novedades pendientes`}
                    >
                      {novedadesPendientes}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="flex-1 max-w-[1100px] px-10 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.18 }}
          >
            <ErrorBoundary resetKey={location.pathname}>
              <Outlet />
            </ErrorBoundary>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
