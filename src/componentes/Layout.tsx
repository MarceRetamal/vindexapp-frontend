import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';
import { MenuIcon, XIcon } from 'lucide-react';

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
  const [menuAbierto, setMenuAbierto] = useState(false);

  // En el celular el menú es un panel que se abre y se cierra: al elegir una sección se cierra solo.
  useEffect(() => {
    setMenuAbierto(false);
  }, [location.pathname]);

  // Con el panel abierto: Escape lo cierra y la página de atrás no se desplaza.
  useEffect(() => {
    if (!menuAbierto) return;
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuAbierto(false);
    };
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', alTeclear);
    return () => {
      document.body.style.overflow = overflowAnterior;
      window.removeEventListener('keydown', alTeclear);
    };
  }, [menuAbierto]);

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

  const menu = (
    <>
      <div className="px-6 pt-9 pb-7 max-md:pt-6 max-md:pb-5">
        <div className="flex items-center gap-3.5">
          <Isotipo tamano={44} />
          <Wordmark />
        </div>
        <div className="mt-7 h-px bg-line max-md:mt-5" />
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
              `relative flex items-center px-6 py-3 max-md:py-3.5 text-[13px] uppercase tracking-[0.12em] transition-colors ${
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
    </>
  );

  return (
    <div className="flex min-h-screen bg-structural-black">
      {/* Pantallas anchas: menú lateral fijo. */}
      <aside className="hidden md:flex w-[232px] shrink-0 sticky top-0 h-screen overflow-y-auto border-r border-line bg-structural-black flex-col">
        {menu}
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Celular: barra superior con la marca y el botón del menú. */}
        <header className="md:hidden sticky top-0 z-30 flex items-center justify-between border-b border-line bg-structural-black px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))]">
          <div className="flex items-center gap-3">
            <Isotipo tamano={32} />
            <Wordmark className="scale-90 origin-left" />
          </div>
          <button
            type="button"
            onClick={() => setMenuAbierto(true)}
            aria-label="Abrir el menú"
            aria-expanded={menuAbierto}
            className="flex h-11 w-11 items-center justify-center rounded-sharp border border-line text-silver hover:text-white"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
        </header>

        <main className="flex-1 min-w-0 w-full max-w-[1100px] px-4 py-6 sm:px-6 md:px-12 md:py-10 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
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

      {/* Celular: panel del menú. */}
      {menuAbierto && (
        <div className="md:hidden fixed inset-0 z-40">
          <button
            type="button"
            aria-label="Cerrar el menú"
            onClick={() => setMenuAbierto(false)}
            className="absolute inset-0 bg-black/70"
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Menú"
            className="absolute left-0 top-0 bottom-0 flex w-[280px] max-w-[85vw] flex-col overflow-y-auto border-r border-line bg-structural-black pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
          >
            <button
              type="button"
              onClick={() => setMenuAbierto(false)}
              aria-label="Cerrar el menú"
              className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-sharp border border-line text-silver hover:text-white"
            >
              <XIcon className="h-5 w-5" />
            </button>
            {menu}
          </aside>
        </div>
      )}
    </div>
  );
}
