import { pedido } from './http';
export const api = {
    calcularCasasParticulares: (datos) => pedido('/liquidaciones/casas-particulares', {
        method: 'POST',
        body: JSON.stringify(datos),
    }),
};
