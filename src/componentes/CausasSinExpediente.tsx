import { useEffect, useState } from 'react';
import { api as portalApi, type CausaPortal } from '../api/portal';
import { api as clientesApi, type Cliente } from '../api/cliente';
import { avisarCambioNovedades } from '../api/novedades';
import { ErrorBanner } from './ErrorBanner';
import { Button } from '@/componentes/ui/button';

const tituloClases = 'text-xs font-bold text-silver mb-3 uppercase tracking-[0.2em]';
const campoClases = 'rounded-sharp bg-graphite border-line focus-visible:ring-silver';

/**
 * Causas que trajo el Portal de Notificaciones y todavía no tienen expediente. El portal no dice quién es el cliente
 * y un expediente lo exige, por eso la sincronización no crea expedientes sola: acá se ven todas y, al elegir el
 * cliente, se crea el expediente con los datos del portal y se vincula (sus novedades pasan a la ficha).
 */
export function CausasSinExpediente({ clientes, onCreado }: { clientes: Cliente[]; onCreado: () => void }) {
  const [causas, setCausas] = useState<CausaPortal[] | null>(null);
  const [clientePorCausa, setClientePorCausa] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  function cargar() {
    portalApi
      .listarCausas()
      .then((todas) => setCausas(todas.filter((c) => c.expediente_id === null)))
      .catch((e: Error) => setError(e.message));
  }

  useEffect(cargar, []);

  async function crear(causa: CausaPortal) {
    const clienteId = clientePorCausa[causa.id];
    if (!clienteId) return;
    setEnviando(causa.id);
    setError(null);
    setAviso(null);
    try {
      const r = await clientesApi.crearExpedientesDesdeCausas(clienteId, [causa.id]);
      const novedades = r.expedientes.reduce((t, e) => t + e.novedades_vinculadas, 0);
      setAviso(
        `Se creó el expediente "${causa.caratula ?? causa.numero_causa}"` +
          (novedades > 0 ? `, con ${novedades} ${novedades === 1 ? 'novedad que ya estaba guardada' : 'novedades que ya estaban guardadas'}.` : '.') +
          ' Las próximas novedades entran solas.'
      );
      avisarCambioNovedades();
      cargar();
      onCreado();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear el expediente.');
    } finally {
      setEnviando(null);
    }
  }

  if (causas === null && error === null) return null;

  return (
    <section className="superficie p-5 mt-8">
      <h2 className={tituloClases}>Causas del portal sin expediente{causas ? ` (${causas.length})` : ''}</h2>
      <p className="text-xs text-text-gray-light mb-3">
        Son las causas que trajo la sincronización con el portal. El portal no informa quién es el cliente, así que el
        expediente se crea cuando elegís a quién pertenece. Si el cliente no está cargado, crealo primero en Clientes.
      </p>
      {aviso && <div className="border-l-2 border-success text-success bg-graphite px-4 py-3 rounded-sharp text-sm mb-3">{aviso}</div>}
      {error && <ErrorBanner message={`No se pudo completar la operación: ${error}`} />}
      {causas && causas.length === 0 ? (
        <p className="text-sm text-text-gray-light">Todas las causas del portal ya tienen expediente.</p>
      ) : (
        <div className="flex flex-col">
          {(causas ?? []).map((c) => (
            <div key={c.id} className="flex flex-col sm:flex-row sm:items-center gap-2 py-3 border-b border-line last:border-b-0">
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white break-words">{c.caratula ?? 'Sin carátula'}</div>
                <div className="text-xs font-mono text-text-gray-light break-words">
                  {c.numero_causa}
                  {c.organismo ? ` · ${c.organismo}` : ''}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:shrink-0">
                <label htmlFor={`causa-${c.id}-cliente`} className="sr-only">
                  Cliente de la causa {c.numero_causa}
                </label>
                <select
                  id={`causa-${c.id}-cliente`}
                  value={clientePorCausa[c.id] ?? ''}
                  onChange={(e) => setClientePorCausa((actual) => ({ ...actual, [c.id]: e.target.value }))}
                  disabled={clientes.length === 0}
                  className={`${campoClases} block w-full sm:w-56 h-8 px-2.5 text-sm text-white outline-none border`}
                >
                  <option value="" disabled>
                    {clientes.length === 0 ? 'No hay clientes cargados' : 'Elegí el cliente'}
                  </option>
                  {clientes.map((cl) => (
                    <option key={cl.id} value={cl.id} className="bg-graphite text-white">
                      {cl.apellido}, {cl.nombre}
                    </option>
                  ))}
                </select>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={enviando !== null || !clientePorCausa[c.id]}
                  onClick={() => crear(c)}
                  className="rounded-sharp border border-line text-text-gray-light hover:text-white"
                >
                  {enviando === c.id ? 'Creando…' : 'Crear expediente'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
