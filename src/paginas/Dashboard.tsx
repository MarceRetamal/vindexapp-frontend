import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { api, type Dashboard as DashboardData } from '../api/dashboard';
import { EmptyState } from '../componentes/EmptyState';
import { ErrorBanner } from '../componentes/ErrorBanner';
import { ListSkeleton } from '../componentes/ListSkeleton';

const formateadorFecha = new Intl.DateTimeFormat('es-AR', {
  timeZone: 'America/Argentina/Buenos_Aires',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

export function Dashboard() {
  const [datos, setDatos] = useState<DashboardData | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCargando(true);
    setError(null);
    api
      .obtenerDashboard()
      .then(setDatos)
      .catch((e: Error) => setError(e.message))
      .finally(() => setCargando(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-black uppercase tracking-wide text-white mb-8">Inicio</h1>

      {error && <ErrorBanner message={`No se pudo cargar el panel: ${error}`} />}

      {cargando ? (
        <div className="flex flex-col gap-8">
          <ListSkeleton rows={4} />
        </div>
      ) : datos ? (
        <div className="flex flex-col gap-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard etiqueta="Expedientes activos" valor={datos.expedientesActivos} />
            <StatCard etiqueta="Tareas pendientes" valor={datos.tareasPendientes.total} />
            <StatCard etiqueta="Próximas audiencias" valor={datos.proximasAudiencias.length} />
            <StatCard etiqueta="Vencimientos próximos" valor={datos.vencimientosProximos.length} />
          </div>

          <Seccion titulo="Próximas audiencias">
            {datos.proximasAudiencias.length === 0 ? (
              <EmptyState message="No hay audiencias programadas en los próximos días." />
            ) : (
              <motion.div
                initial="hidden"
                animate="show"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
              >
                {datos.proximasAudiencias.map((a) => (
                  <FilaDashboard
                    key={a.id}
                    to={`/expedientes/${a.expediente_id}`}
                    titulo={a.tipo}
                    subtitulo={a.expediente_caratula}
                    fecha={a.fecha}
                  />
                ))}
              </motion.div>
            )}
          </Seccion>

          <Seccion titulo="Vencimientos próximos">
            {datos.vencimientosProximos.length === 0 ? (
              <EmptyState message="No hay vencimientos cargados para los próximos días." />
            ) : (
              <motion.div
                initial="hidden"
                animate="show"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
              >
                {datos.vencimientosProximos.map((v) => (
                  <FilaDashboard
                    key={v.id}
                    to={`/expedientes/${v.expediente_id}`}
                    titulo={v.tipo}
                    subtitulo={v.expediente_caratula}
                    fecha={v.vencimiento ?? v.fecha}
                    urgente
                  />
                ))}
              </motion.div>
            )}
          </Seccion>

          <Seccion titulo="Tareas pendientes">
            {datos.tareasPendientes.proximas.length === 0 ? (
              <EmptyState message="No hay tareas pendientes con fecha límite próxima." />
            ) : (
              <motion.div
                initial="hidden"
                animate="show"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
              >
                {datos.tareasPendientes.proximas.map((t) => (
                  <FilaDashboard
                    key={t.id}
                    to={`/expedientes/${t.expediente_id}`}
                    titulo={t.titulo}
                    subtitulo={t.expediente_caratula}
                    fecha={t.fecha_limite}
                  />
                ))}
              </motion.div>
            )}
          </Seccion>
        </div>
      ) : null}
    </div>
  );
}

function StatCard({ etiqueta, valor }: { etiqueta: string; valor: number }) {
  return (
    <div className="border border-line rounded-sharp bg-graphite p-4">
      <div className="text-2xl font-black text-white">{valor}</div>
      <div className="text-xs text-text-gray-light mt-1">{etiqueta}</div>
    </div>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-bold text-white mb-3">{titulo}</h2>
      {children}
    </section>
  );
}

function FilaDashboard({
  to,
  titulo,
  subtitulo,
  fecha,
  urgente,
}: {
  to: string;
  titulo: string;
  subtitulo: string;
  fecha: string | null;
  urgente?: boolean;
}) {
  const vencida = urgente && fecha != null && new Date(fecha).getTime() < Date.now();

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <Link
        to={to}
        className={`flex items-center justify-between gap-4 py-3 border-b border-line no-underline hover:bg-graphite transition-colors ${
          vencida ? 'bg-warning/10' : ''
        }`}
      >
        <div className="min-w-0">
          <div className="font-medium text-white truncate">{titulo}</div>
          <div className="text-xs text-text-gray-light truncate">{subtitulo}</div>
        </div>
        {fecha && (
          <span className={`text-xs font-mono shrink-0 ${vencida ? 'text-warning' : 'text-text-gray-light'}`}>
            {formateadorFecha.format(new Date(fecha))}
          </span>
        )}
      </Link>
    </motion.div>
  );
}
