/** Minúsculas y sin tildes: "Rodriguez" encuentra "Rodríguez". */
export function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** Todas las palabras de la búsqueda tienen que estar en el texto, en cualquier orden. */
export function coincide(busqueda: string, texto: string): boolean {
  const palabras = normalizar(busqueda).split(/\s+/).filter(Boolean);
  if (palabras.length === 0) return true;
  const base = normalizar(texto);
  return palabras.every((p) => base.includes(p));
}

/**
 * PARCHE DE SEGURIDAD: un enlace que viene de afuera (el portal, la extensión) solo se usa si es http o https.
 * Un enlace "javascript:" ejecutaría código en el panel al hacer clic.
 */
export function enlaceSeguro(enlace: string | null | undefined): string | null {
  if (!enlace) return null;
  try {
    const url = new URL(enlace);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
}
