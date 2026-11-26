import { ESTUDIO_ID, pedido } from './http';
export const api = {
    listarClientes: () => pedido(`/clientes?estudio_id=${ESTUDIO_ID}`),
    obtenerCliente: (id) => pedido(`/clientes/${id}`),
    crearCliente: (datos) => pedido('/clientes', {
        method: 'POST',
        body: JSON.stringify({ estudio_id: ESTUDIO_ID, ...datos }),
    }),
    /** Causas importadas del portal, todavía sin vincular, cuya carátula puede ser de este cliente. */
    causasSugeridas: (id) => pedido(`/clientes/${id}/causas-sugeridas`),
    /** Crea un expediente del cliente por cada causa, con los datos del portal, y lo vincula con ella. */
    crearExpedientesDesdeCausas: (id, causaIds) => pedido(`/clientes/${id}/causas-portal`, { method: 'POST', body: JSON.stringify({ causa_portal_ids: causaIds }) }),
    actualizarCliente: (id, datos) => pedido(`/clientes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(datos),
    }),
    /** Con `conContenido` borra también todo lo que cuelga del cliente (la API lo exige como confirmación). */
    eliminarCliente: (id, conContenido = false) => pedido(`/clientes/${id}${conContenido ? '?con_contenido=1' : ''}`, {
        method: 'DELETE',
    }),
};
export const apiAsignacion = {
    disponibles: (clienteId) => pedido(`/clientes/${encodeURIComponent(clienteId)}/expedientes-disponibles`),
    asignar: (clienteId, expedienteIds, rol) => pedido(`/clientes/${encodeURIComponent(clienteId)}/expedientes`, {
        method: 'POST',
        body: JSON.stringify({ expediente_ids: expedienteIds, ...(rol ? { rol_profesional: rol } : {}) }),
    }),
};
