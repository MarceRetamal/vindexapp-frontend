import { useCallback, useEffect, useState } from 'react';
import { api, type Estrategia } from '../api/estrategias';
import { Button } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
import { Textarea } from '@/componentes/ui/textarea';
import { BotonEliminar } from './BotonEliminar';
import { ErrorBanner } from './ErrorBanner';
import { haceCuanto } from '../lib/fechas';

const campoClases = 'rounded-sharp bg-graphite border-line focus-visible:ring-silver';
const botonPrincipal =
  'rounded-sharp bg-gradient-to-br from-silver via-silver-deep to-silver text-structural-black font-bold text-xs hover:brightness-110 focus-visible:ring-2 focus-visible:ring-silver';
const botonSecundario = 'rounded-sharp border border-line text-text-gray-light hover:text-white';

/**
 * Notas de estrategia del expediente: qué se piensa hacer y por qué. Son internas del estudio, nunca las ve el
 * cliente. Cualquiera del estudio las escribe y las edita; cada una muestra quién la escribió y cuándo se tocó.
 */
export function PanelEstrategia({ expedienteId }: { expedienteId: string }) {
  const [notas, setNotas] = useState<Estrategia[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editando, setEditando] = useState<string | 'nueva' | null>(null);

  const cargar = useCallback(() => {
    api
      .listar(expedienteId)
      .then((n) => {
        setNotas(n);
        setError(null);
      })
      .catch((e: Error) => setError(e.message));
  }, [expedienteId]);

  useEffect(cargar, [cargar]);

  return (
    <section className="superficie p-5" aria-labelledby="estrategia-titulo">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 id="estrategia-titulo" className="eyebrow text-silver">Estrategia</h2>
        {editando === null && (
          <Button variant="ghost" size="sm" className={botonSecundario} onClick={() => setEditando('nueva')}>
            + Nota
          </Button>
        )}
      </div>
      <p className="mb-3 text-xs text-text-gray-light">Interna del estudio: el cliente no la ve.</p>

      {error && <ErrorBanner message={error} />}

      {editando === 'nueva' && (
        <EditorNota
          alGuardar={async (titulo, contenido) => {
            await api.crear({ expediente_id: expedienteId, titulo, contenido });
            setEditando(null);
            cargar();
          }}
          alCancelar={() => setEditando(null)}
        />
      )}

      {notas !== null && notas.length === 0 && editando === null && (
        <p className="text-sm text-text-gray-light">Sin notas todavía. Anotá el plan, los riesgos o lo que no hay que olvidar.</p>
      )}

      <ul className="flex flex-col gap-3">
        {notas?.map((nota) =>
          editando === nota.id ? (
            <li key={nota.id}>
              <EditorNota
                inicial={nota}
                alGuardar={async (titulo, contenido) => {
                  await api.actualizar(nota.id, { titulo, contenido });
                  setEditando(null);
                  cargar();
                }}
                alCancelar={() => setEditando(null)}
              />
            </li>
          ) : (
            <li key={nota.id} className="border-t border-line pt-3 first:border-t-0 first:pt-0">
              <div className="text-sm font-bold text-white">{nota.titulo}</div>
              {nota.contenido && <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-silver-deep">{nota.contenido}</p>}
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-gray-light">
                <span>
                  {nota.autor || 'Sin autor'} · {nota.actualizado_en ? `editada ${haceCuanto(nota.actualizado_en)}` : haceCuanto(nota.creado_en)}
                </span>
                <button type="button" className="underline-offset-2 hover:text-white hover:underline" onClick={() => setEditando(nota.id)}>
                  Editar
                </button>
                <BotonEliminar
                  etiqueta="Borrar"
                  descripcion={`la nota "${nota.titulo}"`}
                  eliminar={() => api.eliminar(nota.id)}
                  alEliminar={cargar}
                  alFallar={setError}
                  className="h-auto border-0 bg-transparent p-0 text-xs text-text-gray-light hover:text-warning"
                />
              </div>
            </li>
          )
        )}
      </ul>
    </section>
  );
}

function EditorNota({
  inicial,
  alGuardar,
  alCancelar,
}: {
  inicial?: Estrategia;
  alGuardar: (titulo: string, contenido: string) => Promise<void>;
  alCancelar: () => void;
}) {
  const [titulo, setTitulo] = useState(inicial?.titulo ?? '');
  const [contenido, setContenido] = useState(inicial?.contenido ?? '');
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setOcupado(true);
    setError(null);
    try {
      await alGuardar(titulo.trim(), contenido.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar.');
      setOcupado(false);
    }
  }

  return (
    <form onSubmit={(e) => void enviar(e)} className="mb-3 flex flex-col gap-2">
      <label htmlFor={`nota-titulo-${inicial?.id ?? 'nueva'}`} className="sr-only">Título</label>
      <Input
        id={`nota-titulo-${inicial?.id ?? 'nueva'}`}
        className={campoClases}
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        placeholder="Título (ej.: Plan para la audiencia preliminar)"
        maxLength={200}
        required
        autoFocus
      />
      <label htmlFor={`nota-contenido-${inicial?.id ?? 'nueva'}`} className="sr-only">Contenido</label>
      <Textarea
        id={`nota-contenido-${inicial?.id ?? 'nueva'}`}
        className={`${campoClases} min-h-28`}
        value={contenido}
        onChange={(e) => setContenido(e.target.value)}
        placeholder="Qué hacer, por qué, riesgos, prueba pendiente…"
        maxLength={50000}
      />
      {error && <p className="text-xs text-warning">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" className={botonPrincipal} disabled={ocupado || titulo.trim() === ''}>
          {ocupado ? 'Guardando…' : 'Guardar'}
        </Button>
        <Button type="button" variant="ghost" size="sm" className={botonSecundario} onClick={alCancelar} disabled={ocupado}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
