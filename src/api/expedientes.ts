import { ESTUDIO_ID, pedido } from './http';

/** Papel del abogado en el expediente. null = sin definir. */
export type RolProfesional = 'particular' | 'deas' | 'asesor_incapaces';

export interface Expediente {
  id: string;
  estudio_id: string;
  /** null = expediente creado desde el portal, todavía sin cliente asignado. */
  cliente_id: string | null;
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
  cliente_nombre: string | null;
  cliente_apellido: string | null;
  rol_profesional: RolProfesional | null;
  origen: 'manual' | 'portal';
  /** Solo en el listado: causas del portal vinculadas y novedades suyas sin revisar. */
  causas_portal?: number;
  novedades_pendientes?: number;
}

export const api = {
  listarExpedientes: () => pedido<Expediente[]>(`/expedientes?estudio_id=${ESTUDIO_ID}`),

  listarDeCliente: (clienteId: string) => pedido<Expediente[]>(`/expedientes?cliente_id=${encodeURIComponent(clienteId)}`),

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
    rol_profesional?: RolProfesional | null;
  }) =>
    pedido<{ id: string }>('/expedientes', {
      method: 'POST',
      body: JSON.stringify({ estudio_id: ESTUDIO_ID, ...datos }),
    }),

  editarExpediente: (
    id: string,
    datos: {
      caratula?: string;
      numero?: string;
      fuero?: string;
      juzgado?: string;
      departamento?: string;
      rol_procesal?: string;
      notas?: string;
      cliente_id?: string | null;
      rol_profesional?: RolProfesional | null;
    }
  ) =>
    pedido<Expediente>(`/expedientes/${id}?estudio_id=${ESTUDIO_ID}`, {
      method: 'PATCH',
      body: JSON.stringify(datos),
    }),

  darDeBajaExpediente: (id: string, motivo?: string) =>
    pedido<Expediente>(`/expedientes/${id}/baja?estudio_id=${ESTUDIO_ID}`, {
      method: 'PATCH',
      body: JSON.stringify({ motivo }),
    }),

  reactivarExpediente: (id: string) =>
    pedido<Expediente>(`/expedientes/${id}/reactivar?estudio_id=${ESTUDIO_ID}`, {
      method: 'PATCH',
    }),

  /** Con `conContenido` borra también todo lo que cuelga del expediente (la API lo exige como confirmación). */
  eliminarExpediente: (id: string, conContenido = false) =>
    pedido<{ id: string; eliminado: true }>(`/expedientes/${id}${conContenido ? '?con_contenido=1' : ''}`, {
      method: 'DELETE',
    }),
};
