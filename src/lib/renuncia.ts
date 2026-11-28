import { api, type ResultadoRenuncia } from '../api/expedientes';

/**
 * Pide confirmación y, si el abogado acepta, registra la renuncia al patrocinio de la causa. Devuelve null si cancela.
 * El texto dice exactamente qué pasa: es una acción que borra tareas automáticas y deja de avisar.
 */
export async function pedirRenuncia(expedienteId: string, caratula: string | null): Promise<ResultadoRenuncia | null> {
  const causa = caratula ? `"${caratula}"` : 'esta causa';
  const confirmado = window.confirm(
    `Vas a dejar de intervenir en ${causa}.\n\n` +
      'El sistema deja de seguirla: sus novedades pendientes pasan a revisadas, se borran las tareas que el sistema creó solo, ' +
      'y lo que siga llegando del portal no te va a avisar ni va a crear plazos. Las tareas que cargaste vos quedan. ' +
      'La causa pasa a Archivados y la podés reactivar cuando quieras.\n\n¿Confirmás la renuncia?'
  );
  if (!confirmado) return null;
  return api.renunciarExpediente(expedienteId);
}

export function resumenRenuncia(r: ResultadoRenuncia): string {
  const novedades = r.novedades_descartadas === 1 ? '1 novedad pasó a revisada' : `${r.novedades_descartadas} novedades pasaron a revisadas`;
  const tareas =
    r.tareas_automaticas_borradas === 0
      ? 'no había tareas automáticas'
      : r.tareas_automaticas_borradas === 1
        ? 'se borró 1 tarea automática'
        : `se borraron ${r.tareas_automaticas_borradas} tareas automáticas`;
  return `Listo: el sistema dejó de seguir la causa. ${novedades} y ${tareas}.`;
}
