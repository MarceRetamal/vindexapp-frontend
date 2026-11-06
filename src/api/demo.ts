import { pedido } from './http';

export interface EstadoDemo {
  existe: boolean;
  activa: boolean;
  puede_gestionar: boolean;
}

export const api = {
  estado: () => pedido<EstadoDemo>('/demo/estado'),
  /** Prepara la demostración o la restablece: borra los datos de ejemplo y los vuelve a armar con las fechas de hoy. */
  restablecer: () => pedido<{ estudio_id: string; creado: boolean; resumen: Record<string, number> }>('/demo/restablecer', { method: 'POST' }),
};
