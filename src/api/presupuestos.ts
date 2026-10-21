import { ESTUDIO_ID, pedido } from './http';

export interface Presupuesto {
  id: string;
  estudio_id: string;
  cliente_id: string | null;
  contacto_nombre: string | null;
  contacto_telefono: string | null;
  expediente_id: string | null;
  documento_id: string | null;
  concepto: string;
  monto: number; // centavos
  estado: 'borrador' | 'enviado' | 'firmado' | 'rechazado' | 'vencido';
  fecha_emision: string | null;
  fecha_firma: string | null;
  creado_en: number;
}

export const api = {
  listarPresupuestos: () => pedido<Presupuesto[]>(`/presupuestos?estudio_id=${ESTUDIO_ID}`),

  crearPresupuesto: (datos: {
    cliente_id?: string;
    contacto_nombre?: string;
    contacto_telefono?: string;
    concepto: string;
    monto: number; // centavos
  }) =>
    pedido<{ id: string; estado: string }>('/presupuestos', {
      method: 'POST',
      body: JSON.stringify({ estudio_id: ESTUDIO_ID, ...datos }),
    }),

  editarPresupuesto: (
    id: string,
    datos: {
      concepto?: string;
      monto?: number; // centavos
      contacto_nombre?: string;
      contacto_telefono?: string;
    }
  ) =>
    pedido<Presupuesto>(`/presupuestos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(datos),
    }),

  /** Un presupuesto firmado solo se elimina con `confirmarFirmado` (la API lo exige y pide rol titular). */
  eliminarPresupuesto: (id: string, confirmarFirmado = false) =>
    pedido<{ id: string; eliminado: boolean }>(`/presupuestos/${id}${confirmarFirmado ? '?confirmar_firmado=1' : ''}`, {
      method: 'DELETE',
    }),

  cambiarEstado: (id: string, estado: 'enviado' | 'rechazado' | 'vencido') =>
    pedido<{ id: string; estado: string }>(`/presupuestos/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ estado }),
    }),

  firmar: (
    id: string,
    datos: { expediente_id: string; nombre?: string; apellido?: string; dni?: string }
  ) =>
    pedido<{ id: string; estado: string; cliente_id: string; expediente_id: string }>(
      `/presupuestos/${id}/firmar`,
      { method: 'PATCH', body: JSON.stringify(datos) }
    ),
};