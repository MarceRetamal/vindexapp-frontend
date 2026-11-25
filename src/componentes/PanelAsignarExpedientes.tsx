import { useEffect, useMemo, useState } from 'react';
import { apiAsignacion, type ExpedienteDisponible } from '../api/cliente';
import type { RolProfesional } from '../api/expedientes';
import { ErrorBanner } from './ErrorBanner';
import { SelectorRol } from './RolProfesional';
import { Button } from '@/componentes/ui/button';
import { coincide } from '../lib/texto';

/**
 * Expedientes que el sistema ya trajo del portal y todavía no tienen cliente: se eligen y se asignan a este cliente,
 * con el rol del abogado en cada uno. Los que pueden ser suyos por la carátula aparecen primero y marcados. Si el
 * cliente va a iniciar una causa, todavía no hay expediente en el portal: el vínculo queda pendiente hasta que
 * aparezca (la lectura de "Mis Causas" es diaria).
 */
export function PanelAsignarExpedientes({ clienteId, onAsignado }: { clienteId: string; onAsignado?: () => void }) {
  const [disponibles, setDisponibles] = useState<ExpedienteDisponible[] | null>(null);
  const [elegidos, setElegidos] = useState<Set<string>>(new Set());
  const [rol, setRol] = useState<RolProfesional | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [verTodos, setVerTodos] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  function cargar() {
    apiAsignacion
      .disponibles(clienteId)
      .then((d) => {
        setDisponibles(d);
        setElegidos(new Set(d.filter((e) => e.certeza === 'alta').map((e) => e.id)));
      })
      .catch((e: Error) => setError(e.message));
  }
  useEffect(cargar, [clienteId]);

  const sugeridos = (disponibles ?? []).filter((e) => e.certeza !== null);
  const visibles = useMemo(() => {
    const base = verTodos || busqueda.trim() ? disponibles ?? [] : sugeridos;
    return base.filter((e) => coincide(busqueda, `${e.caratula} ${e.numero ?? ''} ${e.juzgado ?? ''}`)).slice(0, 60);
  }, [disponibles, sugeridos, verTodos, busqueda]);

  async function asignar() {
    setEnviando(true);
    setError(null);
    try {
      const r = await apiAsignacion.asignar(clienteId, [...elegidos], rol);
      setAviso(`${String(r.asignados)} expediente${r.asignados === 1 ? '' : 's'} asignado${r.asignados === 1 ? '' : 's'}.`);
      setElegidos(new Set());
      cargar();
      onAsignado?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo asignar.');
    } finally {
      setEnviando(false);
    }
  }

  if (disponibles === null) return null;

  return (
    <section className="superficie p-5">
      <h2 className="eyebrow mb-1 text-silver">Expedientes sincronizados sin cliente</h2>
      <p className="mb-4 text-xs leading-relaxed text-text-gray-light">
        Causas que el sistema trajo del portal y todavía no tienen cliente. Si este cliente va a iniciar una causa, el
        vínculo queda pendiente hasta que aparezca en el portal.
      </p>
      {error && <ErrorBanner message={error} />}
      {aviso && <p className="mb-3 text-sm text-success">{aviso}</p>}

      {disponibles.length === 0 ? (
        <p className="text-sm text-silver-deep">No hay expedientes sin cliente. Cuando el portal traiga una causa nueva, va a aparecer acá.</p>
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por carátula, número o juzgado"
              aria-label="Buscar expediente sin cliente"
              className="h-9 min-w-[220px] flex-1 rounded-sharp border border-line bg-graphite px-3 text-sm text-white placeholder:text-text-gray-light"
            />
            {!busqueda && (
              <button type="button" onClick={() => setVerTodos((v) => !v)} className="text-xs text-silver underline-offset-2 hover:underline">
                {verTodos ? 'Ver solo sugeridos' : `Ver los ${String(disponibles.length)}`}
              </button>
            )}
          </div>
          {visibles.length === 0 ? (
            <p className="text-sm text-silver-deep">
              {sugeridos.length === 0 && !busqueda ? 'Ninguna carátula coincide con el nombre del cliente. Buscá el expediente o tocá "Ver" para elegirlo de la lista.' : 'Ningún expediente coincide con la búsqueda.'}
            </p>
          ) : (
            <ul className="mb-4 max-h-80 overflow-y-auto">
              {visibles.map((e) => (
                <li key={e.id}>
                  <label className="flex cursor-pointer items-start gap-3 border-b border-line py-2.5">
                    <input
                      type="checkbox"
                      className="mt-1 accent-silver"
                      checked={elegidos.has(e.id)}
                      onChange={() =>
                        setElegidos((prev) => {
                          const n = new Set(prev);
                          if (n.has(e.id)) n.delete(e.id);
                          else n.add(e.id);
                          return n;
                        })
                      }
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-white">{e.caratula}</span>
                      <span className="block text-xs text-text-gray-light">{[e.numero, e.juzgado].filter(Boolean).join(' · ')}</span>
                      {e.certeza && <span className={`text-[11px] ${e.certeza === 'alta' ? 'text-success' : 'text-warning'}`}>{e.motivo}</span>}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-col gap-3">
            <div>
              <p className="mb-1.5 text-xs text-text-gray-light">Tu rol en {elegidos.size === 1 ? 'ese expediente' : 'esos expedientes'}</p>
              <SelectorRol valor={rol} onCambio={setRol} />
            </div>
            <Button
              disabled={elegidos.size === 0 || enviando}
              onClick={() => void asignar()}
              className="self-start rounded-sharp bg-gradient-to-br from-silver via-silver-deep to-silver text-structural-black font-bold hover:brightness-110 disabled:opacity-50"
            >
              {enviando ? 'Asignando…' : `Asignar ${elegidos.size > 0 ? String(elegidos.size) : ''} a este cliente`}
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
