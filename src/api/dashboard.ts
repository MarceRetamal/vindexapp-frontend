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

export type ClaseItemDia = 'tarea' | 'audiencia' | 'plazo';

/** Una cosa que el abogado tiene encima: tarea, audiencia o vencimiento de una actuación. */
export interface ItemDia {
  clave: string;
  clase: ClaseItemDia;
  id: string;
  titulo: string;
  /** AAAA-MM-DD */
  fecha: string;
  hora: string | null;
  /** Días desde hoy: negativo = vencida, 0 = hoy. */
  dias: number;
  expediente_id: string | null;
  caratula: string | null;
  cliente: string | null;
  detalle: string | null;
}

export interface AgendaDia {
  hoy: string;
  items: ItemDia[];
  resumen: { vencidas: number; hoy: number; proximas: number; total: number };
}

export const apiAgenda = {
  obtenerAgenda: (dias = 14) => pedido<AgendaDia>(`/dashboard/agenda?dias=${dias}`),
};
