import { ESTUDIO_ID, pedido } from './http';

export interface Audiencia {
  id: string;
  estudio_id: string;
  expediente_id: string;
  tipo: string;
  fecha: string;
  hora: string | null;
  modalidad: 'Presencial' | 'Videoconferencia' | 'Telefónica' | null;
  lugar: string | null;
  estado: 'Programada' | 'Realizada' | 'Suspendida' | 'Cancelada';
  recordatorio: number;
  recordatorio_enviado: number;
  creado_en: number;
}

export const api = {
  listarAudiencias: () => pedido<Audiencia[]>(`/audiencias?estudio_id=${ESTUDIO_ID}`),

  crearAudiencia: (datos: {
    expediente_id: string;
    tipo: string;
    fecha: string;
    hora?: string;
    modalidad?: 'Presencial' | 'Videoconferencia' | 'Telefónica';
    lugar?: string;
  }) =>
    pedido<{ id: string; tipo: string; fecha: string; estado: string }>('/audiencias', {
      method: 'POST',
      body: JSON.stringify({ estudio_id: ESTUDIO_ID, ...datos }),
    }),

  cambiarEstado: (id: string, estado: 'Realizada' | 'Suspendida' | 'Cancelada') =>
    pedido<{ id: string; estado: string }>(`/audiencias/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ estado }),
    }),
};
