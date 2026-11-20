/** Minúsculas y sin tildes: "Rodriguez" encuentra "Rodríguez". */
export function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

/** Palabras que no ayudan a distinguir una carátula: se ignoran si la búsqueda tiene otras. */
const PALABRAS_VACIAS = new Set(['de', 'del', 'la', 'las', 'el', 'los', 'y', 'e', 'o', 'u', 'en', 'por', 'con', 'contra', 'sobre']);

/**
 * Las palabras de una búsqueda, normalizadas. Los signos separan palabras ("c/", "s/", "-", "/"); las letras
 * sueltas (la "c" de "c/") y las palabras vacías ("de", "la") se descartan cuando hay otras. Mismo criterio que
 * la búsqueda de novedades del servidor (`src/lib/busqueda.ts` de vindexapp-api).
 */
export function palabrasDeBusqueda(busqueda: string): string[] {
  const todas = normalizar(busqueda).split(/[^a-z0-9]+/).filter(Boolean);
  const utiles = todas.filter((p) => !(PALABRAS_VACIAS.has(p) || /^[a-z]$/.test(p)));
  return [...new Set(utiles.length > 0 ? utiles : todas)];
}

/** El texto normalizado, con un solo espacio entre palabras: "PEREZ, Juan C/ GÓMEZ" queda "perez juan c gomez". */
function comoPalabras(texto: string): string {
  return normalizar(texto).split(/[^a-z0-9]+/).filter(Boolean).join(' ');
}

/** Posición donde terminan las palabras buscadas si aparecen en ese orden, o -1. */
function enOrden(palabras: string[], base: string): number {
  let desde = 0;
  for (const p of palabras) {
    const i = base.indexOf(p, desde);
    if (i === -1) return -1;
    desde = i + p.length;
  }
  return desde;
}

/** Todas las palabras de la búsqueda tienen que estar en el texto, en cualquier orden. */
export function coincide(busqueda: string, texto: string): boolean {
  return puntaje(busqueda, texto) !== null;
}

/**
 * Cuánto se parece un elemento a la búsqueda (0 es lo más parecido), o null si no coincide.
 *   0. El título empieza con lo buscado, en ese orden ("perez juan" → "PEREZ JUAN C/ GOMEZ ANA S/ ALIMENTOS").
 *   1. El título contiene lo buscado en ese orden.
 *   2. El título tiene todas las palabras, en cualquier orden.
 *   3. Están todas entre el título y el resto de los datos (juzgado, número, cliente, etc.).
 * Sin búsqueda, todo coincide con 0.
 */
export function puntaje(busqueda: string, titulo: string, resto = ''): number | null {
  const palabras = palabrasDeBusqueda(busqueda);
  if (palabras.length === 0) return 0;
  const baseTitulo = comoPalabras(titulo);
  if (baseTitulo.startsWith(palabras[0]!) && enOrden(palabras, baseTitulo) !== -1) return 0;
  if (enOrden(palabras, baseTitulo) !== -1) return 1;
  if (palabras.every((p) => baseTitulo.includes(p))) return 2;
  const todo = `${baseTitulo} ${comoPalabras(resto)}`;
  if (palabras.every((p) => todo.includes(p))) return 3;
  return null;
}

/**
 * Filtra una lista por la búsqueda y la ordena por parecido con el título. Dentro de cada grupo se respeta el
 * orden original de la lista (por ejemplo, por fecha). Sin búsqueda devuelve la lista tal cual.
 */
export function buscar<T>(lista: T[], busqueda: string, campos: (x: T) => { titulo: string; resto?: string }): T[] {
  if (palabrasDeBusqueda(busqueda).length === 0) return lista;
  return lista
    .map((x, i) => {
      const c = campos(x);
      return { x, i, p: puntaje(busqueda, c.titulo, c.resto) };
    })
    .filter((r): r is { x: T; i: number; p: number } => r.p !== null)
    .sort((a, b) => a.p - b.p || a.i - b.i)
    .map((r) => r.x);
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
