import { ESTUDIO_ID, pedido } from './http';

export interface Cliente {
  id: string;
  nombre: string;
  apellido: string;
  dni: string | null;
  whatsapp: string | null;
  email: string | null;
  estado: 'Activo' | 'Potencial' | 'Inactivo';
  creado_en: number;
}

export const api = {
  listarClientes: () => pedido<Cliente[]>(`/clientes?estudio_id=${ESTUDIO_ID}`),

  crearCliente: (datos: {
    nombre: string;
    apellido: string;
    dni?: string;
    whatsapp?: string;
    email?: string;
  }) =>
    pedido<{ id: string }>('/clientes', {
      method: 'POST',
      body: JSON.stringify({ estudio_id: ESTUDIO_ID, ...datos }),
    }),
};
