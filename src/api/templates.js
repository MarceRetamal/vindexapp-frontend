import { ESTUDIO_ID, pedido } from './http';
export const api = {
    listarTemplates: (categoria) => {
        const query = new URLSearchParams({ estudio_id: ESTUDIO_ID });
        if (categoria)
            query.set('categoria', categoria);
        return pedido(`/templates?${query.toString()}`);
    },
};
