import { ESTUDIO_ID, pedido } from './http';
import type { Audiencia } from './audiencias';
import type { ActuacionConVencimiento } from './actuaciones';
import type { Tarea } from './tareas';

export interface AudienciaProxima extends Audiencia {
  expediente_caratula: string;
}

export interface TareaProxima extends Tarea {
  expediente_caratula: string;
}

export interface Dashboard {
  proximasAudiencias: AudienciaProxima[];
  vencimientosProximos: ActuacionConVencimiento[];
  tareasPendientes: {
    total: number;
    proximas: TareaProxima[];
  };
  expedientesActivos: number;
}

export const api = {
  obtenerDashboard: () => pedido<Dashboard>(`/dashboard?estudio_id=${ESTUDIO_ID}`),
};
