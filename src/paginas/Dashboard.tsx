import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { ArrowRightIcon, CalendarDaysIcon, CheckIcon, HourglassIcon, SquareCheckBigIcon, type LucideIcon } from 'lucide-react';
import { api as apiDashboard, apiAgenda, type AgendaDia, type ClaseItemDia, type ItemDia } from '../api/dashboard';
import { api as novedadesApi, type Novedad, type PropuestaPlazo } from '../api/novedades';
import { enlaceDeRevision } from '../componentes/PropuestaPlazo';
import { api as portalApi, type EstadoPortal } from '../api/portal';
import { sesionActual } from '../api/whoami';
import { diasEntre, etiquetaDias, fechaLarga, fechaConDia, haceCuanto, hoyEnArgentina, horaEnArgentina, resumenDelDia, saludoDe } from '../lib/fechas';
import { usePlazosSugeridos } from '../lib/usePlazosSugeridos';
import { BloqueFecha } from '../componentes/BloqueFecha';
import { EnlacePlazo } from '../componentes/EnlacePlazo';
import { ErrorBanner } from '../componentes/ErrorBanner';
import { ListSkeleton } from '../componentes/ListSkeleton';
import { PrimerosPasos } from '../componentes/PrimerosPasos';

const ICONO_CLASE: Record<ClaseItemDia, { icono: LucideIcon; etiqueta: string }> = {
  plazo: { icono: HourglassIcon, etiqueta: 'Plazo' },
  audiencia: { icono: CalendarDaysIcon, etiqueta: 'Audiencia' },
  tarea: { icono: SquareCheckBigIcon, etiqueta: 'Tarea' },
};

const GRUPOS_AGENDA: { id: string; titulo: string; incluye: (dias: number) => boolean }[] = [
  { id: 'vencido', titulo: 'Vencido', incluye: (d) => d < 0 },
  { id: 'hoy', titulo: 'Hoy', incluye: (d) => d === 0 },
  { id: 'manana', titulo: 'Mañana', incluye: (d) => d === 1 },
  { id: 'semana', titulo: 'Esta semana', incluye: (d) => d >= 2 && d <= 7 },
  { id: 'luego', titulo: 'Más adelante', incluye: (d) => d > 7 },
];

export function Dashboard() {
  const [agenda, setAgenda] = useState<AgendaDia | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [novedades, setNovedades] = useState<{ lista: Novedad[]; total: number } | null>(null);
  const [portal, setPortal] = useState<EstadoPortal | null>(null);
  const [expedientesActivos, setExpedientesActivos] = useState<number | null>(null);
  const { usuario } = sesionActual();

  useEffect(() => {
    apiAgenda
      .obtenerAgenda(14)
      .then(setAgenda)
      .catch((e: Error) => setError(e.message));
    // Lo del portal es un agregado: si no carga, el resto de la pantalla se muestra igual.
    novedadesApi
      .listarNovedades({ estado: 'pendientes', limit: 4 })
      .then((r) => setNovedades({ lista: r.novedades, total: r.total }))
      .catch(() => setNovedades({ lista: [], total: 0 }));
    portalApi
      .obtenerEstado()
      .then(setPortal)
      .catch(() => setPortal(null));
    // Con cero expedientes el estudio es nuevo: en vez de "agenda despejada" se muestran los primeros pasos.
    apiDashboard
      .obtenerDashboard()
      .then((d) => setExpedientesActivos(d.expedientesActivos))
      .catch(() => setExpedientesActivos(null));
  }, []);

  const resumen = useMemo(() => {
    if (!agenda) return null;
    const deHoy = agenda.items.filter((i) => i.dias === 0);
    const audiencias = deHoy.filter((i) => i.clase === 'audiencia');
    return resumenDelDia({
      vencidas: agenda.resumen.vencidas,
      plazosHoy: deHoy.filter((i) => i.clase === 'plazo').length,
      audienciasHoy: audiencias.length,
      horaAudiencia: audiencias[0]?.hora ?? null,
      tareasHoy: deHoy.filter((i) => i.clase === 'tarea').length,
      novedades: novedades?.total ?? 0,
    });
  }, [agenda, novedades]);

  return (
    <div>
      <Encabezado
        fecha={agenda?.hoy}
        nombre={usuario?.nombre}
        frase={resumen}
        cifras={agenda ? [
          { etiqueta: 'Vencido', valor: agenda.resumen.vencidas, tono: agenda.resumen.vencidas > 0 ? 'urgente' : 'calmo' },
          { etiqueta: 'Hoy', valor: agenda.resumen.hoy, tono: agenda.resumen.hoy > 0 ? 'hoy' : 'calmo' },
          { etiqueta: 'Próximos 7 días', valor: agenda.resumen.proximas, tono: 'calmo' },
        ] : null}
      />

      {error && <ErrorBanner message={`No se pudo cargar tu agenda: ${error}`} />}

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section aria-label="Agenda" className="min-w-0">
          {!agenda && !error ? (
            <ListSkeleton rows={5} />
          ) : agenda && agenda.items.length === 0 && expedientesActivos === 0 ? (
            <PrimerosPasos />
          ) : (
            agenda && <ListaAgenda items={agenda.items} />
          )}
        </section>

        <aside className="flex min-w-0 flex-col gap-5">
          <PulsoPortal estado={portal} />
          <TarjetaNovedades datos={novedades} />
        </aside>
      </div>
    </div>
  );
}

function Encabezado({
  fecha,
  nombre,
  frase,
  cifras,
}: {
  fecha?: string;
  nombre?: string;
  frase: string | null;
  cifras: { etiqueta: string; valor: number; tono: 'urgente' | 'hoy' | 'calmo' }[] | null;
}) {
  const saludo = saludoDe(horaEnArgentina());
  return (
    <header className="superficie aparecer flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <p className="eyebrow">{fecha ? fechaLarga(fecha) : ' '}</p>
        <h1 className="mt-2 text-[28px] font-black leading-tight text-white sm:text-[34px]">
          {saludo}
          {nombre ? `, ${nombre}` : ''}
        </h1>
        <p className="mt-3 max-w-xl text-[17px] font-light leading-relaxed text-silver sm:text-lg">{frase ?? ' '}</p>
      </div>

      {cifras && (
        <dl className="flex shrink-0 divide-x divide-line self-start lg:self-end">
          {cifras.map((c) => (
            <div key={c.etiqueta} className="px-5 first:pl-0 last:pr-0 sm:px-6">
              <dd
                className={`text-[40px] font-light leading-none tabular-nums sm:text-5xl ${
                  c.tono === 'urgente' ? 'text-warning' : c.tono === 'hoy' ? 'text-white' : 'text-silver-deep'
                }`}
              >
                {c.valor}
              </dd>
              <dt className="eyebrow mt-2.5 text-[10px]">{c.etiqueta}</dt>
            </div>
          ))}
        </dl>
      )}
    </header>
  );
}

function ListaAgenda({ items }: { items: ItemDia[] }) {
  if (items.length === 0) {
    return (
      <div className="superficie flex flex-col items-center px-6 py-14 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-silver-deep/50 text-silver">
          <CheckIcon className="h-6 w-6" strokeWidth={1.6} />
        </div>
        <h2 className="mt-5 text-lg font-bold text-white">Agenda despejada</h2>
        <p className="mt-2 max-w-sm text-sm text-text-gray-light">No hay tareas, audiencias ni plazos para los próximos 14 días. Cuando cargues algo con fecha, aparece acá ordenado por urgencia.</p>
        <Link to="/tareas" className="mt-6 inline-flex items-center gap-2 text-sm text-silver hover:text-white">
          Cargar una tarea <ArrowRightIcon className="h-4 w-4" strokeWidth={1.6} />
        </Link>
      </div>
    );
  }

  let orden = 0;
  return (
    <div className="flex flex-col gap-9">
      {GRUPOS_AGENDA.map((g) => {
        const delGrupo = items.filter((i) => g.incluye(i.dias));
        if (delGrupo.length === 0) return null;
        return (
          <section key={g.id} aria-label={g.titulo}>
            <h2 className={`eyebrow mb-3 flex items-center gap-3 ${g.id === 'vencido' ? 'text-warning' : g.id === 'hoy' ? 'text-white' : ''}`}>
              {g.titulo}
              <span className="font-light tabular-nums tracking-normal text-text-gray-light">{delGrupo.length}</span>
              <span className="h-px flex-1 bg-line" aria-hidden="true" />
            </h2>
            <ul className="flex flex-col gap-2">
              {delGrupo.map((item) => (
                <FilaAgenda key={item.clave} item={item} demora={Math.min(orden++, 10) * 0.03} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function FilaAgenda({ item, demora }: { item: ItemDia; demora: number }) {
  const { icono: Icono, etiqueta } = ICONO_CLASE[item.clase];
  const destino = item.expediente_id ? `/expedientes/${item.expediente_id}` : '/tareas';
  const contexto = [item.caratula ?? (item.clase === 'tarea' ? 'Sin expediente' : null), item.cliente].filter(Boolean).join(' · ');
  const cuando = [etiquetaDias(item.dias), item.hora ? `${item.hora} hs` : null, item.detalle].filter(Boolean).join(' · ');
  return (
    <motion.li initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: demora }}>
      <Link
        to={destino}
        className="superficie group flex items-center gap-4 p-3.5 transition-colors hover:border-silver-deep hover:bg-graphite-raised focus-visible:border-silver"
      >
        <BloqueFecha fecha={item.fecha} dias={item.dias} hora={item.hora} />
        <div className="min-w-0 flex-1">
          <div className="line-clamp-2 text-[15px] font-bold leading-snug text-white">{item.titulo}</div>
          {contexto && <div className="mt-0.5 truncate text-xs text-text-gray-light">{contexto}</div>}
          <div className={`mt-1 truncate text-xs ${item.dias < 0 ? 'font-bold text-warning' : item.dias === 0 ? 'font-bold text-white' : 'text-silver-deep'}`}>{cuando}</div>
        </div>
        <span className="hidden shrink-0 items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-silver-deep sm:inline-flex">
          <Icono className="h-4 w-4" strokeWidth={1.6} />
          {etiqueta}
        </span>
        <ArrowRightIcon className="h-4 w-4 shrink-0 text-silver-deep transition-transform group-hover:translate-x-0.5 group-hover:text-silver" strokeWidth={1.6} aria-hidden="true" />
      </Link>
    </motion.li>
  );
}

type Pulso = { tono: 'ok' | 'alerta' | 'apagado'; titulo: string; detalle: string; extra?: string };

function pulsoDelPortal(e: EstadoPortal): Pulso {
  if (!e.configurado) return { tono: 'apagado', titulo: 'Portal sin conectar', detalle: 'Falta cargar los datos de conexión.' };
  if (e.pausada) return { tono: 'alerta', titulo: 'Lectura en pausa', detalle: 'El portal rechazó la clave. Revisala para retomar la lectura.' };
  if (e.errores_consecutivos >= 3) return { tono: 'alerta', titulo: 'Sin lectura reciente', detalle: `Hubo ${e.errores_consecutivos} intentos fallidos seguidos.` };
  if (e.causas_importadas === 0) return { tono: 'apagado', titulo: 'Sin causas para vigilar', detalle: 'Importá tus causas del portal para empezar.' };
  return {
    tono: 'ok',
    titulo: `Vigilando ${e.causas_importadas} ${e.causas_importadas === 1 ? 'causa' : 'causas'}`,
    detalle: e.ultimo_ok ? `Última lectura ${haceCuanto(e.ultimo_ok)}` : 'Esperando la primera lectura',
    extra: e.ultimas_nuevas > 0 ? `${e.ultimas_nuevas} ${e.ultimas_nuevas === 1 ? 'novedad nueva' : 'novedades nuevas'} en esa lectura` : 'Sin novedades nuevas',
  };
}

/** Hace visible lo que trabaja solo: el sistema leyendo el portal de la SCBA mientras el abogado hace otra cosa. */
function PulsoPortal({ estado }: { estado: EstadoPortal | null }) {
  if (!estado) return null;
  const p = pulsoDelPortal(estado);
  return (
    <section className="superficie p-5" aria-label="Estado del portal">
      <p className="eyebrow">Portal de notificaciones</p>
      <div className="mt-3 flex items-center gap-3">
        <span
          className={`h-2.5 w-2.5 shrink-0 rounded-full ${p.tono === 'ok' ? 'pulso bg-silver' : p.tono === 'alerta' ? 'bg-warning' : 'bg-silver-deep/50'}`}
          aria-hidden="true"
        />
        <h2 className="text-[15px] font-bold text-white">{p.titulo}</h2>
      </div>
      <p className="mt-2 text-sm text-silver">{p.detalle}</p>
      {p.extra && <p className="mt-0.5 text-xs text-text-gray-light">{p.extra}</p>}
    </section>
  );
}

function TarjetaNovedades({ datos }: { datos: { lista: Novedad[]; total: number } | null }) {
  const sugerencias = usePlazosSugeridos(datos?.lista ?? []);
  if (!datos) return null;
  return (
    <section className="superficie p-5" aria-label="Novedades del portal">
      <div className="flex items-center justify-between">
        <p className="eyebrow">Por revisar</p>
        {datos.total > 0 && (
          <span className="min-w-5 rounded-full border border-warning/70 bg-warning/10 px-1.5 text-center font-mono text-[11px] leading-5 text-warning">{datos.total}</span>
        )}
      </div>

      {datos.lista.length === 0 ? (
        <div className="mt-4 flex items-center gap-3 text-sm text-silver">
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-silver-deep/50 text-silver">
            <CheckIcon className="h-4 w-4" strokeWidth={1.8} />
          </span>
          Todo revisado.
        </div>
      ) : (
        <ul className="mt-3 flex flex-col">
          {datos.lista.map((n) => (
            <li key={n.id} className="border-b border-line py-3 last:border-b-0">
              <div className="text-sm font-bold text-white">{n.tipo ?? 'Notificación del portal'}</div>
              <div className="mt-0.5 truncate text-xs text-text-gray-light">
                {n.numero_causa}
                {n.caratula ? ` · ${n.caratula}` : ''}
              </div>
              {sugerencias[n.id]?.propuesta && <LineaPlazo propuesta={sugerencias[n.id]!.propuesta!} novedad={n} />}
              <div className="mt-1.5 flex items-center justify-between gap-3">
                <span className="text-xs text-silver-deep">{n.fecha_notificacion ? `Notificada el ${n.fecha_notificacion.split('-').reverse().join('/')}` : 'Sin fecha de notificación'}</span>
                <EnlacePlazo novedad={n} />
              </div>
            </li>
          ))}
        </ul>
      )}

      <Link to="/novedades" className="mt-3 inline-flex items-center gap-2 text-xs text-silver hover:text-white">
        {datos.total > datos.lista.length ? `Ver las ${datos.total} novedades` : 'Abrir la bandeja'} <ArrowRightIcon className="h-3.5 w-3.5" strokeWidth={1.6} />
      </Link>
    </section>
  );
}

/** Una línea con el plazo propuesto de una novedad; al tocarla se revisa en la calculadora. */
function LineaPlazo({ propuesta, novedad }: { propuesta: PropuestaPlazo; novedad: Novedad }) {
  const dias = diasEntre(hoyEnArgentina(), propuesta.vencimiento);
  return (
    <Link
      to={enlaceDeRevision(propuesta, novedad)}
      className={`mt-2 flex items-center justify-between gap-3 rounded-sm border px-2.5 py-1.5 text-xs transition-colors hover:border-silver ${dias <= 0 ? 'border-warning/50 text-warning' : 'border-line text-silver'}`}
    >
      <span className="min-w-0 truncate">Vence {fechaConDia(propuesta.vencimiento).replace(/\/\d{4}$/, '')}{propuesta.origen === 'supletorio' ? ' · a verificar' : ''}</span>
      <span className="shrink-0 font-bold">{etiquetaDias(dias)}</span>
    </Link>
  );
}
