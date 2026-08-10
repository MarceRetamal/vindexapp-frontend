import { ESTUDIO_ID, pedido } from './http';

export interface Cliente {
  id: string;
  nombre: string;
  apellido: string;
  dni: string | null;
  domicilio: string | null;
  localidad: string | null;
  telefono_fijo: string | null;
  whatsapp: string | null;
  email: string | null;
  estado: 'Activo' | 'Potencial' | 'Inactivo';
  notas: string | null;
  creado_en: number;
}

export interface DatosCliente {
  nombre: string;
  apellido: string;
  dni?: string;
  domicilio?: string;
  localidad?: string;
  telefono_fijo?: string;
  whatsapp?: string;
  email?: string;
  estado?: Cliente['estado'];
  notas?: string;
}

export const api = {
  listarClientes: () => pedido<Cliente[]>(`/clientes?estudio_id=${ESTUDIO_ID}`),

  obtenerCliente: (id: string) => pedido<Cliente>(`/clientes/${id}`),

  crearCliente: (datos: DatosCliente) =>
    pedido<{ id: string }>('/clientes', {
      method: 'POST',
      body: JSON.stringify({ estudio_id: ESTUDIO_ID, ...datos }),
    }),

  actualizarCliente: (id: string, datos: Partial<DatosCliente>) =>
    pedido<Cliente>(`/clientes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(datos),
    }),
};
