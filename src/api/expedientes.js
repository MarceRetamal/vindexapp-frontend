import { ESTUDIO_ID, pedido } from './http';
export const api = {
    listarExpedientes: () => pedido(`/expedientes?estudio_id=${ESTUDIO_ID}`),
    listarDeCliente: (clienteId) => pedido(`/expedientes?cliente_id=${encodeURIComponent(clienteId)}`),
    obtenerExpediente: (id) => pedido(`/expedientes/${id}?estudio_id=${ESTUDIO_ID}`),
    crearExpediente: (datos) => pedido('/expedientes', {
        method: 'POST',
        body: JSON.stringify({ estudio_id: ESTUDIO_ID, ...datos }),
    }),
    editarExpediente: (id, datos) => pedido(`/expedientes/${id}?estudio_id=${ESTUDIO_ID}`, {
        method: 'PATCH',
        body: JSON.stringify(datos),
    }),
    darDeBajaExpediente: (id, motivo) => pedido(`/expedientes/${id}/baja?estudio_id=${ESTUDIO_ID}`, {
        method: 'PATCH',
        body: JSON.stringify({ motivo }),
    }),
    reactivarExpediente: (id) => pedido(`/expedientes/${id}/reactivar?estudio_id=${ESTUDIO_ID}`, {
        method: 'PATCH',
    }),
    /** Con `conContenido` borra también todo lo que cuelga del expediente (la API lo exige como confirmación). */
    eliminarExpediente: (id, conContenido = false) => pedido(`/expedientes/${id}${conContenido ? '?con_contenido=1' : ''}`, {
        method: 'DELETE',
    }),
};
