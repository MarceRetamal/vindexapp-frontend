import { ESTUDIO_ID, pedido } from './http';
export const api = {
    generarDocumento: (datos) => pedido('/generador-documentos', {
        method: 'POST',
        body: JSON.stringify({ estudio_id: ESTUDIO_ID, ...datos }),
    }),
};
