import { ESTUDIO_ID, pedido } from './http';
export const api = {
    listarReporteExpedientes: () => pedido(`/reportes/expedientes?estudio_id=${ESTUDIO_ID}`),
    listarReportePresupuestos: (desde, hasta) => {
        const query = new URLSearchParams({ estudio_id: ESTUDIO_ID });
        if (desde)
            query.set('desde', desde);
        if (hasta)
            query.set('hasta', hasta);
        return pedido(`/reportes/presupuestos?${query.toString()}`);
    },
};
