import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { NavLink, Outlet, useLocation } from 'react-router';

import logo from '@/assets/vindex-isologo.png';

const SECCIONES = [
  { ruta: '/clientes', etiqueta: 'Clientes' },
  { ruta: '/expedientes', etiqueta: 'Expedientes' },
  { ruta: '/presupuestos', etiqueta: 'Presupuestos' },
  { ruta: '/agenda', etiqueta: 'Agenda' },
  { ruta: '/liquidaciones', etiqueta: 'Liquidaciones' },
];

export function Layout() {
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();

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
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
