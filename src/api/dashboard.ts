import { ESTUDIO_ID, pedido } from './http';
import type { Audiencia } from './audiencias';
import type { ActuacionConVencimiento } from './actuaciones';
import type { Tarea } from './tareas';

export interface AudienciaProxima extends Audiencia {
  expediente_caratula: string;
}

/** Una tarea extrajudicial (llamado, mail, acuerdo) no tiene expediente: los dos campos vienen en null. */
export interface TareaProxima extends Omit<Tarea, 'expediente_id'> {
  expediente_id: string | null;
  expediente_caratula: string | null;
}

export interface Dashboard {
  proximasAudiencias: AudienciaProxima[];
  vencimientosProximos: ActuacionConVencimiento[];
  tareasPendientes: {
    total: number;
    proximas: TareaProxima[];
  };
  expedientesActivos: number;
  novedadesPendientes: number;
}

export const api = {
  obtenerDashboard: () => pedido<Dashboard>(`/dashboard?estudio_id=${ESTUDIO_ID}`),
};
