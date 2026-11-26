import { ESTUDIO_ID, pedido } from './http';
export const api = {
    obtenerDashboard: () => pedido(`/dashboard?estudio_id=${ESTUDIO_ID}`),
};
export const apiAgenda = {
    obtenerAgenda: (dias = 14) => pedido(`/dashboard/agenda?dias=${dias}`),
};
