import { ESTUDIO_ID, pedido } from './http';

export interface Actuacion {
  id: string;
  estudio_id: string;
  expediente_id: string;
  tipo: string;
  fecha: string;
  detalle_interno: string | null;
  texto_cliente: string | null;
  visible: number;
  hito: number;
  notificado: number;
  creado_por: string | null;
  creado_en: number;
}

export const api = {
  listarActuaciones: (expedienteId: string) =>
    pedido<Actuacion[]>(`/actuaciones?expediente_id=${expedienteId}`),

  crearActuacion: (datos: {
    expediente_id: string;
    tipo: string;
    fecha: string;
    detalle_interno?: string;
    texto_cliente?: string;
    visible?: boolean;
    hito?: boolean;
  }) =>
    pedido<{ id: string; tipo: string; fecha: string }>('/actuaciones', {
      method: 'POST',
      body: JSON.stringify({ estudio_id: ESTUDIO_ID, ...datos }),
    }),

  notificarActuacion: (id: string) =>
    pedido<{ id: string; notificado: boolean }>(`/actuaciones/${id}/notificar`, {
      method: 'PATCH',
    }),
};
