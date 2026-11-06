import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { ArrowRightIcon } from 'lucide-react';

/**
 * Fila de una lista como tarjeta: lo que identifica el ítem a la izquierda, el estado a la derecha y las acciones
 * secundarias aparte. Con `to` toda la zona principal es un enlace. Las acciones se muestran al pasar el mouse o al
 * enfocar con el teclado en pantallas anchas, y siempre en el celular; con `accionesVisibles` no se esconden nunca.
 */
export function FilaLista({
  to,
  inicio,
  children,
  lateral,
  acciones,
  accionesVisibles,
  resaltada,
}: {
  to?: string;
  inicio: ReactNode;
  children: ReactNode;
  lateral?: ReactNode;
  acciones?: ReactNode;
  accionesVisibles?: boolean;
  /** Borde de alerta (algo vencido). */
  resaltada?: boolean;
}) {
  const cuerpo = (
    <>
      {inicio}
      <div className="min-w-0 flex-1">{children}</div>
    </>
  );
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`superficie group relative flex flex-wrap items-center gap-x-4 gap-y-3 p-3.5 transition-colors hover:bg-graphite-raised ${resaltada ? 'border-l-2 border-l-warning' : 'hover:border-silver-deep'}`}
    >
      {to ? (
        <Link to={to} className="flex min-w-0 flex-1 basis-60 items-center gap-4 focus-visible:outline-none">
          {cuerpo}
        </Link>
      ) : (
        <div className="flex min-w-0 flex-1 basis-60 items-center gap-4">{cuerpo}</div>
      )}
      {lateral && (
        <div
          className={`flex flex-wrap items-center gap-2 lg:ml-auto ${
            acciones && !accionesVisibles ? 'lg:transition-opacity lg:group-focus-within:opacity-0 lg:group-hover:opacity-0' : ''
          }`}
        >
          {lateral}
        </div>
      )}
      {acciones && (
        <div
          className={`flex w-full flex-wrap items-center gap-2 lg:w-auto ${
            accionesVisibles
              ? ''
              : // En pantallas anchas aparecen encima del estado, sin ocuparle lugar: así el estado queda alineado en todas las filas.
                'lg:pointer-events-none lg:absolute lg:right-11 lg:top-1/2 lg:-translate-y-1/2 lg:opacity-0 lg:transition-opacity lg:group-focus-within:pointer-events-auto lg:group-focus-within:opacity-100 lg:group-hover:pointer-events-auto lg:group-hover:opacity-100'
          }`}
        >
          {acciones}
        </div>
      )}
      {to && <ArrowRightIcon className="hidden h-4 w-4 shrink-0 text-silver-deep transition-transform group-hover:translate-x-0.5 group-hover:text-silver lg:block" strokeWidth={1.6} aria-hidden="true" />}
    </motion.div>
  );
}

/** Cuadro de 48 px con un ícono o iniciales: lo que identifica una fila que no tiene fecha. */
export function BloqueIcono({ children, redondo }: { children: ReactNode; redondo?: boolean }) {
  return (
    <div className={`flex h-12 w-12 shrink-0 items-center justify-center border border-line bg-structural-black/40 text-silver ${redondo ? 'rounded-full text-sm font-bold tracking-wider' : 'rounded-md'}`} aria-hidden="true">
      {children}
    </div>
  );
}
