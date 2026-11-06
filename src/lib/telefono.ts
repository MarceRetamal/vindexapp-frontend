/**
 * Enlace de WhatsApp para un número argentino de celular, solo cuando el formato no deja dudas:
 * código de área y número sin 0 ni 15 (10 dígitos), con o sin 54 y 9 adelante. Con cualquier otro formato no hay
 * enlace: el número se muestra tal cual y se copia a mano, antes que mandar un mensaje a un número mal armado.
 */
export function enlaceWhatsApp(numero: string | null): string | null {
  if (!numero) return null;
  const d = numero.replace(/\D/g, '');
  if (/^549\d{10}$/.test(d)) return `https://wa.me/${d}`;
  if (/^54\d{10}$/.test(d)) return `https://wa.me/549${d.slice(2)}`;
  if (/^\d{10}$/.test(d)) return `https://wa.me/549${d}`;
  return null;
}
