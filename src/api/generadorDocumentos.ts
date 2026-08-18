import { ESTUDIO_ID, pedido } from './http';

export const api = {
  generarDocumento: (datos: {
    template_id: string;
    expediente_id: string;
    categoria_resultado?: string;
  }) =>
    pedido<{ id: string; nombre: string; ruta_r2: string }>('/generador-documentos', {
      method: 'POST',
      body: JSON.stringify({ estudio_id: ESTUDIO_ID, ...datos }),
    }),
};
