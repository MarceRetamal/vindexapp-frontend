import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { api as clientesApi, type CausaSugerida } from '../api/cliente';
import { api as expedientesApi, type Expediente } from '../api/expedientes';
import { api as portalApi } from '../api/portal';
import { avisarCambioNovedades } from '../api/novedades';
import { EmptyState } from './EmptyState';
import { ErrorBanner } from './ErrorBanner';
import { EstadoBadge } from './EstadoBadge';
import { ListSkeleton } from './ListSkeleton';
import { MarcaPortal } from './MarcaPortal';
import { Button } from '@/componentes/ui/button';

const tituloClases = 'text-xs font-bold text-silver mb-3 uppercase tracking-[0.2em]';

/**
 * Expedientes del cliente y causas del Portal de Notificaciones que pueden ser suyas. La sugerencia compara el
 * apellido y el nombre con la carátula; nunca vincula sola: el abogado marca cuáles son y confirma.
 */
export function PanelCausasCliente({ clienteId }: { clienteId: string }) {
  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  const [sugeridas, setSugeridas] = useState<CausaSugerida[]>([]);
  const [elegidas, setElegidas] = useState<Set<string>>(new Set());
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  function cargar() {
    setCargando(true);
    setError(null);
    Promise.all([expedientesApi.listarDeCliente(clienteId), clientesApi.causasSugeridas(clienteId)])
      .then(([e, s]) => {
        setExpedientes(e);
        setSugeridas(s);
        // Las de certeza alta vienen marcadas; las posibles (solo apellido) las marca el abogado si corresponden.
        setElegidas(new Set(s.filter((c) => c.certeza === 'alta' && !c.expediente_existente).map((c) => c.id)));
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setCargando(false));
  }

  useEffect(cargar, [clienteId]);

  function alternar(id: string) {
    setElegidas((actuales) => {
      const nuevas = new Set(actuales);
      if (nuevas.has(id)) nuevas.delete(id);
      else nuevas.add(id);
      return nuevas;
    });
  }

  async function vincularConExistente(causa: CausaSugerida) {
    if (!causa.expediente_existente) return;
    setEnviando(true);
    setError(null);
    setAviso(null);
    try {
      const r = await portalApi.vincularCausa(causa.expediente_existente.id, causa.id);
      setAviso(
        `Causa vinculada con el expediente "${causa.expediente_existente.caratula}"` +
          (r.novedades_vinculadas > 0 ? `, con ${r.novedades_vinculadas} ${r.novedades_vinculadas === 1 ? 'novedad que ya estaba guardada' : 'novedades que ya estaban guardadas'}.` : '.') +
          ' Las próximas novedades entran solas.'
      );
      avisarCambioNovedades();
      cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo vincular la causa.');
    } finally {
      setEnviando(false);
    }
  }

  async function vincular() {
    setEnviando(true);
    setError(null);
    setAviso(null);
    try {
      const r = await clientesApi.crearExpedientesDesdeCausas(clienteId, [...elegidas]);
      const novedades = r.expedientes.reduce((t, e) => t + e.novedades_vinculadas, 0);
      setAviso(
        (r.expedientes.length === 1
          ? 'Se creó 1 expediente vinculado con el portal'
          : `Se crearon ${r.expedientes.length} expedientes vinculados con el portal`) +
          (novedades > 0 ? `, con ${novedades} ${novedades === 1 ? 'novedad que ya estaba guardada' : 'novedades que ya estaban guardadas'}.` : '.') +
          ' Las próximas novedades entran solas.'
      );
      avisarCambioNovedades();
      cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron vincular las causas.');
    } finally {
      setEnviando(false);
    }
  }

  const conExistente = sugeridas.filter((c) => c.expediente_existente);
  const paraCrear = sugeridas.filter((c) => !c.expediente_existente);

  return (
    <div className="flex flex-col gap-6">
      {aviso && <div className="border-l-2 border-success text-success bg-graphite px-4 py-3 rounded-sharp text-sm">{aviso}</div>}
      {error && <ErrorBanner message={`No se pudo completar la operación: ${error}`} />}

      <section>
        <h2 className={tituloClases}>Expedientes</h2>
        {cargando ? (
          <ListSkeleton rows={2} />
        ) : expedientes.length === 0 ? (
          <EmptyState message="Este cliente todavía no tiene expedientes." />
        ) : (
          <div>
            {expedientes.map((e) => (
              <Link
                key={e.id}
                to={`/expedientes/${e.id}`}
                className="flex flex-col sm:flex-row sm:items-center gap-2 py-3 border-b border-line no-underline hover:bg-white/[0.02]"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white break-words">{e.caratula}</div>
                  <div className="text-xs font-mono text-text-gray-light break-words">
                    {e.numero ? `Nº ${e.numero}` : 'Sin número'}
                    {e.juzgado ? ` · ${e.juzgado}` : ''}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                  <MarcaPortal causas={e.causas_portal} pendientes={e.novedades_pendientes} />
                  <EstadoBadge estado={e.estado} colorMap={{ Activo: 'success', 'En trámite': 'warning', Archivado: 'neutral' }} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {!cargando && conExistente.length > 0 && (
        <section className="border border-line rounded-sharp bg-graphite p-4">
          <h2 className={tituloClases}>Causas en el portal de expedientes que ya cargaste</h2>
          <p className="text-xs text-text-gray-light mb-3">
            Tienen el mismo número que un expediente de este cliente. Vinculalas para que sus novedades lleguen a la ficha.
          </p>
          <div className="flex flex-col">
            {conExistente.map((c) => (
              <div key={c.id} className="flex flex-col sm:flex-row sm:items-center gap-2 py-2 border-b border-line last:border-b-0">
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white break-words">{c.caratula ?? 'Sin carátula'}</div>
                  <div className="text-xs font-mono text-text-gray-light break-words">
                    {c.numero_causa}
                    {c.organismo ? ` · ${c.organismo}` : ''}
                  </div>
                  <div className={`text-xs ${c.certeza === 'alta' ? 'text-success' : 'text-warning'}`}>{c.motivo}</div>
                  <div className="text-xs text-text-gray-light">Expediente: {c.expediente_existente?.caratula}</div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={enviando}
                  onClick={() => vincularConExistente(c)}
                  className="rounded-sharp border border-line text-text-gray-light hover:text-white sm:shrink-0"
                >
                  Vincular con ese expediente
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}

      {!cargando && paraCrear.length > 0 && (
        <section className="border border-line rounded-sharp bg-graphite p-4">
          <h2 className={tituloClases}>Causas en el portal que pueden ser de este cliente</h2>
          <p className="text-xs text-text-gray-light mb-3">
            Encontradas por el apellido y el nombre en la carátula. Marcá las que correspondan: por cada una se crea el
            expediente con los datos del portal y sus novedades pasan a la ficha.
          </p>
          <div className="flex flex-col">
            {paraCrear.map((c) => (
              <label key={c.id} className="flex items-start gap-3 py-2 border-b border-line last:border-b-0 cursor-pointer">
                <input
                  type="checkbox"
                  checked={elegidas.has(c.id)}
                  onChange={() => alternar(c.id)}
                  className="accent-silver mt-1 w-4 h-4 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white break-words">{c.caratula ?? 'Sin carátula'}</div>
                  <div className="text-xs font-mono text-text-gray-light break-words">
                    {c.numero_causa}
                    {c.organismo ? ` · ${c.organismo}` : ''}
                  </div>
                  <div className={`text-xs ${c.certeza === 'alta' ? 'text-success' : 'text-warning'}`}>{c.motivo}</div>
                </div>
              </label>
            ))}
          </div>
          <Button
            onClick={vincular}
            disabled={enviando || elegidas.size === 0}
            className="mt-3 rounded-sharp bg-gradient-to-br from-silver via-silver-deep to-silver text-structural-black font-bold hover:brightness-110 focus-visible:ring-2 focus-visible:ring-silver disabled:opacity-60"
          >
            {enviando
              ? 'Vinculando…'
              : elegidas.size === 0
                ? 'Marcá al menos una causa'
                : elegidas.size === 1
                ? 'Crear el expediente y vincular'
                : `Crear ${elegidas.size} expedientes y vincular`}
          </Button>
        </section>
      )}
    </div>
  );
}
