import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { api, type Dashboard as DashboardData } from '../api/dashboard';
import { api as novedadesApi, type Novedad } from '../api/novedades';
import { EmptyState } from '../componentes/EmptyState';
import { ErrorBanner } from '../componentes/ErrorBanner';
import { ListSkeleton } from '../componentes/ListSkeleton';
import { Filete } from '../componentes/Filete';

function formatearFechaISO(fechaISO: string): string {
  const [anio, mes, dia] = fechaISO.slice(0, 10).split('-');
  return `${dia}/${mes}/${anio}`;
}

function fechaISOVencida(fechaISO: string): boolean {
  const hoy = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(new Date());
  return fechaISO.slice(0, 10) < hoy;
}

export function Dashboard() {
  const [datos, setDatos] = useState<DashboardData | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [novedades, setNovedades] = useState<Novedad[]>([]);

  useEffect(() => {
    setCargando(true);
    setError(null);
    api
      .obtenerDashboard()
      .then(setDatos)
      .catch((e: Error) => setError(e.message))
      .finally(() => setCargando(false));
    // Las últimas novedades son un agregado: si no cargan, el resto del panel se muestra igual.
    novedadesApi
      .listarNovedades({ estado: 'pendientes', limit: 5 })
      .then((r) => setNovedades(r.novedades))
      .catch(() => setNovedades([]));
  }, []);

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-black uppercase tracking-[0.08em] sm:tracking-[0.1em] text-white">Inicio</h1>
      <Filete className="mt-5 mb-9" />

      {error && <ErrorBanner message={`No se pudo cargar el panel: ${error}`} />}

      {cargando ? (
        <div className="flex flex-col gap-8">
          <ListSkeleton rows={4} />
        </div>
      ) : datos ? (
        <div className="flex flex-col gap-10">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
            <StatCard etiqueta="Novedades pendientes" valor={datos.novedadesPendientes} to="/novedades" />
            <StatCard etiqueta="Expedientes activos" valor={datos.expedientesActivos} />
            <StatCard etiqueta="Tareas pendientes" valor={datos.tareasPendientes.total} />
            <StatCard etiqueta="Próximas audiencias" valor={datos.proximasAudiencias.length} />
            <StatCard etiqueta="Vencimientos próximos" valor={datos.vencimientosProximos.length} />
          </div>

          <Seccion titulo="Novedades del portal sin revisar">
            {novedades.length === 0 ? (
              <EmptyState message="No hay novedades pendientes de revisar." />
            ) : (
              <>
                {novedades.map((n) => (
                  <FilaDashboard
                    key={n.id}
                    to="/novedades"
                    titulo={n.tipo ?? 'Notificación del portal'}
                    subtitulo={`${n.numero_causa} · ${n.caratula ?? ''}`}
                    fecha={n.fecha_notificacion}
                  />
                ))}
                <Link to="/novedades" className="inline-block mt-3 text-xs text-text-gray-light hover:text-white">
                  Ver todas las novedades
                </Link>
              </>
            )}
          </Seccion>

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

function StatCard({ etiqueta, valor, to }: { etiqueta: string; valor: number; to?: string }) {
  const contenido = (
    <>
      <div className="text-3xl font-light tabular-nums text-white">{valor}</div>
      <div className="text-[10px] font-normal uppercase tracking-[0.12em] sm:tracking-[0.16em] text-silver-deep mt-2 break-words">{etiqueta}</div>
    </>
  );
  const clases = 'min-w-0 border border-line rounded-sharp bg-graphite p-4 sm:p-5';
  return to ? (
    <Link to={to} className={`${clases} block hover:border-silver transition-colors`}>
      {contenido}
    </Link>
  ) : (
    <div className={clases}>{contenido}</div>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-4 text-xs font-bold uppercase tracking-[0.2em] text-silver">
        {titulo}
        <span className="h-px flex-1 bg-line" aria-hidden="true" />
      </h2>
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
  const vencida = urgente && fecha != null && fechaISOVencida(fecha);

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
            {formatearFechaISO(fecha)}
          </span>
        )}
      </Link>
    </motion.div>
  );
}
