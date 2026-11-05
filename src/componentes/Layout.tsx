import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';
import { MenuIcon, SearchIcon, XIcon } from 'lucide-react';

import { api as novedadesApi, EVENTO_NOVEDADES } from '../api/novedades';
import { sesionActual } from '../api/whoami';
import { iniciales } from '../lib/fechas';
import { EVENTO_PALETA, GRUPOS, SECCIONES } from '../navegacion';
import { ErrorBoundary } from './ErrorBoundary';
import { Isotipo, Wordmark } from './Marca';
import { PaletaComandos } from './PaletaComandos';

const abrirPaleta = () => window.dispatchEvent(new Event(EVENTO_PALETA));
const ATAJO = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘ K' : 'Ctrl K';

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

  const { usuario, estudio } = sesionActual();

  const menu = (
    <>
      <div className="px-6 pt-8 pb-6 max-md:pt-6 max-md:pb-4">
        <div className="flex items-center gap-3.5">
          <Isotipo tamano={44} />
          <Wordmark />
        </div>
      </div>

      <div className="px-3 pb-5">
        <button
          type="button"
          onClick={abrirPaleta}
          className="superficie flex w-full items-center gap-3 px-3 py-2.5 text-sm text-text-gray-light transition-colors hover:border-silver-deep hover:text-silver"
        >
          <SearchIcon className="h-[18px] w-[18px]" strokeWidth={1.6} />
          Buscar
          <kbd className="ml-auto rounded-sm border border-line px-1.5 py-0.5 font-sans text-[10px] text-silver-deep max-md:hidden">{ATAJO}</kbd>
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-5 pb-4" aria-label="Secciones">
        {GRUPOS.map((grupo) => (
          <div key={grupo} className="flex flex-col gap-0.5">
            <div className="eyebrow px-6 pb-1.5 text-[10px] text-text-gray-light">{grupo}</div>
            {SECCIONES.filter((s) => s.grupo === grupo).map((s) => {
              const Icono = s.icono;
              return (
                <NavLink
                  key={s.ruta}
                  to={s.ruta}
                  end={s.ruta === '/'}
                  className={({ isActive }) =>
                    `group relative mx-3 flex items-center gap-3 rounded-md px-3 py-2.5 text-[14px] transition-colors max-md:py-3 ${
                      isActive ? 'bg-graphite-raised font-bold text-white' : 'font-normal text-silver hover:bg-white/[0.03] hover:text-white'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && <span className="absolute -left-3 bottom-2 top-2 w-[3px] rounded-r bg-gradient-to-b from-silver via-silver-deep to-silver" />}
                      <Icono className={`h-[18px] w-[18px] shrink-0 transition-colors ${isActive ? 'text-silver' : 'text-silver-deep group-hover:text-silver'}`} strokeWidth={1.6} />
                      {s.etiqueta}
                      {s.ruta === '/novedades' && novedadesPendientes > 0 && (
                        <span
                          className="ml-auto min-w-5 rounded-full border border-warning/70 bg-warning/10 px-1.5 text-center font-mono text-[11px] leading-5 text-warning"
                          aria-label={`${novedadesPendientes} novedades pendientes`}
                        >
                          {novedadesPendientes}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {usuario && (
        <div className="flex items-center gap-3 border-t border-line px-6 py-5">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-silver-deep/60 bg-graphite text-xs font-bold tracking-wider text-silver"
            aria-hidden="true"
          >
            {iniciales(usuario.nombre, usuario.apellido)}
          </div>
          <div className="min-w-0">
            <div className="truncate text-[13px] font-bold text-white">
              {usuario.nombre} {usuario.apellido}
            </div>
            <div className="truncate text-[11px] text-text-gray-light">{estudio?.nombre ?? 'Estudio jurídico'}</div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="flex min-h-screen bg-structural-black">
      {/* Pantallas anchas: menú lateral fijo. */}
      <aside className="hidden md:flex w-[248px] shrink-0 sticky top-0 h-screen overflow-y-auto border-r border-line bg-structural-black flex-col">
        {menu}
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Celular: barra superior con la marca y el botón del menú. */}
        <header className="md:hidden sticky top-0 z-30 flex items-center justify-between border-b border-line bg-structural-black px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))]">
          <div className="flex items-center gap-3">
            <Isotipo tamano={32} />
            <Wordmark className="scale-90 origin-left" />
          </div>
          <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={abrirPaleta}
            aria-label="Buscar"
            className="flex h-11 w-11 items-center justify-center rounded-sharp border border-line text-silver hover:text-white"
          >
            <SearchIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setMenuAbierto(true)}
            aria-label="Abrir el menú"
            aria-expanded={menuAbierto}
            className="flex h-11 w-11 items-center justify-center rounded-sharp border border-line text-silver hover:text-white"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
          </div>
        </header>

        <main className="flex-1 min-w-0 w-full max-w-[1180px] px-4 py-6 sm:px-6 md:px-12 md:py-10 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
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

      <PaletaComandos />

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
