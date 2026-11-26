import { ESTUDIO_ID, pedido } from './http';
export const api = {
    listarAudiencias: () => pedido(`/audiencias?estudio_id=${ESTUDIO_ID}`),
    listarDeExpediente: (expedienteId) => pedido(`/audiencias?expediente_id=${encodeURIComponent(expedienteId)}`),
    crearAudiencia: (datos) => pedido('/audiencias', {
        method: 'POST',
        body: JSON.stringify({ estudio_id: ESTUDIO_ID, ...datos }),
    }),
    cambiarEstado: (id, estado) => pedido(`/audiencias/${id}/estado`, {
        method: 'PATCH',
        body: JSON.stringify({ estado }),
    }),
    eliminarAudiencia: (id) => pedido(`/audiencias/${id}`, { method: 'DELETE' }),
};
