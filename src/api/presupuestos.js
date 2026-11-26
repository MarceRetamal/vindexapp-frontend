import { ESTUDIO_ID, pedido } from './http';
export const api = {
    listarPresupuestos: () => pedido(`/presupuestos?estudio_id=${ESTUDIO_ID}`),
    crearPresupuesto: (datos) => pedido('/presupuestos', {
        method: 'POST',
        body: JSON.stringify({ estudio_id: ESTUDIO_ID, ...datos }),
    }),
    editarPresupuesto: (id, datos) => pedido(`/presupuestos/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(datos),
    }),
    /** Un presupuesto firmado solo se elimina con `confirmarFirmado` (la API lo exige y pide rol titular). */
    eliminarPresupuesto: (id, confirmarFirmado = false) => pedido(`/presupuestos/${id}${confirmarFirmado ? '?confirmar_firmado=1' : ''}`, {
        method: 'DELETE',
    }),
    cambiarEstado: (id, estado) => pedido(`/presupuestos/${id}/estado`, {
        method: 'PATCH',
        body: JSON.stringify({ estado }),
    }),
    firmar: (id, datos) => pedido(`/presupuestos/${id}/firmar`, { method: 'PATCH', body: JSON.stringify(datos) }),
};
