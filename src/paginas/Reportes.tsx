import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { api, type ReporteExpedientes, type ReportePresupuestos } from '../api/reportes';
import { EmptyState } from '../componentes/EmptyState';
import { ErrorBanner } from '../componentes/ErrorBanner';
import { ListSkeleton } from '../componentes/ListSkeleton';

const formateadorPesos = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
});

function formatearFechaISO(fechaISO: string): string {
  const [anio, mes, dia] = fechaISO.slice(0, 10).split('-');
  return `${dia}/${mes}/${anio}`;
}

function hace90Dias(): string {
  const d = new Date();
  d.setDate(d.getDate() - 90);
  return d.toISOString().slice(0, 10);
}

function hoyISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function Reportes() {
  return (
    <div>
      <h1 className="text-2xl font-black uppercase tracking-wide text-white mb-8">Reportes</h1>

      <div className="flex flex-col gap-12">
        <SeccionExpedientes />
        <SeccionPresupuestos />
      </div>
    </div>
  );
}

function SeccionExpedientes() {
  const [datos, setDatos] = useState<ReporteExpedientes | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCargando(true);
    setError(null);
    api
      .listarReporteExpedientes()
      .then(setDatos)
      .catch((e: Error) => setError(e.message))
      .finally(() => setCargando(false));
  }, []);

  return (
    <section>
      <h2 className="text-lg font-bold text-white mb-4">Expedientes</h2>

      {error && <ErrorBanner message={`No se pudo cargar el reporte: ${error}`} />}

      {cargando ? (
        <ListSkeleton rows={3} />
      ) : datos ? (
        <div className="flex flex-col gap-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Desglose titulo="Por estado" items={(datos.porEstado ?? []).map((i) => ({ etiqueta: i.estado, valor: i.cantidad }))} />
            <Desglose titulo="Por fuero" items={(datos.porFuero ?? []).map((i) => ({ etiqueta: i.fuero, valor: i.cantidad }))} />
            <Desglose titulo="Por departamento" items={(datos.porDepartamento ?? []).map((i) => ({ etiqueta: i.departamento, valor: i.cantidad }))} />
          </div>

          <div>
            <h3 className="text-sm font-bold text-white mb-3">Bajas recientes (últimos 90 días)</h3>
            {(datos.bajasUltimos90Dias ?? []).length === 0 ? (
              <EmptyState message="No hubo bajas de expedientes en los últimos 90 días." />
            ) : (
              <motion.div
                initial="hidden"
                animate="show"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
              >
                {datos.bajasUltimos90Dias.map((b) => (
                  <motion.div key={b.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                    <Link
                      to={`/expedientes/${b.id}`}
                      className="flex items-center justify-between gap-4 py-3 border-b border-line no-underline hover:bg-graphite transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="font-medium text-white truncate">{b.caratula}</div>
                        {b.motivo_baja && (
                          <div className="text-xs text-text-gray-light truncate">{b.motivo_baja}</div>
                        )}
                      </div>
                      <span className="text-xs font-mono text-text-gray-light shrink-0">
                        {formatearFechaISO(b.baja)}
                      </span>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function SeccionPresupuestos() {
  const [desde, setDesde] = useState(hace90Dias());
  const [hasta, setHasta] = useState(hoyISO());
  const [datos, setDatos] = useState<ReportePresupuestos | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCargando(true);
    setError(null);
    api
      .listarReportePresupuestos(desde, hasta)
      .then(setDatos)
      .catch((e: Error) => setError(e.message))
      .finally(() => setCargando(false));
  }, [desde, hasta]);

  return (
    <section>
      <div className="flex items-baseline justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-lg font-bold text-white">Presupuestos</h2>
        <div className="flex items-center gap-2 text-xs text-text-gray-light">
          <label className="flex items-center gap-1.5">
            Desde
            <input
              type="date"
              value={desde}
              max={hasta}
              onChange={(e) => setDesde(e.target.value)}
              className="rounded-sharp bg-graphite border border-line focus-visible:ring-silver h-8 px-2 text-sm text-white outline-none"
            />
          </label>
          <label className="flex items-center gap-1.5">
            Hasta
            <input
              type="date"
              value={hasta}
              min={desde}
              onChange={(e) => setHasta(e.target.value)}
              className="rounded-sharp bg-graphite border border-line focus-visible:ring-silver h-8 px-2 text-sm text-white outline-none"
            />
          </label>
        </div>
      </div>

      {error && <ErrorBanner message={`No se pudo cargar el reporte: ${error}`} />}

      {cargando ? (
        <ListSkeleton rows={3} />
      ) : datos ? (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="border border-line rounded-sharp bg-graphite p-4">
              <div className="text-2xl font-black text-white">
                {formateadorPesos.format((datos.totalFirmadoCentavos ?? 0) / 100)}
              </div>
              <div className="text-xs text-text-gray-light mt-1">Total firmado</div>
            </div>
            <div className="border border-line rounded-sharp bg-graphite p-4">
              <div className="text-2xl font-black text-white">
                {formateadorPesos.format((datos.totalPendienteCentavos ?? 0) / 100)}
              </div>
              <div className="text-xs text-text-gray-light mt-1">Total pendiente</div>
            </div>
            <div className="border border-line rounded-sharp bg-graphite p-4">
              <div className="text-2xl font-black text-white">
                {datos.tasaConversion == null ? 'Sin datos' : `${Math.round(datos.tasaConversion * 100)}%`}
              </div>
              <div className="text-xs text-text-gray-light mt-1">Tasa de conversión</div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white mb-3">Por estado</h3>
            {(datos.porEstado ?? []).length === 0 ? (
              <EmptyState message="No hay presupuestos en este rango de fechas." />
            ) : (
              <DesglosePresupuestos items={datos.porEstado} />
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Desglose({ titulo, items }: { titulo: string; items: { etiqueta: string; valor: number }[] }) {
  const max = Math.max(1, ...items.map((i) => i.valor));

  return (
    <div className="border border-line rounded-sharp bg-graphite p-4">
      <div className="text-xs text-text-gray-light mb-3">{titulo}</div>
      {items.length === 0 ? (
        <p className="text-sm text-text-gray-light italic m-0">Sin datos</p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((i) => (
            <div key={i.etiqueta}>
              <div className="flex items-baseline justify-between text-xs mb-1">
                <span className="text-white truncate">{i.etiqueta}</span>
                <span className="font-mono text-text-gray-light">{i.valor}</span>
              </div>
              <div className="h-1.5 rounded-sharp bg-line overflow-hidden">
                <div
                  className="h-full bg-silver"
                  style={{ width: `${Math.max(4, (i.valor / max) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DesglosePresupuestos({
  items,
}: {
  items: { estado: string; cantidad: number; montoTotal: number }[];
}) {
  const max = Math.max(1, ...items.map((i) => i.montoTotal));

  return (
    <div className="border border-line rounded-sharp bg-graphite p-4 flex flex-col gap-3">
      {items.map((i) => (
        <div key={i.estado}>
          <div className="flex items-baseline justify-between text-xs mb-1">
            <span className="text-white">
              {i.estado} <span className="text-text-gray-light font-mono">· {i.cantidad}</span>
            </span>
            <span className="font-mono text-text-gray-light">
              {formateadorPesos.format(i.montoTotal / 100)}
            </span>
          </div>
          <div className="h-1.5 rounded-sharp bg-line overflow-hidden">
            <div
              className="h-full bg-silver"
              style={{ width: `${Math.max(4, (i.montoTotal / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
