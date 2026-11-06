import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { ArrowRightIcon } from 'lucide-react';
import type { Actuacion } from '../api/actuaciones';
import { api as audienciasApi, type Audiencia } from '../api/audiencias';
import { api as novedadesApi } from '../api/novedades';
import { api as portalApi } from '../api/portal';
import type { Tarea } from '../api/tareas';
import { diasEntre, etiquetaDias, fechaConDia, hoyEnArgentina } from '../lib/fechas';
import { BloqueFecha } from './BloqueFecha';

interface Proximo {
  clase: 'plazo' | 'audiencia' | 'tarea';
  titulo: string;
  fecha: string;
  hora: string | null;
}

const NOMBRE_CLASE = { plazo: 'Plazo', audiencia: 'Audiencia', tarea: 'Tarea' } as const;

/**
 * Lo primero que hay que saber de una causa, antes de leer nada: qué es lo próximo que vence, cuál fue el último
 * movimiento y si hay algo sin revisar del portal. Todo sale de lo ya cargado; no calcula plazos.
 */
export function SituacionExpediente({ expedienteId, actuaciones, tareas }: { expedienteId: string; actuaciones: Actuacion[]; tareas: Tarea[] }) {
  const [audiencias, setAudiencias] = useState<Audiencia[]>([]);
  const [portal, setPortal] = useState<{ causas: number; pendientes: number } | null>(null);
  const hoy = hoyEnArgentina();

  useEffect(() => {
    audienciasApi.listarDeExpediente(expedienteId).then(setAudiencias).catch(() => setAudiencias([]));
    Promise.all([portalApi.causasDeExpediente(expedienteId), novedadesApi.listarNovedades({ expediente_id: expedienteId, estado: 'pendientes', limit: 1 })])
      .then(([causas, novedades]) => setPortal({ causas: causas.length, pendientes: novedades.total }))
      .catch(() => setPortal(null));
  }, [expedienteId]);

  const proximos = useMemo<Proximo[]>(
    () =>
      [
        ...actuaciones.filter((a) => a.vencimiento && a.vencimiento.slice(0, 10) >= hoy).map((a): Proximo => ({ clase: 'plazo', titulo: a.tipo, fecha: (a.vencimiento as string).slice(0, 10), hora: null })),
        ...audiencias.filter((a) => a.estado === 'Programada' && a.fecha.slice(0, 10) >= hoy).map((a): Proximo => ({ clase: 'audiencia', titulo: a.tipo, fecha: a.fecha.slice(0, 10), hora: a.hora ? a.hora.slice(0, 5) : null })),
        ...tareas.filter((t) => t.estado !== 'Completada' && t.fecha_limite).map((t): Proximo => ({ clase: 'tarea', titulo: t.titulo, fecha: (t.fecha_limite as string).slice(0, 10), hora: null })),
      ].sort((a, b) => a.fecha.localeCompare(b.fecha) || (a.hora ?? '99').localeCompare(b.hora ?? '99')),
    [actuaciones, audiencias, tareas, hoy]
  );
  const proximo = proximos[0];
  const ultimo = useMemo(() => [...actuaciones].sort((a, b) => b.fecha.localeCompare(a.fecha) || b.creado_en - a.creado_en)[0], [actuaciones]);

  return (
    <section aria-label="Situación del expediente" className="mb-8 grid gap-3 md:grid-cols-3">
      <div className="superficie p-5">
        <p className="eyebrow">Lo próximo</p>
        {proximo ? (
          <div className="mt-3 flex items-center gap-4">
            <BloqueFecha fecha={proximo.fecha} dias={diasEntre(hoy, proximo.fecha)} hora={proximo.hora} />
            <div className="min-w-0">
              <div className="line-clamp-2 text-[15px] font-bold leading-snug text-white">{proximo.titulo}</div>
              <div className={`mt-1 text-xs ${diasEntre(hoy, proximo.fecha) <= 0 ? 'font-bold text-white' : 'text-silver-deep'}`}>
                {NOMBRE_CLASE[proximo.clase]} · {etiquetaDias(diasEntre(hoy, proximo.fecha))}
                {proximos.length > 1 ? ` · y ${proximos.length - 1} más` : ''}
              </div>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-text-gray-light">Sin vencimientos, audiencias ni tareas con fecha.</p>
        )}
      </div>

      <div className="superficie p-5">
        <p className="eyebrow">Último movimiento</p>
        {ultimo ? (
          <div className="mt-3">
            <div className="line-clamp-2 text-[15px] font-bold leading-snug text-white">{ultimo.tipo}</div>
            <div className="mt-1 text-xs text-silver-deep first-letter:uppercase">
              {fechaConDia(ultimo.fecha.slice(0, 10))}
              {diasEntre(ultimo.fecha.slice(0, 10), hoy) >= 0 && ` · hace ${diasEntre(ultimo.fecha.slice(0, 10), hoy)} ${diasEntre(ultimo.fecha.slice(0, 10), hoy) === 1 ? 'día' : 'días'}`}
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-text-gray-light">Todavía no hay actuaciones cargadas.</p>
        )}
      </div>

      <div className="superficie p-5">
        <p className="eyebrow">Portal de notificaciones</p>
        {portal === null ? (
          <p className="mt-3 text-sm text-text-gray-light">Sin datos del portal.</p>
        ) : portal.causas === 0 ? (
          <div className="mt-3">
            <div className="text-[15px] font-bold text-white">Sin causa vinculada</div>
            <a href="#portal" className="mt-1 inline-flex items-center gap-1.5 text-xs text-silver hover:text-white">
              Vincular la causa del portal <ArrowRightIcon className="h-3.5 w-3.5" strokeWidth={1.6} />
            </a>
          </div>
        ) : (
          <div className="mt-3">
            <div className={`text-[15px] font-bold ${portal.pendientes > 0 ? 'text-warning' : 'text-white'}`}>
              {portal.pendientes > 0 ? `${portal.pendientes} ${portal.pendientes === 1 ? 'novedad sin revisar' : 'novedades sin revisar'}` : 'Al día'}
            </div>
            <div className="mt-1 text-xs text-silver-deep">
              {portal.causas} {portal.causas === 1 ? 'causa vinculada' : 'causas vinculadas'}
              {portal.pendientes > 0 && (
                <>
                  {' · '}
                  <a href="#portal" className="text-silver underline-offset-4 hover:text-white hover:underline">Ver abajo</a>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/** Enlace a la ficha del cliente de un expediente. */
export function EnlaceCliente({ clienteId, nombre }: { clienteId: string; nombre: string }) {
  return (
    <Link to={`/clientes/${clienteId}`} className="text-white underline-offset-4 hover:underline">
      {nombre}
    </Link>
  );
}
