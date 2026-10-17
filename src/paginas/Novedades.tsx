import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  api,
  avisarCambioNovedades,
  type EstadoNovedades,
  type Novedad,
  type NovedadDetalle,
} from '../api/novedades';
import { EmptyState } from '../componentes/EmptyState';
import { ErrorBanner } from '../componentes/ErrorBanner';
import { EstadoBadge } from '../componentes/EstadoBadge';
import { ListSkeleton } from '../componentes/ListSkeleton';
import { Button } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';

const POR_PAGINA = 50;

const PESTANAS: { valor: EstadoNovedades; etiqueta: string }[] = [
  { valor: 'pendientes', etiqueta: 'Pendientes' },
  { valor: 'revisadas', etiqueta: 'Revisadas' },
  { valor: 'todas', etiqueta: 'Todas' },
];

const campoClases = 'rounded-sharp bg-graphite border-line focus-visible:ring-silver';
const botonClases = 'rounded-sharp border border-line text-text-gray-light hover:text-white';

function formatearFecha(fechaISO: string): string {
  const [anio, mes, dia] = fechaISO.slice(0, 10).split('-');
  return `${dia}/${mes}/${anio}`;
}

function formatearFechaHora(fechaISO: string): string {
  const hora = fechaISO.length >= 16 ? ` ${fechaISO.slice(11, 16)}` : '';
  return `${formatearFecha(fechaISO)}${hora}`;
}

function formatearMarca(ms: number): string {
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(ms));
}

export function Novedades() {
  const [estado, setEstado] = useState<EstadoNovedades>('pendientes');
  const [busqueda, setBusqueda] = useState('');
  const [q, setQ] = useState('');
  const [lista, setLista] = useState<Novedad[]>([]);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [marcandoTodas, setMarcandoTodas] = useState(false);
  const pedidoActual = useRef(0);

  // La búsqueda espera un instante después de tipear para no pedir en cada letra.
  useEffect(() => {
    const espera = window.setTimeout(() => setQ(busqueda.trim()), 350);
    return () => window.clearTimeout(espera);
  }, [busqueda]);

  const cargar = useCallback(() => {
    const numero = ++pedidoActual.current;
    setCargando(true);
    setError(null);
    api
      .listarNovedades({ estado, q: q || undefined, limit: POR_PAGINA })
      .then((r) => {
        if (numero !== pedidoActual.current) return;
        setLista(r.novedades);
        setTotal(r.total);
      })
      .catch((e: Error) => {
        if (numero === pedidoActual.current) setError(e.message);
      })
      .finally(() => {
        if (numero === pedidoActual.current) setCargando(false);
      });
  }, [estado, q]);

  useEffect(cargar, [cargar]);

  function cargarMas() {
    const numero = pedidoActual.current;
    setCargandoMas(true);
    api
      .listarNovedades({ estado, q: q || undefined, limit: POR_PAGINA, offset: lista.length })
      .then((r) => {
        if (numero !== pedidoActual.current) return;
        setLista((actual) => [...actual, ...r.novedades.filter((n) => !actual.some((a) => a.id === n.id))]);
        setTotal(r.total);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setCargandoMas(false));
  }

  function alCambiarRevision(id: string, revisadaEn: number | null) {
    avisarCambioNovedades();
    if (estado === 'todas') {
      setLista((actual) => actual.map((n) => (n.id === id ? { ...n, revisada_en: revisadaEn } : n)));
      return;
    }
    // En "pendientes" o "revisadas", la novedad deja de pertenecer a la lista actual.
    setLista((actual) => actual.filter((n) => n.id !== id));
    setTotal((t) => Math.max(0, t - 1));
  }

  function alMarcarEnBloque(marcadas: number) {
    setAviso(marcadas === 1 ? 'Se marcó 1 novedad como revisada.' : `Se marcaron ${marcadas} novedades como revisadas.`);
    avisarCambioNovedades();
    cargar();
  }

  async function marcarTodasRevisadas() {
    if (!window.confirm(`Se marcarán como revisadas las ${total} novedades pendientes (no solo las que se ven en la lista). ¿Seguimos?`)) return;
    setMarcandoTodas(true);
    setError(null);
    try {
      const r = await api.marcarRevisadas({ todas: true });
      alMarcarEnBloque(r.marcadas);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron marcar las novedades.');
    } finally {
      setMarcandoTodas(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-black uppercase tracking-wide text-white">
          Novedades{' '}
          <span className="text-text-gray-light font-normal normal-case tracking-normal">
            ({total} {estado === 'pendientes' ? 'pendientes' : estado === 'revisadas' ? 'revisadas' : 'en total'})
          </span>
        </h1>
        {estado === 'pendientes' && total > 0 && !q && (
          <Button
            onClick={marcarTodasRevisadas}
            disabled={marcandoTodas}
            className="rounded-sharp bg-gradient-to-br from-silver via-silver-deep to-silver text-structural-black font-bold hover:brightness-110 focus-visible:ring-2 focus-visible:ring-silver"
          >
            {marcandoTodas ? 'Marcando…' : 'Marcar todas como revisadas'}
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex gap-1" role="tablist" aria-label="Estado de las novedades">
          {PESTANAS.map((p) => (
            <Button
              key={p.valor}
              role="tab"
              aria-selected={estado === p.valor}
              variant="ghost"
              size="sm"
              onClick={() => setEstado(p.valor)}
              className={`rounded-sharp border ${
                estado === p.valor ? 'border-silver text-white font-bold' : 'border-line text-text-gray-light hover:text-white'
              }`}
            >
              {p.etiqueta}
            </Button>
          ))}
        </div>
        <Input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por carátula, número, trámite o texto"
          aria-label="Buscar novedades"
          className={`${campoClases} max-w-sm`}
        />
      </div>

      <AccionesEnBloque pendientes={estado === 'pendientes' ? lista : []} onMarcadas={alMarcarEnBloque} onError={setError} />

      {aviso && (
        <div className="border-l-2 border-success text-success bg-graphite px-4 py-3 rounded-sharp text-sm mb-4">{aviso}</div>
      )}
      {error && <ErrorBanner message={`No se pudo completar la operación: ${error}`} />}

      {cargando ? (
        <ListSkeleton rows={6} />
      ) : lista.length === 0 ? (
        <EmptyState
          message={
            q
              ? 'Ninguna novedad coincide con la búsqueda.'
              : estado === 'pendientes'
                ? 'No hay novedades pendientes de revisar.'
                : estado === 'revisadas'
                  ? 'Todavía no marcaste novedades como revisadas.'
                  : 'Todavía no llegaron novedades del portal.'
          }
        />
      ) : (
        <>
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.03 } } }}
          >
            {lista.map((n) => (
              <FilaNovedad key={n.id} novedad={n} onRevision={alCambiarRevision} onError={setError} />
            ))}
          </motion.div>
          {lista.length < total && (
            <div className="flex justify-center mt-6">
              <Button variant="ghost" onClick={cargarMas} disabled={cargandoMas} className={botonClases}>
                {cargandoMas ? 'Cargando…' : `Cargar más (${lista.length} de ${total})`}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function FilaNovedad({
  novedad,
  onRevision,
  onError,
}: {
  novedad: Novedad;
  onRevision: (id: string, revisadaEn: number | null) => void;
  onError: (mensaje: string | null) => void;
}) {
  const [abierta, setAbierta] = useState(false);
  const [detalle, setDetalle] = useState<NovedadDetalle | null>(null);
  const [cargandoTexto, setCargandoTexto] = useState(false);
  const [errorTexto, setErrorTexto] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);

  const revisada = novedad.revisada_en !== null;

  function alternarTexto() {
    const abrir = !abierta;
    setAbierta(abrir);
    if (!abrir || detalle || cargandoTexto) return;
    setCargandoTexto(true);
    setErrorTexto(null);
    api
      .obtenerNovedad(novedad.id)
      .then(setDetalle)
      .catch((e: Error) => setErrorTexto(e.message))
      .finally(() => setCargandoTexto(false));
  }

  async function alternarRevision() {
    setProcesando(true);
    onError(null);
    try {
      const r = await api.marcarRevisada(novedad.id, !revisada);
      onRevision(novedad.id, r.revisada_en);
    } catch (e) {
      onError(e instanceof Error ? e.message : 'No se pudo actualizar la novedad.');
    } finally {
      setProcesando(false);
    }
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="py-4 border-b border-line"
    >
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-silver-deep border border-line rounded-sharp px-2 py-0.5">
              {novedad.numero_causa}
            </span>
            <EstadoBadge
              estado={revisada ? 'Revisada' : 'Pendiente'}
              colorMap={{ Revisada: 'success', Pendiente: 'warning' }}
            />
          </div>
          <div className="font-medium text-white">{novedad.tipo ?? 'Notificación sin trámite informado'}</div>
          {novedad.caratula && <div className="text-xs text-text-gray-light">{novedad.caratula}</div>}
          {novedad.organismo && <div className="text-xs text-text-gray-light">{novedad.organismo}</div>}
          <div className="text-xs font-mono text-text-gray-light">
            {novedad.fecha_notificacion && <>Notificada {formatearFecha(novedad.fecha_notificacion)}</>}
            {novedad.fecha_notificacion && novedad.fecha_alta && ' · '}
            {novedad.fecha_alta && <>Alta {formatearFechaHora(novedad.fecha_alta)}</>}
            {revisada && novedad.revisada_en !== null && <> · Revisada {formatearMarca(novedad.revisada_en)}</>}
          </div>
          {!abierta && novedad.texto_extracto && (
            <p className="text-sm text-silver mt-1 line-clamp-2">{novedad.texto_extracto.replace(/\s+/g, ' ').trim()}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <Button variant="ghost" size="sm" onClick={alternarRevision} disabled={procesando} className={botonClases}>
            {revisada ? 'Volver a pendiente' : 'Marcar revisada'}
          </Button>
          {novedad.tiene_texto === 1 && (
            <Button variant="ghost" size="sm" onClick={alternarTexto} className={botonClases}>
              {abierta ? 'Ocultar texto' : 'Ver texto'}
            </Button>
          )}
          {novedad.enlace && (
            <a
              href={novedad.enlace}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-text-gray-light hover:text-white underline-offset-4 hover:underline"
            >
              Abrir en el portal
            </a>
          )}
        </div>
      </div>

      {abierta && (
        <div className="mt-3 border border-line rounded-sharp bg-graphite p-4">
          {cargandoTexto && <p className="text-sm text-text-gray-light">Cargando el texto…</p>}
          {errorTexto && <ErrorBanner message={`No se pudo cargar el texto: ${errorTexto}`} />}
          {detalle && (
            <>
              {detalle.destinatario && (
                <p className="text-xs text-text-gray-light mb-3">Destinatario: {detalle.destinatario}</p>
              )}
              <pre className="whitespace-pre-wrap font-sans text-sm text-silver leading-relaxed">
                {detalle.texto ?? 'Esta notificación no tiene texto guardado.'}
              </pre>
            </>
          )}
        </div>
      )}
    </motion.article>
  );
}

function AccionesEnBloque({
  pendientes,
  onMarcadas,
  onError,
}: {
  pendientes: Novedad[];
  onMarcadas: (marcadas: number) => void;
  onError: (mensaje: string | null) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [fecha, setFecha] = useState('');
  const [procesando, setProcesando] = useState(false);

  async function ejecutar(
    cuerpo: { ids: string[] } | { hasta_fecha_notificacion: string },
    confirmacion: string,
  ) {
    if (!window.confirm(confirmacion)) return;
    setProcesando(true);
    onError(null);
    try {
      const r = await api.marcarRevisadas(cuerpo);
      onMarcadas(r.marcadas);
    } catch (e) {
      onError(e instanceof Error ? e.message : 'No se pudieron marcar las novedades.');
    } finally {
      setProcesando(false);
    }
  }

  return (
    <div className="mb-6">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        className="text-xs text-text-gray-light hover:text-white underline-offset-4 hover:underline"
      >
        {abierto ? 'Ocultar más opciones' : 'Más opciones: marcar hasta una fecha o solo las de la lista'}
      </button>
      {abierto && (
        <div className="mt-3 border border-line rounded-sharp bg-graphite p-4 flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-silver">Dar por revisado todo lo notificado hasta:</span>
            <Input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              aria-label="Fecha de notificación límite"
              className={`${campoClases} w-44`}
            />
            <Button
              variant="ghost"
              size="sm"
              disabled={!fecha || procesando}
              onClick={() =>
                ejecutar(
                  { hasta_fecha_notificacion: fecha },
                  `Se marcarán como revisadas todas las novedades pendientes con fecha de notificación hasta el ${formatearFecha(fecha)} inclusive. ¿Seguimos?`,
                )
              }
              className={botonClases}
            >
              Marcar como revisadas
            </Button>
          </div>
          <div>
            <Button
              variant="ghost"
              size="sm"
              disabled={pendientes.length === 0 || procesando}
              onClick={() =>
                ejecutar(
                  { ids: pendientes.map((n) => n.id) },
                  `Se marcarán como revisadas las ${pendientes.length} novedades pendientes que se ven en la lista. ¿Seguimos?`,
                )
              }
              className={botonClases}
            >
              {pendientes.length > 0
                ? `Marcar como revisadas las ${pendientes.length} de la lista`
                : 'Marcar como revisadas las de la lista (solo en la pestaña Pendientes)'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
