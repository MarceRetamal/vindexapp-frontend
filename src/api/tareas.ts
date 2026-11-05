import { ESTUDIO_ID, pedido } from './http';

export interface Tarea {
  id: string;
  estudio_id: string;
  expediente_id: string;
  cliente_id?: string | null;
  tipo?: string | null;
  titulo: string;
  descripcion: string | null;
  estado: 'Pendiente' | 'En curso' | 'Completada';
  fecha_limite: string | null;
  asignado_a: string | null;
  creado_por: string | null;
  creado_en: number;
  completado_en: number | null;
}

/** Tarea de la pantalla Tareas: judicial (con expediente) o extrajudicial (sin expediente). */
export interface TareaListado extends Omit<Tarea, 'expediente_id'> {
  expediente_id: string | null;
  expediente_caratula: string | null;
  cliente_nombre: string | null;
  cliente_apellido: string | null;
}

export interface DatosTareaExtrajudicial {
  titulo: string;
  tipo?: string;
  cliente_id?: string;
  fecha_limite?: string;
  descripcion?: string;
}

export const api = {
  listarTodas: () => pedido<TareaListado[]>('/tareas?todas=1'),

  crearTareaExtrajudicial: (datos: DatosTareaExtrajudicial) =>
    pedido<{ id: string; titulo: string }>('/tareas', {
      method: 'POST',
      body: JSON.stringify(datos),
    }),

  /** Un campo en null o '' se vacía; el título no puede quedar vacío. */
  editarTarea: (
    id: string,
    datos: { titulo?: string; tipo?: string | null; cliente_id?: string | null; fecha_limite?: string | null; descripcion?: string | null }
  ) =>
    pedido<Tarea>(`/tareas/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(datos),
    }),

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
