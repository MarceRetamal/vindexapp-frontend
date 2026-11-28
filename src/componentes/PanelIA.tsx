import { useState } from 'react';
import { CopyIcon, SparklesIcon } from 'lucide-react';
import { api, AVISO_IA } from '../api/ia';
import { api as apiEstrategias } from '../api/estrategias';
import { Button } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
import { Textarea } from '@/componentes/ui/textarea';

const campoClases = 'rounded-sharp bg-graphite border-line focus-visible:ring-silver';
const botonPrincipal =
  'rounded-sharp bg-gradient-to-br from-silver via-silver-deep to-silver text-structural-black font-bold text-xs hover:brightness-110 focus-visible:ring-2 focus-visible:ring-silver';
const botonSecundario = 'rounded-sharp border border-line text-text-gray-light hover:text-white';

type Modo = 'estrategia' | 'escrito';

/**
 * Inteligencia artificial sobre el expediente: análisis estratégico (con el protocolo del estudio) o borrador de un
 * escrito. Usa los datos del expediente, sus novedades, actuaciones y notas, anonimizados antes de salir. El resultado
 * es una propuesta: se copia o se guarda como nota de Estrategia, nunca va solo a ningún lado.
 */
export function PanelIA({ expedienteId, alGuardarNota }: { expedienteId: string; alGuardarNota?: () => void }) {
  const [modo, setModo] = useState<Modo>('estrategia');
  const [pregunta, setPregunta] = useState('');
  const [tipoEscrito, setTipoEscrito] = useState('');
  const [instrucciones, setInstrucciones] = useState('');
  const [resultado, setResultado] = useState<{ modo: Modo; texto: string; anonimizados: number } | null>(null);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState<{ texto: string; tipo: 'ok' | 'error' } | null>(null);

  async function generar(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setMensaje(null);
    try {
      const r =
        modo === 'estrategia'
          ? await api.estrategia(expedienteId, pregunta.trim() || undefined)
          : await api.escrito(expedienteId, tipoEscrito.trim(), instrucciones.trim() || undefined);
      setResultado({ modo, texto: r.texto, anonimizados: r.anonimizados });
    } catch (err) {
      setMensaje({ texto: err instanceof Error ? err.message : 'No se pudo generar.', tipo: 'error' });
    } finally {
      setCargando(false);
    }
  }

  async function copiar() {
    if (!resultado) return;
    try {
      await navigator.clipboard.writeText(resultado.texto);
      setMensaje({ texto: 'Copiado.', tipo: 'ok' });
    } catch {
      setMensaje({ texto: 'No se pudo copiar: seleccioná el texto a mano.', tipo: 'error' });
    }
  }

  async function guardarComoNota() {
    if (!resultado) return;
    const titulo =
      resultado.modo === 'estrategia'
        ? `Análisis IA${pregunta.trim() ? `: ${pregunta.trim()}` : ''}`
        : `Borrador IA: ${tipoEscrito.trim()}`;
    try {
      await apiEstrategias.crear({ expediente_id: expedienteId, titulo: titulo.slice(0, 200), contenido: resultado.texto });
      setMensaje({ texto: 'Guardado en Estrategia.', tipo: 'ok' });
      alGuardarNota?.();
    } catch (err) {
      setMensaje({ texto: err instanceof Error ? err.message : 'No se pudo guardar.', tipo: 'error' });
    }
  }

  return (
    <section className="superficie p-5" aria-labelledby="ia-titulo">
      <div className="mb-3 flex items-center gap-2">
        <SparklesIcon className="size-4 text-silver" aria-hidden />
        <h2 id="ia-titulo" className="eyebrow text-silver">Inteligencia artificial</h2>
      </div>
      <div className="mb-3 flex gap-1" role="tablist" aria-label="Qué querés que haga la IA">
        {(['estrategia', 'escrito'] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={modo === m}
            onClick={() => setModo(m)}
            className={`rounded-sharp border px-3 py-1.5 text-xs ${modo === m ? 'border-silver text-white' : 'border-line text-text-gray-light hover:text-white'}`}
          >
            {m === 'estrategia' ? 'Análisis estratégico' : 'Borrador de escrito'}
          </button>
        ))}
      </div>

      <form onSubmit={(e) => void generar(e)} className="flex flex-col gap-2">
        {modo === 'estrategia' ? (
          <>
            <label htmlFor="ia-pregunta" className="text-xs text-text-gray-light">Qué querés decidir (opcional)</label>
            <Textarea
              id="ia-pregunta"
              className={`${campoClases} min-h-16`}
              value={pregunta}
              onChange={(e) => setPregunta(e.target.value)}
              placeholder="Ej.: ¿apelo la resolución o pido aclaratoria?"
              maxLength={4000}
            />
          </>
        ) : (
          <>
            <label htmlFor="ia-tipo" className="text-xs text-text-gray-light">Qué escrito</label>
            <Input
              id="ia-tipo"
              className={campoClases}
              value={tipoEscrito}
              onChange={(e) => setTipoEscrito(e.target.value)}
              placeholder="Ej.: contesta traslado de la liquidación"
              maxLength={200}
              required
            />
            <label htmlFor="ia-instrucciones" className="text-xs text-text-gray-light">Instrucciones (opcional)</label>
            <Textarea
              id="ia-instrucciones"
              className={`${campoClases} min-h-16`}
              value={instrucciones}
              onChange={(e) => setInstrucciones(e.target.value)}
              placeholder="Qué argumentar, qué pedir, qué prueba ofrecer"
              maxLength={4000}
            />
          </>
        )}
        <div>
          <Button type="submit" size="sm" className={botonPrincipal} disabled={cargando || (modo === 'escrito' && tipoEscrito.trim() === '')}>
            {cargando ? 'Pensando… puede tardar un minuto' : modo === 'estrategia' ? 'Analizar la causa' : 'Redactar borrador'}
          </Button>
        </div>
      </form>

      {resultado && (
        <div className="mt-4 border-t border-line pt-4">
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-silver">{resultado.texto}</div>
          <p className="mt-3 text-xs text-text-gray-light">
            {AVISO_IA} Se reemplazaron {resultado.anonimizados} datos personales antes de enviar; un nombre que no figura en la carátula puede no haberse ocultado.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="ghost" size="sm" className={botonSecundario} onClick={() => void copiar()}>
              <CopyIcon className="mr-1.5 size-3.5" aria-hidden />
              Copiar
            </Button>
            <Button variant="ghost" size="sm" className={botonSecundario} onClick={() => void guardarComoNota()}>
              Guardar en Estrategia
            </Button>
          </div>
        </div>
      )}
      {mensaje && <p className={`mt-2 text-xs ${mensaje.tipo === 'ok' ? 'text-success' : 'text-warning'}`}>{mensaje.texto}</p>}
    </section>
  );
}
