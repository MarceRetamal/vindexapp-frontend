import { useState } from 'react';
import { SparklesIcon } from 'lucide-react';
import { api, AVISO_IA, type AnalisisProveido as Analisis } from '../api/ia';
import { Button } from '@/componentes/ui/button';
import { haceCuanto } from '../lib/fechas';

const botonClases = 'rounded-sharp border border-line text-text-gray-light hover:text-white';

const URGENCIA: Record<Analisis['urgencia'], { texto: string; clase: string }> = {
  alta: { texto: 'Urgencia alta', clase: 'border-warning text-warning' },
  media: { texto: 'Urgencia media', clase: 'border-silver-deep text-silver' },
  baja: { texto: 'Sin urgencia', clase: 'border-line text-text-gray-light' },
};

function textoPlazo(p: Analisis['plazo']): string {
  if (p.dias === null || p.tipo === 'no_indica') return 'No indica plazo';
  return `${p.dias} días ${p.tipo === 'habiles' ? 'hábiles' : 'corridos'}`;
}

/**
 * Botón "Analizar con IA" de una novedad y el análisis: qué dispone, qué hay que hacer, plazo, normas y advertencias.
 * El análisis se guarda: la segunda vez se muestra sin volver a consultar (y sin costo).
 */
export function AnalisisProveido({ novedadId }: { novedadId: string }) {
  const [analisis, setAnalisis] = useState<{ datos: Analisis; creado_en: number } | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function analizar(rehacer = false) {
    setCargando(true);
    setError(null);
    try {
      const r = await api.analizarProveido(novedadId, rehacer);
      setAnalisis({ datos: r.analisis, creado_en: r.creado_en });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo analizar el proveído.');
    } finally {
      setCargando(false);
    }
  }

  if (!analisis) {
    return (
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" className={botonClases} onClick={() => void analizar()} disabled={cargando}>
          <SparklesIcon className="mr-1.5 size-3.5" aria-hidden />
          {cargando ? 'Analizando el proveído…' : 'Analizar con IA'}
        </Button>
        {error && <span className="text-xs text-warning">{error}</span>}
      </div>
    );
  }

  const a = analisis.datos;
  const urgencia = URGENCIA[a.urgencia];
  return (
    <section className="vidrio mt-3 rounded-sharp border border-line p-4" aria-label="Análisis del proveído">
      <div className="flex flex-wrap items-center gap-2">
        <SparklesIcon className="size-4 text-silver" aria-hidden />
        <span className="eyebrow text-silver">Análisis IA</span>
        <span className={`rounded-sharp border px-2 py-0.5 text-[11px] uppercase tracking-[0.08em] ${urgencia.clase}`}>{urgencia.texto}</span>
        <span className="text-xs text-text-gray-light">{haceCuanto(analisis.creado_en)}</span>
      </div>
      <p className="mt-2 text-sm font-bold text-white">{a.resumen}</p>
      <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-text-gray-light">Qué dispone</dt>
          <dd className="mt-0.5 text-silver">{a.que_dispone}</dd>
        </div>
        <div>
          <dt className="text-xs text-text-gray-light">Qué hay que hacer</dt>
          <dd className="mt-0.5 text-silver">{a.accion}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs text-text-gray-light">Plazo</dt>
          <dd className="mt-0.5 text-silver">
            <span className="font-bold text-white">{textoPlazo(a.plazo)}</span>. {a.plazo.fundamento}
          </dd>
        </div>
      </dl>
      {a.normas.length > 0 && (
        <div className="mt-3">
          <div className="text-xs text-text-gray-light">Normas citadas</div>
          <ul className="mt-1 flex flex-col gap-1 text-sm text-silver">
            {a.normas.map((n, i) => (
              <li key={i}>
                <span className="font-bold text-white">{n.cita}</span>: {n.contenido}{' '}
                {!n.verificada && <span className="text-xs text-warning">[No verificado]</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
      {a.advertencias.length > 0 && (
        <div className="mt-3">
          <div className="text-xs text-text-gray-light">Advertencias</div>
          <ul className="mt-1 list-disc pl-5 text-sm text-silver">
            {a.advertencias.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
        <p className="text-xs text-text-gray-light">{AVISO_IA} El vencimiento exacto lo calcula Plazos.</p>
        <Button variant="ghost" size="sm" className={botonClases} onClick={() => void analizar(true)} disabled={cargando}>
          {cargando ? 'Analizando…' : 'Volver a analizar'}
        </Button>
      </div>
      {error && <p className="mt-2 text-xs text-warning">{error}</p>}
    </section>
  );
}
