import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { api as portalApi, type CausaPortal, type CausaVinculada } from '../api/portal';
import { api as novedadesApi, avisarCambioNovedades, type Novedad } from '../api/novedades';
import { EmptyState } from './EmptyState';
import { EnlacePlazo } from './EnlacePlazo';
import { ErrorBanner } from './ErrorBanner';
import { EstadoBadge } from './EstadoBadge';
import { ListSkeleton } from './ListSkeleton';
import { Button } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';

const botonClases = 'rounded-sharp border border-line text-text-gray-light hover:text-white';
const LIMITE = 30;

function avisoDeVinculo(novedades: number): string {
  const sumadas =
    novedades === 0
      ? 'Todavía no había novedades guardadas de esa causa'
      : novedades === 1
        ? 'Se sumó 1 novedad que ya estaba guardada'
        : `Se sumaron ${novedades} novedades que ya estaban guardadas`;
  return `Causa vinculada. ${sumadas}; las próximas entran solas.`;
}

function formatearFecha(fechaISO: string): string {
  const [anio, mes, dia] = fechaISO.slice(0, 10).split('-');
  return `${dia}/${mes}/${anio}`;
}

/**
 * Novedades del Portal de Notificaciones de este expediente y las causas del portal vinculadas con él.
 * Una causa importada no sabe de qué cliente es: el vínculo con el expediente lo decide el abogado acá.
 */
export function PanelPortal({ expedienteId }: { expedienteId: string }) {
  const [causas, setCausas] = useState<CausaVinculada[]>([]);
  const [novedades, setNovedades] = useState<Novedad[]>([]);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [vinculando, setVinculando] = useState(false);
  const [sugeridas, setSugeridas] = useState<(CausaVinculada & { certeza: 'alta' | 'posible'; motivo: string })[]>([]);

  function cargar() {
    setCargando(true);
    setError(null);
    Promise.all([
      portalApi.causasDeExpediente(expedienteId),
      novedadesApi.listarNovedades({ expediente_id: expedienteId, estado: 'todas', limit: LIMITE }),
      portalApi.sugeridasDeExpediente(expedienteId),
    ])
      .then(([c, n, s]) => {
        setCausas(c);
        setSugeridas(s);
        setNovedades(n.novedades);
        setTotal(n.total);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setCargando(false));
  }

  useEffect(cargar, [expedienteId]);

  async function desvincular(causa: CausaVinculada) {
    if (!window.confirm(`Se desvincula la causa ${causa.numero_causa} de este expediente. Sus novedades siguen en la bandeja de Novedades, sin expediente. ¿Seguimos?`)) return;
    setError(null);
    setAviso(null);
    try {
      const r = await portalApi.desvincularCausa(expedienteId, causa.id);
      setAviso(`Causa desvinculada (${r.novedades_desvinculadas} novedades quedaron sin expediente).`);
      cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo desvincular la causa.');
    }
  }

  async function vincularSugerida(causaId: string) {
    setError(null);
    setAviso(null);
    try {
      const r = await portalApi.vincularCausa(expedienteId, causaId);
      setAviso(avisoDeVinculo(r.novedades_vinculadas));
      avisarCambioNovedades();
      cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo vincular la causa.');
    }
  }

  async function alternarRevision(n: Novedad) {
    setError(null);
    try {
      const r = await novedadesApi.marcarRevisada(n.id, n.revisada_en === null);
      setNovedades((actuales) => actuales.map((x) => (x.id === n.id ? { ...x, revisada_en: r.revisada_en } : x)));
      avisarCambioNovedades();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo actualizar la novedad.');
    }
  }

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 mt-8">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-silver">Portal de Notificaciones</h2>
        <Button variant="ghost" size="sm" onClick={() => setVinculando((v) => !v)} className={botonClases}>
          {vinculando ? 'Cerrar' : '+ Vincular causa del portal'}
        </Button>
      </div>

      {vinculando && (
        <SelectorCausa
          expedienteId={expedienteId}
          onVinculada={(n) => {
            setVinculando(false);
            setAviso(avisoDeVinculo(n));
            cargar();
          }}
          onError={setError}
        />
      )}

      {!cargando && sugeridas.length > 0 && (
        <div className="border border-line rounded-sharp bg-graphite p-4 mb-3 flex flex-col gap-2">
          <p className="text-xs text-text-gray-light">Encontramos en el portal una causa con el mismo número que este expediente:</p>
          {sugeridas.map((c) => (
            <div key={c.id} className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white break-words">{c.caratula ?? 'Sin carátula'}</div>
                <div className="text-xs font-mono text-text-gray-light break-words">
                  {c.numero_causa}
                  {c.organismo ? ` · ${c.organismo}` : ''}
                </div>
                <div className={`text-xs ${c.certeza === 'alta' ? 'text-success' : 'text-warning'}`}>{c.motivo}</div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => vincularSugerida(c.id)} className={`${botonClases} sm:shrink-0`}>
                Vincular
              </Button>
            </div>
          ))}
        </div>
      )}

      {aviso && <div className="border-l-2 border-success text-success bg-graphite px-4 py-3 rounded-sharp text-sm mb-3">{aviso}</div>}
      {error && <ErrorBanner message={`No se pudo completar la operación: ${error}`} />}

      {cargando ? (
        <ListSkeleton rows={3} />
      ) : (
        <>
          {causas.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {causas.map((c) => (
                <div key={c.id} className="flex items-center gap-2 border border-line rounded-sharp px-2 py-1 text-xs text-silver">
                  <span className="font-mono">{c.numero_causa}</span>
                  {c.organismo && <span className="text-text-gray-light">· {c.organismo}</span>}
                  <button
                    type="button"
                    onClick={() => desvincular(c)}
                    aria-label={`Desvincular la causa ${c.numero_causa}`}
                    className="ml-1 text-text-gray-light hover:text-warning"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {novedades.length === 0 ? (
            <EmptyState
              message={
                causas.length === 0
                  ? 'Todavía no hay novedades del portal en este expediente. Vinculá la causa del portal para que lleguen acá.'
                  : 'La causa está vinculada, pero todavía no llegó ninguna novedad. Las próximas van a aparecer acá.'
              }
            />
          ) : (
            <div>
              {novedades.map((n) => {
                const revisada = n.revisada_en !== null;
                return (
                  <article key={n.id} className="py-3 border-b border-line flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
                    <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-white break-words">{n.tipo ?? 'Notificación del portal'}</span>
                        <EstadoBadge estado={revisada ? 'Revisada' : 'Pendiente'} colorMap={{ Revisada: 'success', Pendiente: 'warning' }} />
                      </div>
                      <div className="text-xs font-mono text-text-gray-light">
                        {n.numero_causa}
                        {n.fecha_notificacion && ` · Notificada ${formatearFecha(n.fecha_notificacion)}`}
                        {!n.fecha_notificacion && n.fecha_alta && ` · Alta ${formatearFecha(n.fecha_alta)}`}
                      </div>
                      {n.texto_extracto && (
                        <p className="text-sm text-silver line-clamp-2">{n.texto_extracto.replace(/\s+/g, ' ').trim()}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => alternarRevision(n)} className={botonClases}>
                        {revisada ? 'Volver a pendiente' : 'Marcar revisada'}
                      </Button>
                      {n.enlace && (
                        <a
                          href={n.enlace}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-text-gray-light hover:text-white underline-offset-4 hover:underline"
                        >
                          Abrir en el portal
                        </a>
                      )}
                      <EnlacePlazo novedad={n} />
                    </div>
                  </article>
                );
              })}
              {total > novedades.length && (
                <Link to="/novedades" className="inline-block mt-3 text-xs text-text-gray-light hover:text-white">
                  Se muestran las {novedades.length} más recientes de {total}. Ver todas en Novedades
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}

function SelectorCausa({
  expedienteId,
  onVinculada,
  onError,
}: {
  expedienteId: string;
  onVinculada: (novedades: number) => void;
  onError: (mensaje: string | null) => void;
}) {
  const [causas, setCausas] = useState<CausaPortal[] | null>(null);
  const [filtro, setFiltro] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    portalApi
      .listarCausas()
      .then(setCausas)
      .catch((e: Error) => onError(e.message));
  }, [onError]);

  async function vincular(causa: CausaPortal) {
    setEnviando(true);
    onError(null);
    try {
      const r = await portalApi.vincularCausa(expedienteId, causa.id);
      avisarCambioNovedades();
      onVinculada(r.novedades_vinculadas);
    } catch (e) {
      onError(e instanceof Error ? e.message : 'No se pudo vincular la causa.');
    } finally {
      setEnviando(false);
    }
  }

  const texto = filtro.trim().toUpperCase();
  const visibles = (causas ?? []).filter(
    (c) =>
      c.expediente_id !== expedienteId &&
      (texto === '' || `${c.numero_causa} ${c.caratula ?? ''} ${c.organismo ?? ''}`.toUpperCase().includes(texto))
  );

  return (
    <div className="border border-line rounded-sharp bg-graphite p-4 mb-3 flex flex-col gap-3">
      <p className="text-xs text-text-gray-light">
        Elegí la causa del portal que corresponde a este expediente. Solo aparecen las causas importadas con la extensión.
      </p>
      <Input
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
        placeholder="Buscar por número, carátula o juzgado"
        aria-label="Buscar causa del portal"
        className="rounded-sharp bg-structural-black border-line focus-visible:ring-silver"
      />
      {causas === null ? (
        <ListSkeleton rows={2} />
      ) : visibles.length === 0 ? (
        <p className="text-sm text-text-gray-light">No hay causas importadas que coincidan.</p>
      ) : (
        <div className="max-h-72 overflow-y-auto flex flex-col">
          {visibles.map((c) => {
            const enOtro = c.expediente_id !== null;
            return (
              <div key={c.id} className="flex flex-col sm:flex-row sm:items-center gap-2 py-2 border-b border-line last:border-b-0">
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white break-words">{c.caratula ?? 'Sin carátula'}</div>
                  <div className="text-xs font-mono text-text-gray-light break-words">
                    {c.numero_causa}
                    {c.organismo ? ` · ${c.organismo}` : ''}
                  </div>
                  {enOtro && (
                    <div className="text-xs text-warning">Ya vinculada con: {c.expediente_caratula ?? 'otro expediente'}</div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={enviando || enOtro}
                  onClick={() => vincular(c)}
                  className={`${botonClases} sm:shrink-0`}
                >
                  Vincular
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
