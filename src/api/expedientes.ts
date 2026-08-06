import { ESTUDIO_ID, pedido } from './http';

export interface Expediente {
  id: string;
  estudio_id: string;
  cliente_id: string;
  caratula: string;
  numero: string | null;
  fuero: string | null;
  juzgado: string | null;
  departamento: string | null;
  rol_procesal: string | null;
  estado: string;
  inicio: string | null;
  baja: string | null;
  motivo_baja: string | null;
  notas: string | null;
  creado_en: number;
  cliente_nombre: string;
  cliente_apellido: string;
}

export const api = {
  listarExpedientes: () => pedido<Expediente[]>(`/expedientes?estudio_id=${ESTUDIO_ID}`),

  obtenerExpediente: (id: string) =>
    pedido<Expediente>(`/expedientes/${id}?estudio_id=${ESTUDIO_ID}`),

  crearExpediente: (datos: {
    cliente_id: string;
    caratula: string;
    numero?: string;
    fuero?: string;
    juzgado?: string;
    departamento?: string;
    rol_procesal?: string;
    inicio?: string;
    notas?: string;
  }) =>
    pedido<{ id: string }>('/expedientes', {
      method: 'POST',
      body: JSON.stringify({ estudio_id: ESTUDIO_ID, ...datos }),
    }),
};
