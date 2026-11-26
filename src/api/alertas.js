import { pedido } from './http';
export const api = {
    obtenerEstado: () => pedido('/alertas/estado'),
    /** Manda ahora el resumen de agenda de hoy, sin registrarlo como enviado. */
    enviarAgendaPrueba: () => pedido('/alertas/prueba-agenda', { method: 'POST' }),
    enviarPrueba: () => pedido('/alertas/prueba', { method: 'POST' }),
};
/** Arma el mensaje de un error de la API de avisos, sumando el detalle que informa WhatsApp si lo hay. */
export function mensajeDeError(e) {
    if (!(e instanceof Error))
        return 'No se pudo completar la operación.';
    const cuerpo = e.cuerpo;
    const detalle = typeof cuerpo?.detalle === 'string' ? ` Detalle: ${cuerpo.detalle}` : '';
    const faltan = Array.isArray(cuerpo?.faltan) && cuerpo.faltan.length > 0 ? ` Falta configurar: ${cuerpo.faltan.join(', ')}.` : '';
    return `${e.message}${detalle}${faltan}`;
}
