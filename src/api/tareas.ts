import { ESTUDIO_ID, pedido } from './http';

export interface Tarea {
  id: string;
  estudio_id: string;
  expediente_id: string;
  titulo: string;
  descripcion: string | null;
  estado: 'Pendiente' | 'En curso' | 'Completada';
  fecha_limite: string | null;
  asignado_a: string | null;
  creado_por: string | null;
  creado_en: number;
  completado_en: number | null;
}

export const api = {
  listarTareas: (expedienteId: string) =>
    pedido<Tarea[]>(`/tareas?expediente_id=${expedienteId}`),

  crearTarea: (datos: {
    expediente_id: string;
    titulo: string;
    descripcion?: string;
    fecha_limite?: string;
    asignado_a?: string;
  }) =>
    pedido<{ id: string; titulo: string }>('/tareas', {
      method: 'POST',
      body: JSON.stringify({ estudio_id: ESTUDIO_ID, ...datos }),
    }),

  cambiarEstadoTarea: (id: string, estado: Tarea['estado']) =>
    pedido<{ id: string; estado: string }>(`/tareas/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ estado }),
    }),

  eliminarTarea: (id: string) =>
    pedido<{ id: string }>(`/tareas/${id}`, {
      method: 'DELETE',
    }),
};
