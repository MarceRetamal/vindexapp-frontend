import { useState } from 'react';
import { RotateCcwIcon } from 'lucide-react';
import { api as demoApi } from '../api/demo';
import { salirDeDemo } from '../lib/demo';

/**
 * Franja fija mientras se está en la demostración: avisa que los datos son de ejemplo, permite volver a dejarlos como
 * al principio y salir. Aparece en todas las pantallas para que nadie confunda la demostración con el estudio real.
 */
export function BannerDemo() {
  const [restableciendo, setRestableciendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function restablecer() {
    setRestableciendo(true);
    setError(null);
    try {
      await demoApi.restablecer();
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron restablecer los datos.');
      setRestableciendo(false);
    }
  }

  return (
    <div role="status" className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-silver/25 bg-graphite-raised px-4 py-2.5 text-xs sm:px-6 md:px-12">
      <span className="eyebrow text-silver">Demostración</span>
      <span className="text-silver-deep">Datos de ejemplo: nada de lo que hagas acá toca tu estudio real.</span>
      {error && <span className="text-warning">{error}</span>}
      <span className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={restablecer}
          disabled={restableciendo}
          className="inline-flex h-8 items-center gap-1.5 rounded-sharp border border-line px-3 text-silver transition-colors hover:border-silver-deep hover:text-white disabled:opacity-60"
        >
          <RotateCcwIcon className="h-3.5 w-3.5" strokeWidth={1.8} />
          {restableciendo ? 'Restableciendo…' : 'Restablecer los datos'}
        </button>
        <button type="button" onClick={salirDeDemo} className="inline-flex h-8 items-center rounded-sharp border border-silver px-3 font-bold text-white transition-colors hover:bg-white/5">
          Salir de la demostración
        </button>
      </span>
    </div>
  );
}
