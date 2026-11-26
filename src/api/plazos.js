import { pedido } from './http';
export const api = {
    calcular: (datos) => pedido('/plazos/calcular', { method: 'POST', body: JSON.stringify(datos) }),
    calendario: (desde, hasta) => {
        const q = new URLSearchParams();
        if (desde)
            q.set('desde', desde);
        if (hasta)
            q.set('hasta', hasta);
        const s = q.toString();
        return pedido(`/plazos/calendario${s ? `?${s}` : ''}`);
    },
    agregarDia: (datos) => pedido('/plazos/calendario/dias', { method: 'POST', body: JSON.stringify(datos) }),
    eliminarDia: (id) => pedido(`/plazos/calendario/dias/${id}`, { method: 'DELETE' }),
    fijarVerificacion: (verificado_hasta, fuente) => pedido('/plazos/calendario/verificacion', { method: 'PUT', body: JSON.stringify({ verificado_hasta, fuente }) }),
};
