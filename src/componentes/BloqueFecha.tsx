import { diaYMes } from '../lib/fechas';

/**
 * Cuadro de fecha de un vencimiento, audiencia o tarea. El color dice la urgencia: terracota si ya venció, metálico de
 * marca si es hoy (con la hora si la tiene), plata si faltan hasta dos días y apagado si falta más.
 */
export function BloqueFecha({ fecha, dias, hora }: { fecha: string; dias: number; hora?: string | null }) {
  const { dia, mes } = diaYMes(fecha);
  const clases =
    dias < 0
      ? 'border-warning/60 bg-warning/10 text-warning'
      : dias === 0
        ? 'border-transparent bg-gradient-to-br from-silver via-silver-deep to-silver text-structural-black'
        : dias <= 2
          ? 'border-silver/50 text-white'
          : 'border-line text-silver-deep';
  const conHora = dias === 0 && !!hora;
  return (
    <div className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-md border leading-none ${clases}`} aria-hidden="true">
      <span className="text-[10px] font-bold tracking-[0.14em]">{dias === 0 ? 'HOY' : mes}</span>
      <span className={`mt-1 font-bold tabular-nums ${conHora ? 'text-[17px]' : 'text-[22px]'}`}>{conHora ? hora : dia}</span>
    </div>
  );
}
