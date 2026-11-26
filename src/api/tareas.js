import { ESTUDIO_ID, pedido } from './http';
export const api = {
    listarTodas: () => pedido('/tareas?todas=1'),
    /** Tarea con fecha límite, de un expediente o suelta (ej. el vencimiento que calculó la pantalla Plazos). */
    crearTareaConVencimiento: (datos) => pedido('/tareas', {
        method: 'POST',
        body: JSON.stringify(datos),
    }),
    crearTareaExtrajudicial: (datos) => pedido('/tareas', {
        method: 'POST',
        body: JSON.stringify(datos),
    }),
    /** Un campo en null o '' se vacía; el título no puede quedar vacío. */
    editarTarea: (id, datos) => pedido(`/tareas/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(datos),
    }),
    listarTareas: (expedienteId) => pedido(`/tareas?expediente_id=${expedienteId}`),
    crearTarea: (datos) => pedido('/tareas', {
        method: 'POST',
        body: JSON.stringify({ estudio_id: ESTUDIO_ID, ...datos }),
    }),
    cambiarEstadoTarea: (id, estado) => pedido(`/tareas/${id}/estado`, {
        method: 'PATCH',
        body: JSON.stringify({ estado }),
    }),
    verificarTarea: (id, verificada = true) => pedido(`/tareas/${id}/verificar`, {
        method: 'POST',
        body: JSON.stringify({ verificada }),
    }),
    eliminarTarea: (id) => pedido(`/tareas/${id}`, {
        method: 'DELETE',
    }),
};
