import { pedido } from './http';

/** Nota interna de estrategia de un expediente. Nunca llega al cliente. */
export interface Estrategia {
  id: string;
  expediente_id: string;
  titulo: string;
  contenido: string | null;
  creado_en: number;
  actualizado_en: number | null;
  /** Nombre de quien la creó. */
  autor: string;
}

export const api = {
  listar: (expedienteId: string) => pedido<Estrategia[]>(`/estrategias?expediente_id=${encodeURIComponent(expedienteId)}`),
  crear: (datos: { expediente_id: string; titulo: string; contenido?: string }) =>
    pedido<Estrategia>('/estrategias', { method: 'POST', body: JSON.stringify(datos) }),
  actualizar: (id: string, cambios: { titulo?: string; contenido?: string }) =>
    pedido<Estrategia>(`/estrategias/${id}`, { method: 'PATCH', body: JSON.stringify(cambios) }),
  eliminar: (id: string) => pedido<{ id: string; eliminado: true }>(`/estrategias/${id}`, { method: 'DELETE' }),
};
