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
