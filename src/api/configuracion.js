import { pedido } from './http';
export const api = {
    obtener: () => pedido('/configuracion'),
    /** Carga o cambia el número y manda un código a ese número por WhatsApp. */
    cargarWhatsApp: (numero) => pedido('/configuracion/whatsapp', {
        method: 'PUT',
        body: JSON.stringify({ numero }),
    }),
    verificarWhatsApp: (codigo) => pedido('/configuracion/whatsapp/verificar', { method: 'POST', body: JSON.stringify({ codigo }) }),
    quitarWhatsApp: () => pedido('/configuracion/whatsapp', { method: 'DELETE' }),
    /** Comprueba las credenciales en el portal y, solo si las acepta, las guarda cifradas. */
    cargarPortal: (domicilio, clave) => pedido('/configuracion/portal', { method: 'PUT', body: JSON.stringify({ domicilio, clave }) }),
    quitarPortal: () => pedido('/configuracion/portal', { method: 'DELETE' }),
};
