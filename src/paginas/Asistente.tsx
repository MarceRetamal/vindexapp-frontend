import { useEffect, useRef, useState } from 'react';
import { CopyIcon, SparklesIcon } from 'lucide-react';
import { api, AVISO_IA, type EstadoIa, type MensajeConsulta } from '../api/ia';
import { api as apiExpedientes, type Expediente } from '../api/expedientes';
import { PageHeader } from '../componentes/PageHeader';
import { ErrorBanner } from '../componentes/ErrorBanner';
import { Button } from '@/componentes/ui/button';
import { Textarea } from '@/componentes/ui/textarea';

const campoClases = 'rounded-sharp bg-graphite border-line focus-visible:ring-silver';
const botonPrincipal =
  'rounded-sharp bg-gradient-to-br from-silver via-silver-deep to-silver text-structural-black font-bold uppercase tracking-[0.08em] text-xs hover:brightness-110 focus-visible:ring-2 focus-visible:ring-silver';
const botonSecundario = 'rounded-sharp border border-line text-text-gray-light hover:text-white';

/**
 * Consulta libre con la IA: preguntas jurídicas generales o sobre un expediente (con sus datos anonimizados como
 * contexto). La conversación vive en la pantalla: no se guarda como historial.
 */
export function Asistente() {
  const [estado, setEstado] = useState<EstadoIa | null>(null);
  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  const [expedienteId, setExpedienteId] = useState('');
  const [mensajes, setMensajes] = useState<MensajeConsulta[]>([]);
  const [borrador, setBorrador] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fin = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.estado().then(setEstado).catch(() => setEstado(null));
    apiExpedientes
      .listarExpedientes()
      .then((lista) => setExpedientes(lista.filter((e) => !e.baja)))
      .catch(() => setExpedientes([]));
  }, []);

  useEffect(() => {
    fin.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [mensajes, cargando]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const texto = borrador.trim();
    if (!texto) return;
    const nuevos: MensajeConsulta[] = [...mensajes, { rol: 'abogado', texto }];
    setMensajes(nuevos);
    setBorrador('');
    setCargando(true);
    setError(null);
    try {
      const r = await api.consulta(nuevos.slice(-20), expedienteId || undefined);
      setMensajes([...nuevos, { rol: 'ia', texto: r.texto }]);
      api.estado().then(setEstado).catch(() => undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo consultar.');
      setMensajes(mensajes);
      setBorrador(texto);
    } finally {
      setCargando(false);
    }
  }

  function nueva() {
    setMensajes([]);
    setError(null);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Causas"
        title="Asistente"
        descripcion="Consultas jurídicas con inteligencia artificial. Si elegís un expediente, usa sus datos (anonimizados) como contexto."
      />

      {estado && !estado.habilitada && (
        <ErrorBanner message="La inteligencia artificial todavía no está habilitada en el sistema. Avisale al administrador." />
      )}

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1">
          <label htmlFor="asistente-expediente" className="text-xs text-text-gray-light">Expediente (opcional)</label>
          <select
            id="asistente-expediente"
            className={`${campoClases} mt-1 h-9 w-full border px-2 text-sm text-white`}
            value={expedienteId}
            onChange={(e) => setExpedienteId(e.target.value)}
            disabled={mensajes.length > 0}
          >
            <option value="">Consulta general, sin expediente</option>
            {expedientes.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.caratula}
                {ex.numero ? ` (${ex.numero})` : ''}
              </option>
            ))}
          </select>
        </div>
        {mensajes.length > 0 && (
          <Button variant="ghost" size="sm" className={botonSecundario} onClick={nueva} disabled={cargando}>
            Nueva consulta
          </Button>
        )}
      </div>

      <div className="superficie flex flex-col gap-4 p-4 sm:p-6">
        {mensajes.length === 0 && (
          <p className="text-sm text-text-gray-light">
            Escribí tu consulta. Por ejemplo: qué plazo hay para apelar una sentencia definitiva en el fuero civil de la Provincia, o cómo
            plantear una caducidad de instancia en esta causa.
          </p>
        )}
        {mensajes.map((m, i) => (
          <div key={i} className={m.rol === 'abogado' ? 'self-end max-w-[85%]' : 'max-w-full'}>
            {m.rol === 'abogado' ? (
              <div className="rounded-sharp border border-line bg-graphite px-3 py-2 text-sm text-white whitespace-pre-wrap">{m.texto}</div>
            ) : (
              <div className="vidrio rounded-sharp border border-line p-4">
                <div className="mb-2 flex items-center gap-2">
                  <SparklesIcon className="size-3.5 text-silver" aria-hidden />
                  <span className="eyebrow text-silver">IA</span>
                  <button
                    type="button"
                    className="ml-auto text-xs text-text-gray-light hover:text-white"
                    onClick={() => void navigator.clipboard.writeText(m.texto).catch(() => undefined)}
                    aria-label="Copiar respuesta"
                  >
                    <CopyIcon className="size-3.5" aria-hidden />
                  </button>
                </div>
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-silver">{m.texto}</div>
              </div>
            )}
          </div>
        ))}
        {cargando && <p className="text-sm text-text-gray-light">Pensando… puede tardar un minuto.</p>}
        <div ref={fin} />
      </div>

      {error && <ErrorBanner message={error} />}

      <form onSubmit={(e) => void enviar(e)} className="mt-4 flex flex-col gap-2">
        <label htmlFor="asistente-consulta" className="sr-only">Tu consulta</label>
        <Textarea
          id="asistente-consulta"
          className={`${campoClases} min-h-24`}
          value={borrador}
          onChange={(e) => setBorrador(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) void enviar(e);
          }}
          placeholder="Tu consulta (Ctrl + Enter para enviar)"
          maxLength={8000}
          disabled={cargando}
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-text-gray-light">
            {AVISO_IA}
            {estado && ` Uso del mes: USD ${estado.consumo_mes_usd.toFixed(2)} de ${estado.tope_mes_usd}.`}
          </p>
          <Button type="submit" className={botonPrincipal} disabled={cargando || borrador.trim() === '' || mensajes.length >= 19}>
            Consultar
          </Button>
        </div>
      </form>
    </div>
  );
}
