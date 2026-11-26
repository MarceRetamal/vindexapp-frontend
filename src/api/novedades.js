import { pedido } from './http';
/** Evento que avisa que cambió la cantidad de novedades pendientes (lo escucha el menú lateral). */
export const EVENTO_NOVEDADES = 'novedades:cambio';
export function avisarCambioNovedades() {
    window.dispatchEvent(new Event(EVENTO_NOVEDADES));
}
export const api = {
    listarNovedades: (filtros = {}) => {
        const params = new URLSearchParams();
        if (filtros.estado)
            params.set('estado', filtros.estado);
        if (filtros.q)
            params.set('q', filtros.q);
        if (filtros.expediente_id)
            params.set('expediente_id', filtros.expediente_id);
        if (filtros.limit !== undefined)
            params.set('limit', String(filtros.limit));
        if (filtros.offset !== undefined)
            params.set('offset', String(filtros.offset));
        const consulta = params.toString();
        return pedido(`/novedades${consulta ? `?${consulta}` : ''}`);
    },
    obtenerNovedad: (id) => pedido(`/novedades/${id}`),
    marcarRevisada: (id, revisada) => pedido(`/novedades/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ revisada }),
    }),
    marcarRevisadas: (cuerpo) => pedido('/novedades/marcar-revisadas', {
        method: 'POST',
        body: JSON.stringify(cuerpo),
    }),
    obtenerResumen: () => pedido('/novedades/resumen'),
};
export const apiPlazos = {
    /** Propuestas de plazo para hasta 50 novedades a la vez. */
    plazosSugeridos: (ids) => pedido(`/novedades/plazos-sugeridos?ids=${ids.map(encodeURIComponent).join(',')}`),
};
