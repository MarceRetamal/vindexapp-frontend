import { useState } from 'react';
import { ShieldCheckIcon } from 'lucide-react';
import { api, type Tarea } from '../api/tareas';

interface Calculo {
  regimen?: string;
  dias?: number;
  cita?: string | null;
  fecha_notificacion?: string;
  normas?: string[];
  advertencias?: string[];
}

function leer(calculo: string | null | undefined): Calculo | null {
  if (!calculo) return null;
  try {
    return JSON.parse(calculo) as Calculo;
  } catch {
    return null;
  }
}

function fecha(iso: string | undefined): string {
  if (!iso) return '';
  const [a, m, d] = iso.split('-');
  return `${d ?? ''}/${m ?? ''}/${a ?? ''}`;
}

/**
 * Tarea creada sola a partir de un proveído: muestra de dónde salió el vencimiento (lo que dijo el proveído, la
 * notificación, el código y las normas) y deja marcarla como verificada. Mientras no se verifica, se ve en naranja.
 */
export function VerificarPlazo({ tarea, onCambio }: { tarea: Pick<Tarea, 'id' | 'automatica' | 'verificada_en' | 'calculo'>; onCambio: () => void }) {
  const [abierto, setAbierto] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  if (tarea.automatica !== 1) return null;
  const verificada = tarea.verificada_en != null;
  const c = leer(tarea.calculo);

  async function marcar(v: boolean) {
    setOcupado(true);
    try {
      await api.verificarTarea(tarea.id, v);
      onCambio();
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className={`mt-1.5 rounded-sharp border px-2.5 py-1.5 text-xs ${verificada ? 'border-line text-text-gray-light' : 'border-warning/50 bg-warning/5 text-warning'}`}>
      <div className="flex flex-wrap items-center gap-2">
        <ShieldCheckIcon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} aria-hidden="true" />
        <span>{verificada ? 'Vencimiento calculado automáticamente · verificado' : 'Vencimiento calculado automáticamente · falta verificarlo'}</span>
        <button type="button" onClick={() => setAbierto((v) => !v)} className="underline-offset-2 hover:underline">
          {abierto ? 'Ocultar cálculo' : 'Ver cálculo'}
        </button>
        <button
          type="button"
          disabled={ocupado}
          onClick={() => void marcar(!verificada)}
          className={`ml-auto rounded-sharp border px-2 py-0.5 font-bold ${verificada ? 'border-line text-silver-deep hover:text-white' : 'border-warning text-warning hover:bg-warning/10'}`}
        >
          {verificada ? 'Desmarcar' : 'Está bien, verificado'}
        </button>
      </div>
      {abierto && c && (
        <div className="mt-2 space-y-1 text-[12px] leading-relaxed text-silver">
          {c.cita && <p>Proveído: “{c.cita}”</p>}
          <p>
            Notificación: {fecha(c.fecha_notificacion)} · {c.dias} días · {c.regimen === 'cpp' ? 'CPP (Ley 11.922)' : 'CPCC PBA'}
          </p>
          {c.normas && c.normas.length > 0 && <p>Normas: {c.normas.join('; ')}</p>}
          {c.advertencias && c.advertencias.length > 0 && <p className="text-warning">Atención: {c.advertencias.join(' ')}</p>}
          <p className="text-text-gray-light">Si la fecha no es correcta, editala: al corregirla queda verificada.</p>
        </div>
      )}
    </div>
  );
}
