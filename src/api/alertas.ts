import { pedido } from './http';

export interface EstadoWhatsApp {
  configurado: boolean;
  faltan: string[];
  estudio_correcto: boolean;
}

export const api = {
  obtenerEstado: () => pedido<{ whatsapp: EstadoWhatsApp }>('/alertas/estado'),

  enviarPrueba: () => pedido<{ enviado: true; pendientes: number }>('/alertas/prueba', { method: 'POST' }),
};

/** Arma el mensaje de un error de la API de avisos, sumando el detalle que informa WhatsApp si lo hay. */
export function mensajeDeError(e: unknown): string {
  if (!(e instanceof Error)) return 'No se pudo completar la operación.';
  const cuerpo = (e as Error & { cuerpo?: { detalle?: unknown; faltan?: unknown } }).cuerpo;
  const detalle = typeof cuerpo?.detalle === 'string' ? ` Detalle: ${cuerpo.detalle}` : '';
  const faltan = Array.isArray(cuerpo?.faltan) && cuerpo.faltan.length > 0 ? ` Falta configurar: ${cuerpo.faltan.join(', ')}.` : '';
  return `${e.message}${detalle}${faltan}`;
}
