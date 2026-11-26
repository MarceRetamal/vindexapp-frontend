import { ESTUDIO_ID, pedido } from './http';
export const api = {
    listarActuaciones: (expedienteId) => pedido(`/actuaciones?expediente_id=${expedienteId}`),
    crearActuacion: (datos) => pedido('/actuaciones', {
        method: 'POST',
        body: JSON.stringify({ estudio_id: ESTUDIO_ID, ...datos }),
    }),
    notificarActuacion: (id) => pedido(`/actuaciones/${id}/notificar`, {
        method: 'PATCH',
    }),
    eliminarActuacion: (id) => pedido(`/actuaciones/${id}`, { method: 'DELETE' }),
};
