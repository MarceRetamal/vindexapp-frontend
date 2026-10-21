import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';

import { api as novedadesApi, EVENTO_NOVEDADES } from '../api/novedades';
import { ErrorBoundary } from './ErrorBoundary';
import { Isotipo, Wordmark } from './Marca';

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
      <aside className="w-[232px] shrink-0 border-r border-line bg-structural-black flex flex-col">
        <div className="px-6 pt-9 pb-7">
          <div className="flex items-center gap-3.5">
            <Isotipo tamano={44} />
            <Wordmark />
          </div>
          <div className="mt-7 h-px bg-line" />
          <p className="mt-3 text-[10px] font-normal tracking-[0.28em] text-silver-deep uppercase">
            Gestión interna
          </p>
        </div>

        <nav className="flex flex-col gap-0.5 flex-1">
          {SECCIONES.map((s) => (
            <NavLink
              key={s.ruta}
              to={s.ruta}
              end={s.ruta === '/'}
              className={({ isActive }) =>
                `relative flex items-center px-6 py-3 text-[13px] uppercase tracking-[0.12em] transition-colors ${
                  isActive
                    ? 'text-white font-bold bg-white/[0.03]'
                    : 'text-silver-deep font-normal hover:text-white hover:bg-white/[0.02]'
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

        <div className="px-6 py-6 border-t border-line">
          <p className="text-[10px] font-normal tracking-[0.22em] text-silver-deep uppercase">
            Estudio jurídico
          </p>
          <p className="mt-1 text-[10px] font-normal tracking-[0.22em] text-text-gray-light uppercase">La Plata</p>
        </div>
      </aside>

      <main className="flex-1 min-w-0 max-w-[1100px] px-12 py-10">
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
