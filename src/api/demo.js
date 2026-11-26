import { pedido } from './http';
export const api = {
    estado: () => pedido('/demo/estado'),
    /** Prepara la demostración o la restablece: borra los datos de ejemplo y los vuelve a armar con las fechas de hoy. */
    restablecer: () => pedido('/demo/restablecer', { method: 'POST' }),
};
