import { pedido } from './http';
export const api = {
    /** Causas importadas del portal, con el expediente al que están vinculadas (si alguno). */
    listarCausas: () => pedido('/portal/causas'),
    /** Causas sin vincular con el mismo número que el expediente (ej. cargado con los datos de una designación). */
    sugeridasDeExpediente: (expedienteId) => pedido(`/expedientes/${expedienteId}/causas-sugeridas`),
    causasDeExpediente: (expedienteId) => pedido(`/expedientes/${expedienteId}/causas-portal`),
    vincularCausa: (expedienteId, causaId) => pedido(`/expedientes/${expedienteId}/causas-portal`, {
        method: 'POST',
        body: JSON.stringify({ causa_portal_id: causaId }),
    }),
    desvincularCausa: (expedienteId, causaId) => pedido(`/expedientes/${expedienteId}/causas-portal/${causaId}`, {
        method: 'DELETE',
    }),
    obtenerEstado: () => pedido('/portal/estado'),
    /** Lee el portal ahora. La API informa el motivo si no se puede (falta configuración, sin causas, rechazo del portal). */
    sincronizar: () => pedido('/portal/sincronizar', { method: 'POST' }),
};
